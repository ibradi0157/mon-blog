// src/mail/mail.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';
import { MailerService } from './mailer.service';
import { MailService } from './mail.service';
import { EmailTemplateService } from './email-template.service';

@Module({
  imports: [ConfigModule, forwardRef(() => EmailTemplatesModule)],
  providers: [MailService, MailerService, EmailTemplateService],
  exports: [MailService, EmailTemplateService, MailerService],
})
export class MailModule {}
