import { IsString, IsOptional, IsBoolean, IsArray, IsObject, ValidateNested, IsUrl, Length } from 'class-validator';
import { Type } from 'class-transformer';

class FooterLinkDto {
  @IsString()
  @Length(1, 255)
  text: string;

  @IsString()
  @Length(1, 500)
  href: string;

  @IsOptional()
  @IsBoolean()
  external?: boolean;
}

class FooterSectionDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  links: FooterLinkDto[];
}

class SocialLinksDto {
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @IsOptional()
  @IsUrl()
  twitter?: string;

  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @IsOptional()
  @IsUrl()
  instagram?: string;

  @IsOptional()
  @IsUrl()
  youtube?: string;

  @IsOptional()
  @IsUrl()
  github?: string;
}

export class UpdateFooterDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterSectionDto)
  sections?: FooterSectionDto[];

  @IsOptional()
  @IsString()
  @Length(1, 255)
  copyrightText?: string;

  @IsOptional()
  @IsBoolean()
  showSocialLinks?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @IsOptional()
  @IsString()
  @Length(4, 100)
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  @Length(4, 100)
  textColor?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
