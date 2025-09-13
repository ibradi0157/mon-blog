import { Controller, Post, Body, Param, Get, Delete, UseGuards, Request, UsePipes, ValidationPipe, Query, Patch } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';

@Controller('comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  // Création d'un commentaire (utilisateur connecté)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER, RoleName.SIMPLE_USER)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() dto: CreateCommentDto, @Request() req) {
    return this.service.create(dto.content, dto.articleId, req.user, dto.parentId);
  }

  @Get('article/:articleId')
  findAllForArticle(
    @Param('articleId') articleId: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sort') sort: string,
    @Query('order') order: 'ASC' | 'DESC'
  ) {
    return this.service.findAllForArticle(articleId, {
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
      order,
    });
  }

  // Lister les réponses d'un commentaire
  @Get(':id/replies')
  findReplies(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findReplies(id, { page: page ? parseInt(page) : undefined, limit: limit ? parseInt(limit) : undefined });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  list(
    @Request() req,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sort') sort: string,
    @Query('order') order: 'ASC' | 'DESC',
    @Query('articleId') articleId?: string,
    @Query('authorId') authorId?: string,
    @Query('authorRole') authorRole?: string,
  ) {
    return this.service.findAllWithPermissions(req.user, {
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
      order,
      articleId,
      authorId,
      authorRole: authorRole as any,
    });
  }

  // Nouveau: liste des commentaires pour les articles du membre connecté
  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.MEMBER, RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  listMine(
    @Request() req,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sort') sort: string,
    @Query('order') order: 'ASC' | 'DESC',
    @Query('articleId') articleId?: string,
  ) {
    return this.service.findAllForMemberArticles(req.user.userId, {
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
      order,
      articleId,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER, RoleName.SIMPLE_USER)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  update(@Param('id') id: string, @Body('content') content: string, @Request() req) {
    return this.service.update(id, content, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER, RoleName.SIMPLE_USER)
  delete(@Param('id') id: string, @Request() req) {
    return this.service.delete(id, req.user);
  }

  // Signalements de commentaires
  @Post(':id/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN, RoleName.MEMBER, RoleName.SIMPLE_USER)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  report(@Param('id') id: string, @Body('reason') reason: string, @Request() req) {
    return this.service.reportComment(id, reason, req.user);
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  listReports(
    @Query('status') status?: 'PENDING' | 'RESOLVED' | 'DISMISSED',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listReports({ status, page: page ? parseInt(page) : undefined, limit: limit ? parseInt(limit) : undefined });
  }

  @Patch('reports/:reportId/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  resolveReport(
    @Param('reportId') reportId: string,
    @Body('action') action: 'RESOLVED' | 'DISMISSED' = 'RESOLVED',
    @Request() req,
  ) {
    return this.service.resolveReport(reportId, action, req.user);
  }
}