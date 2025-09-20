import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Footer } from './footer.entity';
import { UpdateFooterDto } from './dto/update-footer.dto';

@Injectable()
export class FooterService {
  constructor(
    @InjectRepository(Footer)
    private readonly footerRepo: Repository<Footer>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getFooter() {
    const cacheKey = 'footer:active';
    
    // Try cache first
    let footer = await this.cacheManager.get<Footer>(cacheKey);
    if (footer) return footer;

    // Get from database
    footer = await this.footerRepo.findOne({
      where: { isActive: true },
      order: { updatedAt: 'DESC' }
    });

    if (!footer) {
      // Create default footer if none exists
      footer = await this.createDefaultFooter();
    }

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, footer, 5 * 60 * 1000);
    return footer;
  }

  async getFooterForAdmin() {
    return await this.footerRepo.findOne({
      where: { isActive: true },
      order: { updatedAt: 'DESC' }
    }) || await this.createDefaultFooter();
  }

  async updateFooter(updateData: UpdateFooterDto) {
    let footer = await this.footerRepo.findOne({
      where: { isActive: true }
    });

    if (!footer) {
      footer = await this.createDefaultFooter();
    }

    // Update footer with new data
    Object.assign(footer, updateData);
    footer.updatedAt = new Date();

    const saved = await this.footerRepo.save(footer);
    
    // Clear cache
    await this.cacheManager.del('footer:active');
    
    return {
      success: true,
      message: 'Footer mis à jour avec succès',
      data: saved
    };
  }

  async getPublicFooter() {
    const footer = await this.getFooter();
    
    // Return only public fields
    return {
      title: footer.title,
      description: footer.description,
      sections: footer.sections,
      copyrightText: footer.copyrightText,
      showSocialLinks: footer.showSocialLinks,
      socialLinks: footer.socialLinks,
      backgroundColor: footer.backgroundColor,
      textColor: footer.textColor,
    };
  }

  private async createDefaultFooter(): Promise<Footer> {
    const defaultFooter = this.footerRepo.create({
      title: 'Mon Blog',
      description: 'Une plateforme moderne pour partager des idées, découvrir du contenu de qualité et connecter avec une communauté passionnée.',
      sections: [
        {
          title: 'Navigation',
          links: [
            { text: 'Accueil', href: '/', external: false },
            { text: 'Articles', href: '/articles', external: false },
            { text: 'Catégories', href: '/categories', external: false },
          ]
        },
        {
          title: 'Légal',
          links: [
            { text: 'Confidentialité', href: '/privacy', external: false },
            { text: 'Conditions', href: '/terms', external: false },
          ]
        }
      ],
      copyrightText: `© ${new Date().getFullYear()} Mon Blog. Tous droits réservés.`,
      showSocialLinks: false,
      socialLinks: {},
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      isActive: true,
    });

    return await this.footerRepo.save(defaultFooter);
  }

  async resetToDefault() {
    // Deactivate current footer
    await this.footerRepo.update(
      { isActive: true },
      { isActive: false }
    );

    // Create new default footer
    const footer = await this.createDefaultFooter();

    // Clear cache
    await this.cacheManager.del('footer:active');

    return {
      success: true,
      message: 'Footer réinitialisé aux valeurs par défaut',
      data: footer
    };
  }
}
