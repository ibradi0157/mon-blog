-- Database indexes for optimal performance
-- Run these commands in your PostgreSQL database

-- Articles table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_status_published_at 
ON articles (status, published_at DESC) 
WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_category_published 
ON articles (category_id, published_at DESC) 
WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_author_status 
ON articles (author_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_slug 
ON articles (slug) 
WHERE status = 'published';

-- Full-text search index for articles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_search 
ON articles USING gin(to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || content));

-- Composite index for article filtering and sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_filter_sort 
ON articles (status, category_id, published_at DESC, likes DESC, views DESC);

-- Comments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_article_created 
ON comments (article_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_status_created 
ON comments (status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author_created 
ON comments (author_id, created_at DESC);

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique 
ON users (email) 
WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status 
ON users (role, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at 
ON users (created_at DESC);

-- Categories table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug 
ON categories (slug);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_order 
ON categories (parent_id, display_order);

-- Analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_type_date 
ON analytics_events (event_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_session_date 
ON analytics_events (session_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_date 
ON analytics_events (user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_article_type 
ON analytics_events (article_id, event_type, created_at DESC) 
WHERE article_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_sessions_visitor_date 
ON analytics_sessions (visitor_id, started_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_daily_stats_date_metric 
ON analytics_daily_stats (date DESC, metric);

-- Newsletter subscribers indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_email_status 
ON newsletter_subscribers (email, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_status_created 
ON newsletter_subscribers (status, created_at DESC);

-- File uploads indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_uploads_user_created 
ON file_uploads (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_uploads_type_created 
ON file_uploads (file_type, created_at DESC);

-- Homepage sections indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_homepage_sections_order 
ON homepage_sections (display_order);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_homepage_sections_type_order 
ON homepage_sections (section_type, display_order);

-- Scheduled articles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scheduled_articles_date_status 
ON scheduled_articles (scheduled_at ASC, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scheduled_articles_article_status 
ON scheduled_articles (article_id, status);

-- Performance monitoring queries
-- Use these to monitor index usage and query performance

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Check table statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;

-- Find slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check for missing indexes (queries with high cost)
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements 
WHERE calls > 100 
AND mean_time > 100 
ORDER BY mean_time DESC;

-- Analyze table statistics (run periodically)
ANALYZE articles;
ANALYZE comments;
ANALYZE users;
ANALYZE categories;
ANALYZE analytics_events;
ANALYZE analytics_sessions;

-- Vacuum tables to reclaim space (run during maintenance windows)
-- VACUUM ANALYZE articles;
-- VACUUM ANALYZE comments;
-- VACUUM ANALYZE analytics_events;
