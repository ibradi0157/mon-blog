import { IsEnum, IsUUID, IsOptional, IsObject } from 'class-validator';
import { PreferenceType } from '../user-preferences.entity';

export class CreateUserPreferenceDto {
  @IsEnum(PreferenceType)
  type: PreferenceType;

  @IsUUID()
  targetId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateUserPreferenceDto {
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
