// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private provider: 'ethereal' | 'mailjet' | 'json';
  private etherealUser?: string;

  constructor(private readonly config: ConfigService) {
    const explicit = this.config.get<string>('MAIL_PROVIDER');
    const nodeEnv = this.config.get<string>('NODE_ENV') || 'development';
    if (explicit === 'ethereal' || (!explicit && nodeEnv === 'development')) {
      this.provider = 'ethereal';
    } else if (explicit === 'json') {
      this.provider = 'json';
    } else {
      this.provider = 'mailjet';
    }
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    if (this.provider === 'ethereal') {
      const account = await nodemailer.createTestAccount();
      this.etherealUser = account.user;
      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      } as SMTPTransport.Options);
      this.logger.log(`Ethereal email account created: ${account.user}`);
      return this.transporter;
    }

    if (this.provider === 'mailjet') {
      const user = this.config.get<string>('MAILJET_API_KEY');
      const pass = this.config.get<string>('MAILJET_API_SECRET');
      if (!user || !pass) {
        this.logger.warn('MAILJET credentials missing. Falling back to JSON transport.');
        this.provider = 'json';
        return this.getTransporter();
      }
      this.transporter = nodemailer.createTransport({
        host: 'in-v3.mailjet.com',
        port: 587,
        secure: false,
        auth: { user, pass },
      } as SMTPTransport.Options);
      return this.transporter;
    }

    // JSON transport (logs to console, no sending)
    this.transporter = nodemailer.createTransport({ jsonTransport: true } as any);
    return this.transporter;
  }

  private getFrom() {
    const fromEmail = this.config.get<string>('MAIL_FROM_EMAIL') || 'no-reply@example.com';
    const fromName = this.config.get<string>('MAIL_FROM_NAME') || 'Mon Blog';
    return { from: `${fromName} <${fromEmail}>` };
  }

  private asText(html: string): string {
    // naive html to text fallback
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  async sendMail(to: string, subject: string, html: string) {
    const transporter = await this.getTransporter();
    const { from } = this.getFrom();
    const info = await transporter.sendMail({ from, to, subject, html, text: this.asText(html) });

    if (this.provider === 'ethereal') {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) this.logger.log(`Ethereal preview URL: ${url}`);
    }
    if (this.provider === 'json') {
      this.logger.log(`Email (JSON transport) to ${to}: ${subject}`);
    }
    return info;
  }

  async sendVerificationCode(email: string, code: string, expiresAt?: Date) {
    const expText = expiresAt ? `Ce code expire le ${expiresAt.toLocaleString()}.` : 'Ce code expirera bientôt.';
    const html = `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;line-height:1.6;">
        <h2>Vérification de votre adresse email</h2>
        <p>Utilisez le code ci-dessous pour finaliser votre inscription:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;background:#f3f4f6;padding:12px 16px;border-radius:8px;display:inline-block;">${code}</p>
        <p style="color:#6b7280;">${expText}</p>
      </div>
    `;
    await this.sendMail(email, 'Votre code de vérification', html);
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    const html = `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;line-height:1.6;">
        <h2>Réinitialiser votre mot de passe</h2>
        <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe. Ce lien est valable 1 heure.</p>
        <p><a href="${resetUrl}" style="background:#111827;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;">Réinitialiser le mot de passe</a></p>
        <p style="color:#6b7280;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur:<br/>${resetUrl}</p>
      </div>
    `;
    await this.sendMail(email, 'Réinitialisation du mot de passe', html);
  }
}
