// src/articles/dto/admin-articles-stats-bulk.dto.ts
import { IsArray, ArrayNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminArticlesStatsBulkDto {
  // Accept ids as comma-separated string in query (?ids=a,b,c) and transform to array
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map((v: string) => v.trim()).filter(Boolean) : value))
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true }) // switch to IsUUID('4', {each:true}) if IDs are UUIDs
  ids!: string[];
}
