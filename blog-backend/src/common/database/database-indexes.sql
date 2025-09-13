-- Optimized database indexes for blog performance
-- Run these after initial migration

-- Articles table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_published_created 
ON articles (is_published, created_at DESC) 
WHERE is_published = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_author_published 
ON articles (author_id, is_published, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_category_published 
ON articles (category_id, is_published, created_at DESC) 
WHERE is_published = true;

-- Full-text search index for articles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_search 
ON articles USING gin(to_tsvector('french', title || ' ' || content)) 
WHERE is_published = true;

-- Alternative trigram index for ILIKE searches (if gin not preferred)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_title_trgm 
ON articles USING gin(title gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_content_trgm 
ON articles USING gin(content gin_trgm_ops);

-- Article stats indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_stats_article_id 
ON article_stats (article_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_stats_likes 
ON article_stats (likes DESC) WHERE likes > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_stats_views 
ON article_stats (views DESC) WHERE views > 0;

-- Comments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_article_created 
ON comments (article_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author_created 
ON comments (author_id, created_at DESC);

-- Categories indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_name 
ON categories (name);

-- Users indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique 
ON users (email) WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_display_name 
ON users (display_name);

-- Article reactions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_reactions_article_user 
ON article_reactions (article_id, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_reactions_user_type 
ON article_reactions (user_id, type, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_published_category_created 
ON articles (is_published, category_id, created_at DESC) 
WHERE is_published = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_featured_published_created 
ON articles (is_featured, is_published, created_at DESC) 
WHERE is_published = true AND is_featured = true;

-- Performance monitoring queries
-- Use these to monitor index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

-- Check for unused indexes:
-- SELECT schemaname, tablename, indexname, idx_scan 
-- FROM pg_stat_user_indexes 
-- WHERE idx_scan = 0 AND schemaname = 'public';
