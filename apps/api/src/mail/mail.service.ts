import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private fromAddress: string;

  constructor(private config: ConfigService) {
    this.fromAddress =
      this.config.get('SMTP_FROM') || 'SiteFlow <noreply@siteflow.local>';
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') || 587),
        secure: String(this.config.get('SMTP_SECURE') || 'false') === 'true',
        auth:
          this.config.get('SMTP_USER') && this.config.get('SMTP_PASS')
            ? {
                user: this.config.get<string>('SMTP_USER'),
                pass: this.config.get<string>('SMTP_PASS'),
              }
            : undefined,
      });
      this.logger.log(`SMTP mail transport configured (${host})`);
    } else {
      this.logger.log('SMTP not configured — password reset emails logged to console');
    }
  }

  async sendPasswordReset(params: {
    to: string;
    fullName: string;
    token: string;
  }) {
    const appUrl = (this.config.get('APP_URL') || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(params.token)}`;
    const subject = 'SiteFlow password reset';
    const text = `Hi ${params.fullName},

Use this link to reset your SiteFlow password (expires soon):
${resetUrl}

If you did not request this, ignore this email.

— SiteFlow`;
    const html = `<p>Hi ${params.fullName},</p>
<p>Use this link to reset your SiteFlow password:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you did not request this, ignore this email.</p>`;

    if (!this.transporter) {
      this.logger.warn(`[dev-mail] Password reset for ${params.to}: ${resetUrl}`);
      return { delivered: false, mode: 'console' as const, resetUrl };
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: params.to,
      subject,
      text,
      html,
    });
    return { delivered: true, mode: 'smtp' as const };
  }
}
