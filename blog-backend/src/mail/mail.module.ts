// src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { MailService } from './mail.service';
import { EmailTemplateService } from './email-template.service';

@Module({
  imports: [ConfigModule],
  providers: [MailService, MailerService, EmailTemplateService],
  exports: [MailService, EmailTemplateService, MailerService],
})
export class MailModule {}
