import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Asia/Kolkata', 'UTC', 'Asia/Dubai', 'Asia/Singapore'])
  timezone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['INR'])
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
