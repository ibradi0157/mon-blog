// src/subscriptions/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import { NotificationQueue } from './notification-queue.entity';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(
    private readonly configService: ConfigService,
    private readonly siteSettingsService: SiteSettingsService,
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {
    this.createTransporter();
  }

  private createTransporter() {
    const emailConfig = this.configService.get('email');
    
    if (emailConfig?.service === 'mailjet') {
      this.transporter = nodemailer.createTransport({
        service: 'Mailjet',
        auth: {
          user: emailConfig.mailjet?.apiKey,
          pass: emailConfig.mailjet?.secretKey,
        },
      });
    } else {
      // Use Ethereal for development/testing
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: emailConfig?.ethereal?.user || 'ethereal.user@ethereal.email',
          pass: emailConfig?.ethereal?.pass || 'ethereal.password',
        },
      });
    }
  }

  async sendNotificationEmail(notification: NotificationQueue): Promise<boolean> {
    try {
      const siteSettings = await this.siteSettingsService.getPublicSettings();
      const siteName = siteSettings.siteName || 'Blog';
      const baseUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';

      const { user, article } = notification;
      const articleUrl = `${baseUrl}/articles/${article.slug}`;
      const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${this.generateUnsubscribeToken(user.id)}`;

      // Prepare template variables
      const templateVariables = {
        '{{siteName}}': siteName,
        '{{articleTitle}}': article.title,
        '{{articleUrl}}': articleUrl,
        '{{articleExcerpt}}': article.excerpt || 'Découvrez ce nouvel article...',
        '{{authorName}}': article.author?.displayName || 'Auteur anonyme',
        '{{categoryName}}': article.category?.name || 'Non catégorisé',
        '{{userName}}': user.displayName || 'Utilisateur',
        '{{unsubscribeUrl}}': unsubscribeUrl,
      };

      // Get rendered template
      const renderedTemplate = await this.emailTemplatesService.renderTemplate(
        notification.type,
        templateVariables
      );

      const mailOptions = {
        from: `"${siteName}" <${this.configService.get('email.from') || 'noreply@localhost'}>`,
        to: user.email,
        subject: renderedTemplate.subject,
        html: renderedTemplate.html,
        text: renderedTemplate.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent to ${user.email} for article ${article.title}`);
      
      // Log preview URL for Ethereal
      if (result.messageId && this.configService.get('email.service') !== 'mailjet') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(result)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${notification.user.email}: ${error.message}`);
      return false;
    }
  }

  private getNewArticleTemplate(article: any, user: any, siteName: string, articleUrl: string, unsubscribeUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvel article - ${siteName}</title>
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
          <h1>Bonjour ${user.displayName || user.username} 👋</h1>
          <p>Un nouvel article vient d'être publié sur <strong>${siteName}</strong> !</p>
        </div>
        
        <div class="article-card">
          <h2>${article.title}</h2>
          <p><strong>Par:</strong> ${article.author.displayName}</p>
          ${article.category ? `<p><strong>Catégorie:</strong> ${article.category.name}</p>` : ''}
          <p>${article.excerpt || 'Découvrez ce nouvel article passionnant...'}</p>
          <a href="${articleUrl}" class="btn">Lire l'article</a>
        </div>
        
        <div class="footer">
          <p>Vous recevez cet email car vous êtes abonné aux notifications de ${siteName}.</p>
          <p><a href="${unsubscribeUrl}">Se désabonner</a> | <a href="${articleUrl.replace('/articles/', '/dashboard/subscriptions')}">Gérer mes abonnements</a></p>
        </div>
      </body>
      </html>
    `;
  }

  private getAuthorPublishedTemplate(article: any, user: any, siteName: string, articleUrl: string, unsubscribeUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvel article de ${article.author.displayName} - ${siteName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .article-card { border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .author-info { display: flex; align-items: center; margin-bottom: 15px; }
          .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Bonjour ${user.displayName || user.username} 👋</h1>
          <p><strong>${article.author.displayName}</strong> que vous suivez a publié un nouvel article !</p>
        </div>
        
        <div class="article-card">
          <div class="author-info">
            <strong>${article.author.displayName}</strong>
          </div>
          <h2>${article.title}</h2>
          ${article.category ? `<p><strong>Catégorie:</strong> ${article.category.name}</p>` : ''}
          <p>${article.excerpt || 'Découvrez le dernier article de cet auteur...'}</p>
          <a href="${articleUrl}" class="btn">Lire l'article</a>
        </div>
        
        <div class="footer">
          <p>Vous recevez cet email car vous suivez ${article.author.displayName} sur ${siteName}.</p>
          <p><a href="${unsubscribeUrl}">Se désabonner</a> | <a href="${articleUrl.replace('/articles/', '/dashboard/subscriptions')}">Gérer mes abonnements</a></p>
        </div>
      </body>
      </html>
    `;
  }

  private getCategoryUpdateTemplate(article: any, user: any, siteName: string, articleUrl: string, unsubscribeUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvel article dans ${article.category?.name} - ${siteName}</title>
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
          <h1>Bonjour ${user.displayName || user.username} 👋</h1>
          <p>Un nouvel article a été publié dans la catégorie <strong>${article.category?.name}</strong> que vous suivez !</p>
        </div>
        
        <div class="article-card">
          ${article.category ? `<span class="category-badge">${article.category.name}</span>` : ''}
          <h2>${article.title}</h2>
          <p><strong>Par:</strong> ${article.author.displayName}</p>
          <p>${article.excerpt || 'Découvrez ce nouvel article dans votre catégorie préférée...'}</p>
          <a href="${articleUrl}" class="btn">Lire l'article</a>
        </div>
        
        <div class="footer">
          <p>Vous recevez cet email car vous êtes abonné à la catégorie ${article.category?.name} sur ${siteName}.</p>
          <p><a href="${unsubscribeUrl}">Se désabonner</a> | <a href="${articleUrl.replace('/articles/', '/dashboard/subscriptions')}">Gérer mes abonnements</a></p>
        </div>
      </body>
      </html>
    `;
  }

  private generateUnsubscribeToken(userId: string): string {
    // In a real implementation, you would generate a secure token
    // For now, we'll use a simple base64 encoding
    return Buffer.from(userId).toString('base64');
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error(`Email service connection failed: ${error.message}`);
      return false;
    }
  }
}
