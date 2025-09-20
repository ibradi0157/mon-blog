// src/email-templates/email-templates.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { EmailTemplatesService } from './email-templates.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';
import { EmailTemplate } from './email-template.entity';

@Controller('email-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.PRIMARY_ADMIN)
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Post()
  async create(@Body() createEmailTemplateDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    return await this.emailTemplatesService.create(createEmailTemplateDto);
  }

  @Get()
  async findAll(): Promise<EmailTemplate[]> {
    return await this.emailTemplatesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EmailTemplate> {
    return await this.emailTemplatesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEmailTemplateDto: UpdateEmailTemplateDto
  ): Promise<EmailTemplate> {
    return await this.emailTemplatesService.update(id, updateEmailTemplateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.emailTemplatesService.remove(id);
    return { message: 'Email template deleted successfully' };
  }

  @Post(':id/preview')
  async preview(
    @Param('id') id: string,
    @Body() variables: Record<string, string>
  ): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.emailTemplatesService.findOne(id);
    return await this.emailTemplatesService.renderTemplate(template.type, variables);
  }
}
