import { IsDateString, IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ScheduleArticleDto {
  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsBoolean()
  autoSocialShare?: boolean;

  @IsOptional()
  @IsBoolean()
  sendNotification?: boolean;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  autoSocialShare?: boolean;

  @IsOptional()
  @IsBoolean()
  sendNotification?: boolean;
}

export class CreateVersionDto {
  @IsString()
  changeSummary: string;
}
