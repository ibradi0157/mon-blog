// src/site-settings/site-settings.controller.ts
import { Controller, Get, Put, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private service: SiteSettingsService) {}

  @Get()
  async getPublicSettings() {
    return {
      success: true,
      data: await this.service.getPublicSettings(),
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth('bearer')
  async getAdminSettings() {
    return {
      success: true,
      data: await this.service.getSettings(),
    };
  }

  @Put('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth('bearer')
  async updateSettings(@Body() dto: UpdateSiteSettingsDto) {
    const settings = await this.service.updateSettings(dto);
    return {
      success: true,
      message: 'Paramètres mis à jour avec succès',
      data: settings,
    };
  }

  @Put('admin/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/site',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Seules les images sont autorisées'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    })
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const logoUrl = `/uploads/site/${file.filename}`;
    await this.service.updateSettings({ logoUrl });

    return {
      success: true,
      message: 'Logo mis à jour avec succès',
      data: { logoUrl },
    };
  }

  @Put('admin/favicon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/site',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `favicon-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const validMimes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/jpg', 'image/jpeg'];
        if (!validMimes.includes(file.mimetype)) {
          return cb(new BadRequestException('Format de favicon non supporté'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
    })
  )
  async uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const faviconUrl = `/uploads/site/${file.filename}`;
    await this.service.updateSettings({ faviconUrl });

    return {
      success: true,
      message: 'Favicon mis à jour avec succès',
      data: { faviconUrl },
    };
  }
}
