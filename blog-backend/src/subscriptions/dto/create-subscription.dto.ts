// src/subscriptions/dto/create-subscription.dto.ts
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsEnum(['category', 'author', 'all_articles'])
  type: 'category' | 'author' | 'all_articles';

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsEnum(['instant', 'daily', 'weekly'])
  frequency?: 'instant' | 'daily' | 'weekly';
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(['instant', 'daily', 'weekly'])
  frequency?: 'instant' | 'daily' | 'weekly';

  @IsOptional()
  isActive?: boolean;
}
