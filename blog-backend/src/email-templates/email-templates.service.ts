// src/email-templates/email-templates.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from './email-template.entity';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class EmailTemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
    private cacheService: CacheService,
  ) {}

  async onModuleInit() {
    await this.createDefaultTemplates();
  }

  private async createDefaultTemplates() {
    const defaultTemplates = [
      {
        type: 'new_article' as const,
        name: 'Nouvel Article',
        subject: 'Nouvel article sur {{siteName}}: {{articleTitle}}',
        description: 'Template envoyé lors de la publication d\'un nouvel article',
        availableVariables: [
          '{{siteName}}', '{{articleTitle}}', '{{articleUrl}}', '{{articleExcerpt}}',
          '{{authorName}}', '{{categoryName}}', '{{userName}}', '{{unsubscribeUrl}}'
        ],
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nouvel article - {{siteName}}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .article-card { border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Bonjour {{userName}} 👋</h1>
              <p>Un nouvel article vient d'être publié sur <strong>{{siteName}}</strong> !</p>
            </div>
            
            <div class="article-card">
              <h2>{{articleTitle}}</h2>
              <p><strong>Par:</strong> {{authorName}}</p>
              <p><strong>Catégorie:</strong> {{categoryName}}</p>
              <p>{{articleExcerpt}}</p>
              <a href="{{articleUrl}}" class="btn">Lire l'article</a>
            </div>
            
            <div class="footer">
              <p>Vous recevez cet email car vous êtes abonné aux notifications de {{siteName}}.</p>
              <p><a href="{{unsubscribeUrl}}">Se désabonner</a></p>
            </div>
          </body>
          </html>
        `,
        textContent: `
          Bonjour {{userName}},

          Un nouvel article vient d'être publié sur {{siteName}} !

          Titre: {{articleTitle}}
          Auteur: {{authorName}}
          Catégorie: {{categoryName}}

          {{articleExcerpt}}

          Lire l'article: {{articleUrl}}

          ---
          Vous recevez cet email car vous êtes abonné aux notifications de {{siteName}}.
          Se désabonner: {{unsubscribeUrl}}
        `
      },
      {
        type: 'author_published' as const,
        name: 'Auteur a Publié',
        subject: '{{authorName}} a publié un nouvel article',
        description: 'Template envoyé quand un auteur suivi publie un article',
        availableVariables: [
          '{{siteName}}', '{{articleTitle}}', '{{articleUrl}}', '{{articleExcerpt}}',
          '{{authorName}}', '{{categoryName}}', '{{userName}}', '{{unsubscribeUrl}}'
        ],
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nouvel article de {{authorName}} - {{siteName}}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .article-card { border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Bonjour {{userName}} 👋</h1>
              <p><strong>{{authorName}}</strong> que vous suivez a publié un nouvel article !</p>
            </div>
            
            <div class="article-card">
              <h2>{{articleTitle}}</h2>
              <p><strong>Catégorie:</strong> {{categoryName}}</p>
              <p>{{articleExcerpt}}</p>
              <a href="{{articleUrl}}" class="btn">Lire l'article</a>
            </div>
            
            <div class="footer">
              <p>Vous recevez cet email car vous suivez {{authorName}} sur {{siteName}}.</p>
              <p><a href="{{unsubscribeUrl}}">Se désabonner</a></p>
            </div>
          </body>
          </html>
        `,
        textContent: `
          Bonjour {{userName}},

          {{authorName}} que vous suivez a publié un nouvel article !

          Titre: {{articleTitle}}
          Catégorie: {{categoryName}}

          {{articleExcerpt}}

          Lire l'article: {{articleUrl}}

          ---
          Vous recevez cet email car vous suivez {{authorName}} sur {{siteName}}.
          Se désabonner: {{unsubscribeUrl}}
        `
      },
      {
        type: 'category_update' as const,
        name: 'Mise à jour Catégorie',
        subject: 'Nouvel article dans {{categoryName}}',
        description: 'Template envoyé pour les abonnements par catégorie',
        availableVariables: [
          '{{siteName}}', '{{articleTitle}}', '{{articleUrl}}', '{{articleExcerpt}}',
          '{{authorName}}', '{{categoryName}}', '{{userName}}', '{{unsubscribeUrl}}'
        ],
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nouvel article dans {{categoryName}} - {{siteName}}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .article-card { border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .category-badge { display: inline-block; background: #6f42c1; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
              .btn { display: inline-block; padding: 12px 24px; background: #6f42c1; color: white; text-decoration: none; border-radius: 6px; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Bonjour {{userName}} 👋</h1>
              <p>Un nouvel article a été publié dans la catégorie <strong>{{categoryName}}</strong> que vous suivez !</p>
            </div>
            
            <div class="article-card">
              <span class="category-badge">{{categoryName}}</span>
              <h2>{{articleTitle}}</h2>
              <p><strong>Par:</strong> {{authorName}}</p>
              <p>{{articleExcerpt}}</p>
              <a href="{{articleUrl}}" class="btn">Lire l'article</a>
            </div>
            
            <div class="footer">
              <p>Vous recevez cet email car vous êtes abonné à la catégorie {{categoryName}} sur {{siteName}}.</p>
              <p><a href="{{unsubscribeUrl}}">Se désabonner</a></p>
            </div>
          </body>
          </html>
        `,
        textContent: `
          Bonjour {{userName}},

          Un nouvel article a été publié dans la catégorie {{categoryName}} que vous suivez !

          Titre: {{articleTitle}}
          Auteur: {{authorName}}

          {{articleExcerpt}}

          Lire l'article: {{articleUrl}}

          ---
          Vous recevez cet email car vous êtes abonné à la catégorie {{categoryName}} sur {{siteName}}.
          Se désabonner: {{unsubscribeUrl}}
        `
      }
    ];

    for (const template of defaultTemplates) {
      const existingTemplate = await this.emailTemplateRepository.findOne({
        where: { type: template.type }
      });

      if (!existingTemplate) {
        await this.emailTemplateRepository.save(
          this.emailTemplateRepository.create({
            ...template,
            isActive: true
          })
        );
      }
    }
  }

  async findAll(): Promise<EmailTemplate[]> {
    const cacheKey = 'email-templates:all';
    
    let templates = await this.cacheService.get<EmailTemplate[]>(cacheKey);
    if (!templates) {
      templates = await this.emailTemplateRepository.find({
        order: { type: 'ASC' }
      });
      await this.cacheService.set(cacheKey, templates, { ttl: 300 }); // 5 minutes
    }

    return templates;
  }

  async findOne(id: string): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id }
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return template;
  }

  async findByType(type: string): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findOne({
      where: { type: type as any, isActive: true }
    });

    if (!template) {
      throw new NotFoundException(`Email template of type ${type} not found`);
    }

    return template;
  }

  async create(createDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    const existingTemplate = await this.emailTemplateRepository.findOne({
      where: { type: createDto.type }
    });

    if (existingTemplate) {
      throw new ConflictException('Template with this type already exists');
    }

    const template = this.emailTemplateRepository.create({
      ...createDto,
      isActive: createDto.isActive ?? true
    });

    const saved = await this.emailTemplateRepository.save(template);
    await this.clearCache();
    return saved;
  }

  async update(id: string, updateDto: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    const template = await this.findOne(id);
    
    Object.assign(template, updateDto);
    const saved = await this.emailTemplateRepository.save(template);
    await this.clearCache();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.emailTemplateRepository.remove(template);
    await this.clearCache();
  }

  async renderTemplate(type: string, variables: Record<string, string>): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.findByType(type);
    
    let subject = template.subject;
    let html = template.htmlContent;
    let text = template.textContent;

    // Replace variables in subject, html, and text content
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
      subject = subject.replace(regex, value || '');
      html = html.replace(regex, value || '');
      if (text) {
        text = text.replace(regex, value || '');
      }
    }

    return { subject, html, text };
  }

  private async clearCache(): Promise<void> {
    await this.cacheService.del('email-templates:all');
  }
}
