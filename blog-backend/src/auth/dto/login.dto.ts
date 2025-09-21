// src/auth/dto/login.dto.ts
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  // Google reCAPTCHA v2 token (required only in production)
  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}
