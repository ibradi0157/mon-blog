// src/articles/articles.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { Article } from './article.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody, ApiCreatedResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private service: ArticlesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  getAll(
    @Query('isPublished') isPublished: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sort') sort: string,
    @Query('order') order: 'ASC' | 'DESC',
    @Request() req
  ) {
    return this.service.findAllWithPermissions(req.user, {
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
      order,
    });
  }

  @Get('public')
  getAllPublic(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sort') sort: string,
    @Query('order') order: 'ASC' | 'DESC',
    @Query('categoryId') categoryId: string,
  ) {
    return this.service.findPublic({
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
      order,
      categoryId,
    });
  }

  @Get('public/:id')
  getOnePublic(@Param('id') id: string) {
    return this.service.findOnePublic(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  async getOne(@Param('id') id: string, @Request() req): Promise<{ success: boolean; data: Article }> {
    const article = await this.service.findOneWithPermissions(id, req.user);
    if (!article) {
      throw new NotFoundException(`Article ${id} introuvable`);
    }
    return { success: true, data: article };
  }

  @Get('paginated')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  getPaginated(@Query('page') page: string, @Query('limit') limit: string, @Request() req) {
    return this.service.findAllPaginatedWithPermissions(req.user, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiBearerAuth('bearer')
  create(@Body() body: CreateArticleDto, @Request() req) {
    return this.service.create({
      ...body,
      authorId: req.user.userId,
      authorRole: req.user.role.name
    } as CreateArticleDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  async update(@Param('id') id: string, @Body() body: Partial<Article>, @Request() req) {
    return this.service.updateWithPermissions(id, body, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  async remove(@Param('id') id: string, @Request() req) {
    return this.service.deleteWithPermissions(id, req.user);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  publish(@Param('id') id: string, @Request() req) {
    return this.service.publish(id, req.user);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  unpublish(@Param('id') id: string, @Request() req) {
    return this.service.unpublish(id, req.user);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  like(@Param('id') id: string, @Request() req) {
    return this.service.like(id, req.user);
  }

  @Post(':id/dislike')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  dislike(@Param('id') id: string, @Request() req) {
    return this.service.dislike(id, req.user);
  }

  @Post(':id/cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = 'uploads/articles';
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${req.params.id}-${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) cb(null, true);
        else cb(new ForbiddenException('Format d\'image non supporté'), false);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            coverUrl: { type: 'string' },
            thumbnails: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  async uploadCover(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.service.updateCover(id, file, req.user);
  }

  @Delete(':id/cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  removeCover(@Param('id') id: string, @Request() req) {
    return this.service.removeCover(id, req.user);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @ApiBearerAuth('bearer')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = 'uploads/articles/content';
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${req.params.id}-content-${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) cb(null, true);
        else cb(new ForbiddenException('Format d\'image non supporté'), false);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            thumbnails: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  async uploadContentImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Request() req) {
    const article = await this.service.findOneWithPermissions(id, req.user);
    if (!article) {
      throw new NotFoundException(`Article ${id} introuvable`);
    }
    if (article.isPublished) {
      throw new ForbiddenException("Impossible d'uploader une image pour un article publié. Dépubliez-le d'abord.");
    }
    await this.service.optimizeImageFile(file).catch(() => {});
    const thumbs = await this.service.generateThumbnails(file, [400, 800]).catch(() => null);
    return { success: true, message: 'Image uploadée', data: { url: `/uploads/articles/content/${file.filename}`, thumbnails: thumbs?.urls ?? [] } };
  }

  @Post('upload-content-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/articles/content',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `content-${uniqueSuffix}-${file.originalname}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Accept common image types including webp; rely on mimetype for robustness
        if (/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) {
          return cb(null, true);
        }
        return cb(new Error('Only image files are allowed!'), false);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a generic content image' })
  @ApiResponse({
    status: 201,
    description: 'The image has been successfully uploaded.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            thumbnails: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async uploadGenericContentImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Optimize the uploaded image
      await this.service.optimizeImageFile(file).catch((error) => {
        console.error('Error optimizing image:', error);
      });

      // Generate thumbnails
      const thumbs = await this.service.generateThumbnails(file, [400, 800]).catch((error) => {
        console.error('Error generating thumbnails:', error);
        return null;
      });

      return {
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: `/uploads/articles/content/${file.filename}`,
          thumbnails: thumbs?.urls || [],
        },
      };
    } catch (error) {
      console.error('Error in uploadGenericContentImage:', error);
      throw new InternalServerErrorException('Failed to process the uploaded file');
    }
  }
}