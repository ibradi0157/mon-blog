'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import analytics from '@/lib/analytics';

interface AnalyticsContextType {
  track: typeof analytics.track;
  trackPageView: typeof analytics.trackPageView;
  trackArticleView: typeof analytics.trackArticleView;
  trackArticleLike: typeof analytics.trackArticleLike;
  trackArticleDislike: typeof analytics.trackArticleDislike;
  trackArticleShare: typeof analytics.trackArticleShare;
  trackSearch: typeof analytics.trackSearch;
  trackNewsletterSignup: typeof analytics.trackNewsletterSignup;
  trackUserSignup: typeof analytics.trackUserSignup;
  trackUserLogin: typeof analytics.trackUserLogin;
  trackDownload: typeof analytics.trackDownload;
  trackConversion: typeof analytics.trackConversion;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Set user ID when user logs in
    if (user?.id) {
      analytics.setUserId(user.id);
    }
  }, [user]);

  const contextValue: AnalyticsContextType = {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackArticleView: analytics.trackArticleView.bind(analytics),
    trackArticleLike: analytics.trackArticleLike.bind(analytics),
    trackArticleDislike: analytics.trackArticleDislike.bind(analytics),
    trackArticleShare: analytics.trackArticleShare.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackNewsletterSignup: analytics.trackNewsletterSignup.bind(analytics),
    trackUserSignup: analytics.trackUserSignup.bind(analytics),
    trackUserLogin: analytics.trackUserLogin.bind(analytics),
    trackDownload: analytics.trackDownload.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
