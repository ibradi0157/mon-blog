import { IsString, MinLength, IsUUID } from 'class-validator';

export class ResetPasswordDto {
  @IsUUID()
  tokenId: string;

  @IsUUID()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;

  @IsString()
  @MinLength(6)
  confirmPassword: string;
}
