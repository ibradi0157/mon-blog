import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailTemplateService {
  private readonly blogName: string;
  private readonly supportEmail: string;

  constructor(private readonly config: ConfigService) {
    this.blogName = this.config.get('BLOG_NAME', 'Mon Blog');
    this.supportEmail = this.config.get('SUPPORT_EMAIL', 'support@example.com');
  }

  private getBaseTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${this.blogName}</title>
          <style>
            body { 
              font-family: Inter, system-ui, Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background: #f3f4f6;
            }
            .content {
              padding: 30px 0;
            }
            .footer {
              text-align: center;
              padding: 20px 0;
              font-size: 14px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .code {
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 4px;
              background: #f3f4f6;
              padding: 12px 16px;
              border-radius: 8px;
              display: inline-block;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.blogName}</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${this.blogName}. Tous droits réservés.</p>
              <p>Pour toute question, contactez-nous à ${this.supportEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getVerificationEmail(code: string, expiresAt?: Date): string {
    const expText = expiresAt 
      ? `Ce code expire le ${expiresAt.toLocaleString()}.` 
      : 'Ce code expirera bientôt.';

    const content = `
      <h2>Vérification de votre adresse email</h2>
      <p>Merci de vous être inscrit sur ${this.blogName}. Pour finaliser votre inscription, veuillez utiliser le code de vérification ci-dessous :</p>
      <div class="code">${code}</div>
      <p style="color:#6b7280;">${expText}</p>
      <p>Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.</p>
    `;

    return this.getBaseTemplate(content);
  }

  getPasswordResetEmail(code: string, expiresAt: Date): string {
    const content = `
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code ci-dessous pour procéder au changement :</p>
      <div class="code">${code}</div>
      <p style="color:#6b7280;">Ce code expire le ${expiresAt.toLocaleString()}.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, veuillez nous contacter immédiatement.</p>
    `;

    return this.getBaseTemplate(content);
  }

  getNewArticleNotification(articleTitle: string, authorName: string, articleUrl: string): string {
    const content = `
      <h2>Nouvel article publié</h2>
      <p>Un nouvel article vient d'être publié par ${authorName} :</p>
      <h3>${articleTitle}</h3>
      <p>Ne manquez pas cette nouvelle publication !</p>
      <a href="${articleUrl}" class="button">Lire l'article</a>
    `;

    return this.getBaseTemplate(content);
  }

  getWelcomeEmail(displayName: string): string {
    const content = `
      <h2>Bienvenue sur ${this.blogName}, ${displayName} !</h2>
      <p>Nous sommes ravis de vous compter parmi nos membres. Votre compte a été vérifié avec succès.</p>
      <p>Vous pouvez maintenant :</p>
      <ul>
        <li>Commenter les articles</li>
        <li>Suivre vos auteurs préférés</li>
        <li>Recevoir des notifications sur les nouveaux articles</li>
      </ul>
      <a href="/explorer" class="button">Découvrir les articles</a>
    `;

    return this.getBaseTemplate(content);
  }
}