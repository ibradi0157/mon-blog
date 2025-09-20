import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserPreferencesService } from './user-preferences.service';
import { User } from '../common/decorators/user.decorator';

@Controller('user-preferences')
@UseGuards(JwtAuthGuard)
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  @Get('liked-articles')
  async getLikedArticles(
    @User('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.preferencesService.getLikedArticles(userId, page, limit);
  }

  @Get('followed-authors')
  async getFollowedAuthors(
    @User('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.preferencesService.getFollowedAuthors(userId, page, limit);
  }
}