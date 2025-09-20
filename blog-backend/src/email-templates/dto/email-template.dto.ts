// src/email-templates/dto/email-template.dto.ts
import { IsString, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';

export class CreateEmailTemplateDto {
  @IsEnum(['new_article', 'author_published', 'category_update', 'welcome', 'password_reset'])
  type: 'new_article' | 'author_published' | 'category_update' | 'welcome' | 'password_reset';

  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsString()
  htmlContent: string;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableVariables?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableVariables?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
