// ID generator without external dependency
function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as any).randomUUID();
    }
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      const buf = new Uint8Array(16);
      (crypto as any).getRandomValues(buf);
      // Simple hex encoding
      return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}
  // Fallback
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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

interface TrackEventData {
  eventType: EventType;
  articleId?: string;
  categoryId?: string;
  url?: string;
  referrer?: string;
  metadata?: Record<string, any>;
  value?: number;
}

class Analytics {
  private sessionId: string;
  private visitorId: string;
  private userId?: string;
  private apiUrl: string;
  private pageStartTime: number = Date.now();
  private scrollDepth: number = 0;
  private maxScrollDepth: number = 0;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.sessionId = this.getOrCreateSessionId();
    this.visitorId = this.getOrCreateVisitorId();
    
    if (typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return generateId();
    const existing = sessionStorage.getItem('analytics_session_id');
    if (existing) return existing;
    const id = generateId();
    sessionStorage.setItem('analytics_session_id', id);
    return id;
  }

  private getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') return generateId();
    const existing = localStorage.getItem('analytics_visitor_id');
    if (existing) return existing;
    const id = generateId();
    localStorage.setItem('analytics_visitor_id', id);
    return id;
  }

  private initializeTracking(): void {
    // Track page views automatically
    this.trackPageView();

    // Track scroll depth
    this.initScrollTracking();

    // Track time on page when leaving
    this.initTimeTracking();

    // Track clicks on important elements
    this.initClickTracking();
  }

  private initScrollTracking(): void {
    let ticking = false;

    const updateScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      this.scrollDepth = scrollPercent;
      
      // Track milestone scroll depths
      if (scrollPercent > this.maxScrollDepth) {
        this.maxScrollDepth = scrollPercent;
        
        // Track at 25%, 50%, 75%, 100%
        const milestones = [25, 50, 75, 100];
        const milestone = milestones.find(m => scrollPercent >= m && this.maxScrollDepth < m);
        
        if (milestone) {
          this.track({
            eventType: EventType.SCROLL_DEPTH,
            value: milestone,
            metadata: { scrollPercent: milestone }
          });
        }
      }
      
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDepth);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  private initTimeTracking(): void {
    const trackTimeOnPage = () => {
      const timeSpent = Math.round((Date.now() - this.pageStartTime) / 1000);
      
      if (timeSpent > 10) { // Only track if spent more than 10 seconds
        this.track({
          eventType: EventType.TIME_ON_PAGE,
          value: timeSpent,
          metadata: { timeSpent }
        });
      }
    };

    // Track on page unload
    window.addEventListener('beforeunload', trackTimeOnPage);
    
    // Track on visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage();
      } else {
        this.pageStartTime = Date.now(); // Reset timer when returning
      }
    });
  }

  private initClickTracking(): void {
    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const buttonText = button?.textContent?.trim();
        const buttonId = button?.id;
        const buttonClass = button?.className;
        
        this.track({
          eventType: EventType.CLICK,
          metadata: {
            elementType: 'button',
            text: buttonText,
            id: buttonId,
            className: buttonClass,
            url: window.location.href
          }
        });
      }
      
      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        const href = (link as HTMLAnchorElement)?.href;
        const linkText = link?.textContent?.trim();
        
        this.track({
          eventType: EventType.CLICK,
          metadata: {
            elementType: 'link',
            href,
            text: linkText,
            url: window.location.href
          }
        });
      }
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  async track(data: TrackEventData): Promise<void> {
    try {
      const payload = {
        ...data,
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        userId: this.userId,
        url: data.url || (typeof window !== 'undefined' ? window.location.href : ''),
        referrer: data.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
        metadata: {
          ...data.metadata,
          screenWidth: typeof window !== 'undefined' ? window.screen.width : undefined,
          screenHeight: typeof window !== 'undefined' ? window.screen.height : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timestamp: new Date().toISOString()
        }
      };

      // Send to backend
      await fetch(`${this.apiUrl}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Convenience methods for common events
  trackPageView(url?: string): void {
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;
    
    this.track({
      eventType: EventType.PAGE_VIEW,
      url,
      metadata: {
        title: typeof document !== 'undefined' ? document.title : '',
        path: typeof window !== 'undefined' ? window.location.pathname : ''
      }
    });
  }

  trackArticleView(articleId: string, categoryId?: string): void {
    this.track({
      eventType: EventType.ARTICLE_VIEW,
      articleId,
      categoryId,
      metadata: {
        title: typeof document !== 'undefined' ? document.title : ''
      }
    });
  }

  trackArticleLike(articleId: string): void {
    this.track({
      eventType: EventType.ARTICLE_LIKE,
      articleId
    });
  }

  trackArticleDislike(articleId: string): void {
    this.track({
      eventType: EventType.ARTICLE_DISLIKE,
      articleId
    });
  }

  trackArticleShare(articleId: string, platform: string): void {
    this.track({
      eventType: EventType.ARTICLE_SHARE,
      articleId,
      metadata: { platform }
    });
  }

  trackSearch(query: string, resultsCount?: number): void {
    this.track({
      eventType: EventType.SEARCH,
      metadata: { query, resultsCount }
    });
  }

  trackNewsletterSignup(email?: string): void {
    this.track({
      eventType: EventType.NEWSLETTER_SIGNUP,
      metadata: { email: email ? 'provided' : 'not_provided' }
    });
  }

  trackUserSignup(): void {
    this.track({
      eventType: EventType.USER_SIGNUP
    });
  }

  trackUserLogin(): void {
    this.track({
      eventType: EventType.USER_LOGIN
    });
  }

  trackDownload(fileName: string, fileType?: string): void {
    this.track({
      eventType: EventType.DOWNLOAD,
      metadata: { fileName, fileType }
    });
  }

  trackConversion(type: string, value?: number): void {
    this.track({
      eventType: EventType.CONVERSION,
      value,
      metadata: { type }
    });
  }
}

// Create singleton instance
const analytics = new Analytics();

export default analytics;
