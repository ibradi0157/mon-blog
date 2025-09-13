// src/articles/dto/create-article.dto.ts
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength, IsUUID } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
  // ...existing code...
  @IsString()
  @IsOptional()
  authorId?: string;

  @IsString()
  @IsOptional()
  authorRole?: string;
// ...existing code...
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
