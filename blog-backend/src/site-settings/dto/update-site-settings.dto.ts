// src/site-settings/dto/update-site-settings.dto.ts
import { IsOptional, IsString, IsBoolean, IsIn, IsEmail, IsUrl, MaxLength } from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  siteName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  siteDescription?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @IsOptional()
  @IsIn(['light', 'dark', 'auto'])
  defaultTheme?: 'light' | 'dark' | 'auto';

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  // SEO Settings
  @IsOptional()
  @IsString()
  @MaxLength(60)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaKeywords?: string;

  @IsOptional()
  @IsUrl()
  ogImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  twitterHandle?: string;

  @IsOptional()
  @IsString()
  googleAnalyticsId?: string;

  @IsOptional()
  @IsString()
  facebookPixelId?: string;

  // Contact & Social
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsUrl()
  socialFacebook?: string;

  @IsOptional()
  @IsUrl()
  socialTwitter?: string;

  @IsOptional()
  @IsUrl()
  socialInstagram?: string;

  @IsOptional()
  @IsUrl()
  socialLinkedIn?: string;

  @IsOptional()
  @IsUrl()
  socialYoutube?: string;

  // Footer Settings
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  footerText?: string;

  @IsOptional()
  @IsBoolean()
  showPoweredBy?: boolean;

  // Homepage Settings
  @IsOptional()
  homepageConfig?: any;
}
