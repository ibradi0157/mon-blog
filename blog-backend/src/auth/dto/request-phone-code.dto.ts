import { IsEmail, IsOptional, Matches } from 'class-validator';

export class RequestPhoneCodeDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/)
  phoneNumber?: string;
}
