import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { AnalyticsEvent, AnalyticsSession, AnalyticsDailyStats, EventType } from './analytics.entity';
import { CacheService, CacheKeys } from '../common/cache/cache.service';

export interface TrackEventDto {
  eventType: EventType;
  sessionId: string;
  visitorId: string;
  userId?: string;
  articleId?: string;
  categoryId?: string;
  url?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  value?: number;
}

export interface AnalyticsOverview {
  totalPageViews: number;
  totalSessions: number;
  totalUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  topArticles: Array<{ id: string; title: string; views: number }>;
  topReferrers: Array<{ referrer: string; visits: number }>;
  deviceStats: Array<{ device: string; count: number }>;
  browserStats: Array<{ browser: string; count: number }>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private eventRepo: Repository<AnalyticsEvent>,
    @InjectRepository(AnalyticsSession)
    private sessionRepo: Repository<AnalyticsSession>,
    @InjectRepository(AnalyticsDailyStats)
    private statsRepo: Repository<AnalyticsDailyStats>,
    private cacheService: CacheService,
  ) {}

  // Track analytics event
  async trackEvent(data: TrackEventDto): Promise<void> {
    try {
      // Parse user agent for device/browser info
      const deviceInfo = this.parseUserAgent(data.userAgent);
      
      // Get or create session
      await this.updateSession(data.sessionId, data.visitorId, data.userId, data.url);

      // Create event
      const event = this.eventRepo.create({
        ...data,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screenWidth: data.metadata?.screenWidth,
        screenHeight: data.metadata?.screenHeight,
      });

      await this.eventRepo.save(event);

      // Update real-time stats cache
      await this.updateRealTimeStats(data.eventType);

    } catch (error) {
      this.logger.error('Failed to track event:', error);
    }
  }

  // Get or update session
  private async updateSession(
    sessionId: string, 
    visitorId: string, 
    userId?: string, 
    currentUrl?: string
  ): Promise<void> {
    let session = await this.sessionRepo.findOne({ where: { id: sessionId } });

    if (!session) {
      // Create new session
      session = this.sessionRepo.create({
        id: sessionId,
        visitorId,
        userId,
        startedAt: new Date(),
        entryUrl: currentUrl,
        pageViews: 1,
        bounce: true,
      });
    } else {
      // Update existing session
      session.pageViews += 1;
      session.bounce = session.pageViews === 1;
      session.exitUrl = currentUrl;
      session.endedAt = new Date();
      
      if (session.startedAt) {
        session.durationSeconds = Math.floor(
          (session.endedAt.getTime() - session.startedAt.getTime()) / 1000
        );
      }
    }

    await this.sessionRepo.save(session);
  }

  // Parse user agent for device info
  private parseUserAgent(userAgent?: string): {
    device: string;
    browser: string;
    os: string;
  } {
    if (!userAgent) {
      return { device: 'unknown', browser: 'unknown', os: 'unknown' };
    }

    const ua = userAgent.toLowerCase();
    
    // Device detection
    let device = 'desktop';
    if (/mobile|android|iphone|ipad|phone|tablet/.test(ua)) {
      device = /tablet|ipad/.test(ua) ? 'tablet' : 'mobile';
    }

    // Browser detection
    let browser = 'unknown';
    if (ua.includes('chrome')) browser = 'chrome';
    else if (ua.includes('firefox')) browser = 'firefox';
    else if (ua.includes('safari')) browser = 'safari';
    else if (ua.includes('edge')) browser = 'edge';
    else if (ua.includes('opera')) browser = 'opera';

    // OS detection
    let os = 'unknown';
    if (ua.includes('windows')) os = 'windows';
    else if (ua.includes('mac')) os = 'macos';
    else if (ua.includes('linux')) os = 'linux';
    else if (ua.includes('android')) os = 'android';
    else if (ua.includes('ios')) os = 'ios';

    return { device, browser, os };
  }

  // Update real-time stats cache
  private async updateRealTimeStats(eventType: EventType): Promise<void> {
    const cacheKey = `analytics:realtime:${eventType}`;
    const current = await this.cacheService.get<number>(cacheKey) || 0;
    await this.cacheService.set(cacheKey, current + 1, { ttl: 300 }); // 5 minutes
  }

  // Get analytics overview
  async getOverview(
    startDate: Date, 
    endDate: Date,
    userId?: string
  ): Promise<AnalyticsOverview> {
    const cacheKey = `analytics:overview:${startDate.toISOString()}:${endDate.toISOString()}:${userId || 'all'}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const baseQuery = this.eventRepo.createQueryBuilder('event')
          .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });

        if (userId) {
          baseQuery.andWhere('event.userId = :userId', { userId });
        }

        // Total page views
        const totalPageViews = await baseQuery
          .andWhere('event.eventType = :eventType', { eventType: EventType.PAGE_VIEW })
          .getCount();

        // Total sessions
        const sessionQuery = this.sessionRepo.createQueryBuilder('session')
          .where('session.startedAt BETWEEN :startDate AND :endDate', { startDate, endDate });
        
        if (userId) {
          sessionQuery.andWhere('session.userId = :userId', { userId });
        }

        const totalSessions = await sessionQuery.getCount();

        // Total unique users
        const totalUsers = await sessionQuery
          .select('COUNT(DISTINCT session.visitorId)', 'count')
          .getRawOne()
          .then(result => parseInt(result.count));

        // Bounce rate
        const bouncedSessions = await sessionQuery
          .andWhere('session.bounce = true')
          .getCount();
        
        const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

        // Average session duration
        const avgDuration = await sessionQuery
          .select('AVG(session.durationSeconds)', 'avg')
          .getRawOne()
          .then(result => parseFloat(result.avg) || 0);

        // Top articles
        const topArticles = await this.eventRepo
          .createQueryBuilder('event')
          .select('event.articleId', 'id')
          .addSelect('COUNT(*)', 'views')
          .where('event.eventType = :eventType', { eventType: EventType.ARTICLE_VIEW })
          .andWhere('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .andWhere('event.articleId IS NOT NULL')
          .groupBy('event.articleId')
          .orderBy('views', 'DESC')
          .limit(10)
          .getRawMany();

        // Top referrers
        const topReferrers = await this.sessionRepo
          .createQueryBuilder('session')
          .select('session.referrer', 'referrer')
          .addSelect('COUNT(*)', 'visits')
          .where('session.startedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .andWhere('session.referrer IS NOT NULL')
          .andWhere('session.referrer != ""')
          .groupBy('session.referrer')
          .orderBy('visits', 'DESC')
          .limit(10)
          .getRawMany();

        // Device stats
        const deviceStats = await this.eventRepo
          .createQueryBuilder('event')
          .select('event.device', 'device')
          .addSelect('COUNT(DISTINCT event.sessionId)', 'count')
          .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .andWhere('event.device IS NOT NULL')
          .groupBy('event.device')
          .orderBy('count', 'DESC')
          .getRawMany();

        // Browser stats
        const browserStats = await this.eventRepo
          .createQueryBuilder('event')
          .select('event.browser', 'browser')
          .addSelect('COUNT(DISTINCT event.sessionId)', 'count')
          .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .andWhere('event.browser IS NOT NULL')
          .groupBy('event.browser')
          .orderBy('count', 'DESC')
          .getRawMany();

        return {
          totalPageViews,
          totalSessions,
          totalUsers,
          bounceRate: Math.round(bounceRate * 100) / 100,
          avgSessionDuration: Math.round(avgDuration),
          topArticles: topArticles.map(a => ({ 
            id: a.id, 
            title: `Article ${a.id}`, // Would need to join with articles table
            views: parseInt(a.views) 
          })),
          topReferrers: topReferrers.map(r => ({ 
            referrer: r.referrer, 
            visits: parseInt(r.visits) 
          })),
          deviceStats: deviceStats.map(d => ({ 
            device: d.device, 
            count: parseInt(d.count) 
          })),
          browserStats: browserStats.map(b => ({ 
            browser: b.browser, 
            count: parseInt(b.count) 
          })),
        };
      },
      { ttl: 1800, tags: ['analytics'], namespace: 'analytics' } // 30 minutes
    );
  }

  // Get time series data
  async getTimeSeries(
    metric: string,
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; value: number }>> {
    const cacheKey = `analytics:timeseries:${metric}:${granularity}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        let dateFormat: string;
        let dateGroupBy: string;

        switch (granularity) {
          case 'hour':
            dateFormat = 'YYYY-MM-DD HH24:00:00';
            dateGroupBy = "DATE_TRUNC('hour', event.createdAt)";
            break;
          case 'week':
            dateFormat = 'YYYY-MM-DD';
            dateGroupBy = "DATE_TRUNC('week', event.createdAt)";
            break;
          case 'month':
            dateFormat = 'YYYY-MM-01';
            dateGroupBy = "DATE_TRUNC('month', event.createdAt)";
            break;
          default: // day
            dateFormat = 'YYYY-MM-DD';
            dateGroupBy = "DATE_TRUNC('day', event.createdAt)";
        }

        const query = this.eventRepo
          .createQueryBuilder('event')
          .select(`TO_CHAR(${dateGroupBy}, '${dateFormat}')`, 'date')
          .addSelect('COUNT(*)', 'value')
          .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .groupBy(`${dateGroupBy}`)
          .orderBy(`${dateGroupBy}`, 'ASC');

        // Filter by metric/event type
        if (metric !== 'all') {
          query.andWhere('event.eventType = :eventType', { eventType: metric });
        }

        return await query.getRawMany();
      },
      { ttl: 900, tags: ['analytics'], namespace: 'analytics' } // 15 minutes
    );
  }

  // Get real-time stats
  async getRealTimeStats(): Promise<Record<string, number>> {
    const eventTypes = Object.values(EventType);
    const stats: Record<string, number> = {};

    for (const eventType of eventTypes) {
      const cacheKey = `analytics:realtime:${eventType}`;
      stats[eventType] = await this.cacheService.get<number>(cacheKey) || 0;
    }

    // Add current online users (sessions active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.endedAt >= :fiveMinutesAgo OR session.endedAt IS NULL', { fiveMinutesAgo })
      .getCount();

    stats['online_users'] = onlineUsers;

    return stats;
  }

  // Daily stats aggregation (was scheduled; call manually from a job runner if needed)
  async aggregateDailyStats(): Promise<void> {
    this.logger.log('Starting daily stats aggregation...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // Aggregate various metrics
      const metrics = [
        { name: 'page_views', eventType: EventType.PAGE_VIEW },
        { name: 'article_views', eventType: EventType.ARTICLE_VIEW },
        { name: 'article_likes', eventType: EventType.ARTICLE_LIKE },
        { name: 'article_shares', eventType: EventType.ARTICLE_SHARE },
        { name: 'searches', eventType: EventType.SEARCH },
        { name: 'signups', eventType: EventType.USER_SIGNUP },
      ];

      for (const metric of metrics) {
        const count = await this.eventRepo
          .createQueryBuilder('event')
          .where('event.eventType = :eventType', { eventType: metric.eventType })
          .andWhere('event.createdAt >= :start AND event.createdAt < :end', { 
            start: yesterday, 
            end: today 
          })
          .getCount();

        await this.statsRepo.save({
          date: yesterday,
          metric: metric.name,
          value: count,
        });
      }

      // Aggregate session metrics
      const sessionStats = await this.sessionRepo
        .createQueryBuilder('session')
        .select('COUNT(*)', 'total_sessions')
        .addSelect('COUNT(DISTINCT session.visitorId)', 'unique_visitors')
        .addSelect('AVG(session.durationSeconds)', 'avg_duration')
        .addSelect('COUNT(CASE WHEN session.bounce = true THEN 1 END)', 'bounced_sessions')
        .where('session.startedAt >= :start AND session.startedAt < :end', { 
          start: yesterday, 
          end: today 
        })
        .getRawOne();

      const sessionMetrics = [
        { name: 'sessions', value: parseInt(sessionStats.total_sessions) },
        { name: 'unique_visitors', value: parseInt(sessionStats.unique_visitors) },
        { name: 'avg_session_duration', value: Math.round(parseFloat(sessionStats.avg_duration) || 0) },
        { name: 'bounce_rate', value: Math.round((parseInt(sessionStats.bounced_sessions) / parseInt(sessionStats.total_sessions)) * 100) },
      ];

      for (const metric of sessionMetrics) {
        await this.statsRepo.save({
          date: yesterday,
          metric: metric.name,
          value: metric.value,
        });
      }

      this.logger.log(`Daily stats aggregation completed for ${yesterday.toISOString().split('T')[0]}`);
    } catch (error) {
      this.logger.error('Failed to aggregate daily stats:', error);
    }
  }

  // Cleanup old events (keep only 90 days) — was scheduled; call manually if needed
  async cleanupOldEvents(): Promise<void> {
    this.logger.log('Cleaning up old analytics events...');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const deletedEvents = await this.eventRepo
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      const deletedSessions = await this.sessionRepo
        .createQueryBuilder()
        .delete()
        .where('startedAt < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned up ${deletedEvents.affected} events and ${deletedSessions.affected} sessions`);
    } catch (error) {
      this.logger.error('Failed to cleanup old events:', error);
    }
  }
}
