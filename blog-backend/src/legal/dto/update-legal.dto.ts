import { IsString, MinLength } from 'class-validator';

export class UpdateLegalDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(10)
  content!: string; // HTML content
}
