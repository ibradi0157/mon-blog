import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum EventType {
  PAGE_VIEW = 'page_view',
  ARTICLE_VIEW = 'article_view',
  ARTICLE_LIKE = 'article_like',
  ARTICLE_DISLIKE = 'article_dislike',
  ARTICLE_SHARE = 'article_share',
  SEARCH = 'search',
  COMMENT_CREATE = 'comment_create',
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  NEWSLETTER_SIGNUP = 'newsletter_signup',
  DOWNLOAD = 'download',
  CLICK = 'click',
  SCROLL_DEPTH = 'scroll_depth',
  TIME_ON_PAGE = 'time_on_page',
  BOUNCE = 'bounce',
  CONVERSION = 'conversion'
}

@Entity('analytics_events')
@Index(['eventType', 'createdAt'])
@Index(['sessionId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['articleId', 'eventType', 'createdAt'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'enum', 
    enum: EventType 
  })
  @Index()
  eventType: EventType;

  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column({ name: 'visitor_id' })
  @Index()
  visitorId: string;

  @Column({ name: 'article_id', nullable: true })
  @Index()
  articleId?: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: string;

  @Column({ type: 'text', nullable: true })
  url?: string;

  @Column({ type: 'text', nullable: true })
  referrer?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  country?: string;

  @Column({ type: 'text', nullable: true })
  city?: string;

  @Column({ type: 'text', nullable: true })
  device?: string;

  @Column({ type: 'text', nullable: true })
  browser?: string;

  @Column({ type: 'text', nullable: true })
  os?: string;

  @Column({ name: 'screen_width', type: 'int', nullable: true })
  screenWidth?: number;

  @Column({ name: 'screen_height', type: 'int', nullable: true })
  screenHeight?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  value?: number;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}

@Entity('analytics_sessions')
@Index(['visitorId', 'startedAt'])
export class AnalyticsSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'visitor_id' })
  @Index()
  visitorId: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column({ name: 'started_at', type: 'timestamp' })
  @Index()
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt?: Date;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds?: number;

  @Column({ name: 'page_views', type: 'int', default: 0 })
  pageViews: number;

  @Column({ name: 'bounce', default: true })
  bounce: boolean;

  @Column({ name: 'entry_url', type: 'text', nullable: true })
  entryUrl?: string;

  @Column({ name: 'exit_url', type: 'text', nullable: true })
  exitUrl?: string;

  @Column({ type: 'text', nullable: true })
  referrer?: string;

  @Column({ name: 'utm_source', nullable: true })
  utmSource?: string;

  @Column({ name: 'utm_medium', nullable: true })
  utmMedium?: string;

  @Column({ name: 'utm_campaign', nullable: true })
  utmCampaign?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}

@Entity('analytics_daily_stats')
@Index(['date', 'metric'])
export class AnalyticsDailyStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ type: 'text' })
  @Index()
  metric: string;

  @Column({ type: 'bigint', default: 0 })
  value: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
