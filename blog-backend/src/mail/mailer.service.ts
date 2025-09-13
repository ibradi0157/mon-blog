// src/mail/mailer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import Mailjet from 'node-mailjet';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;
  private mailjet: ReturnType<typeof Mailjet.apiConnect> | null = null;

  constructor(private readonly config: ConfigService) {}

  private isDev() {
    return (this.config.get<string>('NODE_ENV') || 'development') === 'development';
  }

  private async getDevTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;
    const host = this.config.get<string>('SMTP_HOST') || 'smtp.ethereal.email';
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const security = (this.config.get<string>('SMTP_SECURITY') || 'STARTTLS').toUpperCase();

    if (!user || !pass) {
      const account = await nodemailer.createTestAccount();
      this.logger.log(`Ethereal test account created: ${account.user}`);
      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      } as SMTPTransport.Options);
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: security === 'SSL',
      auth: { user, pass },
      requireTLS: security === 'STARTTLS',
    } as SMTPTransport.Options);
    return this.transporter;
  }

  private getFrom() {
    const fromEmail = this.config.get<string>('MAILJET_EMAIL_SENDER') || this.config.get<string>('MAIL_FROM_EMAIL') || 'no-reply@example.com';
    const fromName = this.config.get<string>('MAIL_FROM_NAME') || 'Mon Blog';
    return { email: fromEmail, name: fromName };
  }

  private asText(html: string) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private getMailjetClient() {
    if (this.mailjet) return this.mailjet;
    const apiKey = this.config.get<string>('MAILJET_API_KEY');
    const apiSecret = this.config.get<string>('MAILJET_SECRET_KEY') || this.config.get<string>('MAILJET_API_SECRET');
    if (!apiKey || !apiSecret) {
      this.logger.error('Mailjet API credentials missing (MAILJET_API_KEY, MAILJET_SECRET_KEY).');
      return null;
    }
    this.mailjet = Mailjet.apiConnect(apiKey, apiSecret);
    return this.mailjet;
  }

  async sendMail(to: string, subject: string, html: string) {
    const { email: fromEmail, name: fromName } = this.getFrom();

    if (this.isDev()) {
      const t = await this.getDevTransporter();
      const info = await t.sendMail({ from: `${fromName} <${fromEmail}>`, to, subject, html, text: this.asText(html) });
      const url = nodemailer.getTestMessageUrl(info);
      if (url) this.logger.log(`Ethereal preview URL: ${url}`);
      return info;
    }

    const client = this.getMailjetClient();
    if (!client) return;
    const res = await client.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: to }],
          Subject: subject,
          HTMLPart: html,
          TextPart: this.asText(html),
        },
      ],
    } as any);
    this.logger.log(`Mailjet: email envoyé à ${to}`);
    return res.body;
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
