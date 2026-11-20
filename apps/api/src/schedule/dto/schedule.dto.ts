import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ScheduleTaskStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateScheduleTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  siteId?: string | null;

  @ApiProperty({ example: 'Call plumber for bathroom fittings' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({ example: 'Plumbing' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

  @ApiProperty({ example: '2026-11-06' })
  @IsDateString()
  scheduledDate!: string;

  @ApiPropertyOptional({ enum: ScheduleTaskStatus })
  @IsOptional()
  @IsEnum(ScheduleTaskStatus)
  status?: ScheduleTaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;
}

export class UpdateScheduleTaskDto extends PartialType(CreateScheduleTaskDto) {}
