// src/comments/dto/create-comment.dto.ts
import { IsString, MinLength, IsUUID, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(2)
  content: string;

  @IsUUID()
  articleId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}