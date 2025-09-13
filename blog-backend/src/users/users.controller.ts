// src/users/users.controller.ts
import { Controller, Get, Post, Body, UseGuards, Request, Query, Param, UseInterceptors, UploadedFile, ForbiddenException, Delete, Patch, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  getAll(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sort') sort: string,
    @Query('order') order: 'ASC' | 'DESC',
    @Request() req
  ) {
    return this.service.findAll(req.user, {
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
      order,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  create(
    @Body() body: { email: string; displayName: string; password: string; confirmPassword: string },
    @Request() req
  ) {
    return this.service.create(body.email, body.displayName, body.password, body.confirmPassword, req.user);
  }

  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = 'uploads/avatars';
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
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.service.updateAvatar(id, file, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER)
  deleteUser(@Param('id') id: string, @Request() req) {
    return this.service.deleteUser(id, req.user);
  }

  @Delete('purge/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  purgeMembers(@Request() req) {
    return this.service.purgeRegisteredMembers(req.user);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  changeRole(
    @Param('id') id: string,
    @Body() body: ChangeRoleDto,
    @Request() req
  ) {
    return this.service.changeRole(id, body.role, req.user);
  }
}