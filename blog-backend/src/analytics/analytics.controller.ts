import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Query, 
  UseGuards, 
  Req, 
  HttpCode, 
  HttpStatus,
  ParseDatePipe,
  ValidationPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AnalyticsService, TrackEventDto } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/roles.constants';
import { EventType } from './analytics.entity';
import { IsEnum, IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

class TrackEventRequestDto {
  @IsEnum(EventType)
  eventType: EventType;

  @IsString()
  sessionId: string;

  @IsString()
  visitorId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  articleId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  value?: number;
}

class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

class TimeSeriesQueryDto extends AnalyticsQueryDto {
  @IsString()
  metric: string;

  @IsOptional()
  @IsIn(['hour', 'day', 'week', 'month'])
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track analytics event' })
  @ApiResponse({ status: 204, description: 'Event tracked successfully' })
  async trackEvent(
    @Body(ValidationPipe) dto: TrackEventRequestDto,
    @Req() req: Request
  ): Promise<void> {
    const trackData: TrackEventDto = {
      ...dto,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
    };

    await this.analyticsService.trackEvent(trackData);
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiResponse({ status: 200, description: 'Analytics overview retrieved successfully' })
  async getOverview(@Query(ValidationPipe) query: AnalyticsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    return this.analyticsService.getOverview(startDate, endDate, query.userId);
  }

  @Get('timeseries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get time series analytics data' })
  @ApiResponse({ status: 200, description: 'Time series data retrieved successfully' })
  async getTimeSeries(@Query(ValidationPipe) query: TimeSeriesQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    return this.analyticsService.getTimeSeries(
      query.metric,
      startDate,
      endDate,
      query.granularity || 'day'
    );
  }

  @Get('realtime')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN, RoleName.SECONDARY_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time analytics stats' })
  @ApiResponse({ status: 200, description: 'Real-time stats retrieved successfully' })
  async getRealTimeStats() {
    return this.analyticsService.getRealTimeStats();
  }

  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.PRIMARY_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available event types' })
  @ApiResponse({ status: 200, description: 'Event types retrieved successfully' })
  getEventTypes() {
    return {
      eventTypes: Object.values(EventType),
      descriptions: {
        [EventType.PAGE_VIEW]: 'User viewed a page',
        [EventType.ARTICLE_VIEW]: 'User viewed an article',
        [EventType.ARTICLE_LIKE]: 'User liked an article',
        [EventType.ARTICLE_DISLIKE]: 'User disliked an article',
        [EventType.ARTICLE_SHARE]: 'User shared an article',
        [EventType.SEARCH]: 'User performed a search',
        [EventType.COMMENT_CREATE]: 'User created a comment',
        [EventType.USER_SIGNUP]: 'User signed up',
        [EventType.USER_LOGIN]: 'User logged in',
        [EventType.NEWSLETTER_SIGNUP]: 'User signed up for newsletter',
        [EventType.DOWNLOAD]: 'User downloaded a file',
        [EventType.CLICK]: 'User clicked an element',
        [EventType.SCROLL_DEPTH]: 'User scrolled to a certain depth',
        [EventType.TIME_ON_PAGE]: 'Time spent on page',
        [EventType.BOUNCE]: 'User bounced from the site',
        [EventType.CONVERSION]: 'User completed a conversion goal',
      }
    };
  }
}
