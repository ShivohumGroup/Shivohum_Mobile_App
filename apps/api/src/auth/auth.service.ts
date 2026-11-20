import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, JwtPayload } from './types';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterOrganizationDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { MailService } from '../mail/mail.service';
import { DEFAULT_EXPENSE_CATEGORIES } from '@siteflow/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async registerOrganization(dto: RegisterOrganizationDto, meta?: { userAgent?: string; ip?: string }) {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const codeBase = (dto.organizationCode || dto.organizationName)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);
    let code = codeBase || `ORG-${randomBytes(3).toString('hex').toUpperCase()}`;
    const codeTaken = await this.prisma.organization.findUnique({ where: { code } });
    if (codeTaken) {
      code = `${codeBase.slice(0, 18)}-${randomBytes(2).toString('hex').toUpperCase()}`;
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const { org, admin } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName.trim(),
          code,
          timezone: 'Asia/Kolkata',
          currency: 'INR',
        },
      });

      const adminUser = await tx.user.create({
        data: {
          organizationId: organization.id,
          email,
          passwordHash,
          fullName: dto.fullName.trim(),
          phone: dto.phone || null,
          role: UserRole.ADMIN,
          isActive: true,
        },
        include: { organization: true },
      });

      for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
        await tx.expenseCategory.create({
          data: {
            organizationId: organization.id,
            name: DEFAULT_EXPENSE_CATEGORIES[i],
            sortOrder: i,
          },
        });
      }

      return { org: organization, admin: adminUser };
    });

    const tokens = await this.issueTokens(
      {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        organizationId: admin.organizationId,
        isActive: admin.isActive,
      },
      meta,
    );

    return {
      ...tokens,
      user: this.sanitizeUser(admin),
      organization: {
        id: org.id,
        name: org.name,
        code: org.code,
      },
    };
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ip?: string }) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { organization: true },
    });
    if (!user || !user.isActive || !user.organization.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        isActive: user.isActive,
      },
      meta,
    );

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refresh(refreshToken: string, meta?: { userAgent?: string; ip?: string }) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, userId: payload.sub },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // possible reuse — revoke family
      if (payload.familyId) {
        await this.prisma.refreshToken.updateMany({
          where: { familyId: payload.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('User inactive');

    // rotate
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        isActive: user.isActive,
      },
      meta,
      payload.familyId || stored.familyId,
    );

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedBy: undefined },
    });

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({ where: { email, isActive: true } });
    // Always return success to avoid email enumeration
    if (!user) {
      return {
        success: true,
        message: 'If the account exists, a reset token has been issued.',
      };
    }

    const raw = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(raw);
    const ttl = Number(this.config.get('PASSWORD_RESET_TTL_MINUTES') || 60);
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + ttl * 60 * 1000),
      },
    });

    const mailResult = await this.mail.sendPasswordReset({
      to: user.email,
      fullName: user.fullName,
      token: raw,
    });

    const response: Record<string, unknown> = {
      success: true,
      message: 'If the account exists, a reset token has been issued.',
    };
    // Dev convenience only — never expose reset tokens in production responses.
    if (process.env.NODE_ENV !== 'production') {
      response.devResetToken = raw;
      if (mailResult.mode === 'console' && 'resetUrl' in mailResult) {
        response.devResetUrl = mailResult.resetUrl;
      }
    }
    return response;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async issueTokens(
    user: AuthUser,
    meta?: { userAgent?: string; ip?: string },
    familyId?: string,
  ) {
    const family = familyId || cryptoRandomUuid();
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      type: 'access',
    };
    const refreshPayload: JwtPayload = {
      ...accessPayload,
      type: 'refresh',
      familyId: family,
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.get('JWT_ACCESS_SECRET') || 'dev-access-secret',
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') || '15m',
    });
    const refreshExpires = this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.get('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
      expiresIn: refreshExpires,
    });

    const expiresAt = this.parseExpiry(refreshExpires);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        familyId: family,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ip,
      },
    });

    return { accessToken, refreshToken, tokenType: 'Bearer' as const };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(exp: string): Date {
    const match = /^(\d+)([smhd])$/.exec(exp);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const n = Number(match[1]);
    const unit = match[2];
    const mult =
      unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
    return new Date(Date.now() + n * mult);
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: AuthUser['role'];
    organizationId: string;
    isActive: boolean;
    organization?: { id: string; name: string; code: string; timezone: string; currency: string };
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      organizationId: user.organizationId,
      isActive: user.isActive,
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            code: user.organization.code,
            timezone: user.organization.timezone,
            currency: user.organization.currency,
          }
        : undefined,
    };
  }
}

function cryptoRandomUuid() {
  return randomBytes(16).toString('hex').replace(
    /(.{8})(.{4})(.{4})(.{4})(.{12})/,
    '$1-$2-$3-$4-$5',
  );
}
