// src/site-settings/site-settings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettings } from './site-settings.entity';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettings) private repo: Repository<SiteSettings>,
    private cacheService: CacheService,
  ) {}

  async getSettings(): Promise<SiteSettings> {
    const cacheKey = 'site-settings:current';
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // TypeORM 0.3: findOne without a where clause is not allowed. Fetch latest via find({ take: 1 }).
        const rows = await this.repo.find({ order: { createdAt: 'DESC' }, take: 1 });
        let settings = rows[0];
        if (!settings) {
          // Create default settings
          settings = this.repo.create({
            siteName: 'Mon Blog',
            siteDescription: 'Un blog moderne et élégant',
            defaultTheme: 'light',
            showPoweredBy: true,
          });
          settings = await this.repo.save(settings);
        }
        return settings;
      },
      { ttl: 300 } // 5 minutes cache
    );
  }

  async updateSettings(dto: UpdateSiteSettingsDto): Promise<SiteSettings> {
    // See note above: use find({ take: 1 }) to get the latest row safely across TypeORM versions
    const rows = await this.repo.find({ order: { createdAt: 'DESC' }, take: 1 });
    let settings = rows[0];
    
    if (!settings) {
      settings = this.repo.create(dto);
    } else {
      Object.assign(settings, dto);
    }
    
    const saved = await this.repo.save(settings);
    
    // Clear cache
    await this.cacheService.del('site-settings:current');
    await this.cacheService.invalidateTag('site-settings');
    
    return saved;
  }

  async getPublicSettings(): Promise<Partial<SiteSettings>> {
    const settings = await this.getSettings();
    
    // Return only public-safe settings
    return {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      defaultTheme: settings.defaultTheme,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      metaTitle: settings.metaTitle,
      metaDescription: settings.metaDescription,
      metaKeywords: settings.metaKeywords,
      ogImage: settings.ogImage,
      twitterHandle: settings.twitterHandle,
      socialFacebook: settings.socialFacebook,
      socialTwitter: settings.socialTwitter,
      socialInstagram: settings.socialInstagram,
      socialLinkedIn: settings.socialLinkedIn,
      socialYoutube: settings.socialYoutube,
      footerText: settings.footerText,
      showPoweredBy: settings.showPoweredBy,
      homepageConfig: settings.homepageConfig,
    };
  }

  async resetToDefaults(): Promise<SiteSettings> {
    // Get latest settings row (if any)
    const rows = await this.repo.find({ order: { createdAt: 'DESC' }, take: 1 });
    let settings = rows[0];

    const defaults: Partial<SiteSettings> = {
      siteName: 'Mon Blog',
      siteDescription: 'Un blog moderne et élégant',
      logoUrl: null as any,
      faviconUrl: null as any,
      defaultTheme: 'light',
      primaryColor: null as any,
      secondaryColor: null as any,
      metaTitle: null as any,
      metaDescription: null as any,
      metaKeywords: null as any,
      ogImage: null as any,
      twitterHandle: null as any,
      googleAnalyticsId: null as any,
      facebookPixelId: null as any,
      contactEmail: null as any,
      socialFacebook: null as any,
      socialTwitter: null as any,
      socialInstagram: null as any,
      socialLinkedIn: null as any,
      socialYoutube: null as any,
      footerText: null as any,
      showPoweredBy: true,
      homepageConfig: null as any,
    };

    if (!settings) {
      settings = this.repo.create(defaults);
    } else {
      Object.assign(settings, defaults);
    }

    const saved = await this.repo.save(settings);

    // Invalidate cache
    await this.cacheService.del('site-settings:current');
    await this.cacheService.invalidateTag('site-settings');

    return saved;
  }
}
