// Bundle analysis utilities for performance monitoring
export interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  assets: AssetInfo[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
}

export interface AssetInfo {
  name: string;
  size: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
}

// Performance metrics collection
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    this.addMetric(`render_${componentName}`, endTime - startTime);
  }

  // Measure API call duration
  async measureApiCall<T>(name: string, apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const endTime = performance.now();
      this.addMetric(`api_${name}`, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.addMetric(`api_${name}_error`, endTime - startTime);
      throw error;
    }
  }

  // Add metric
  private addMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get performance statistics
  getStats(metricName: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  // Get all metrics
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        stats[name] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    }
    return stats;
  }

  // Core Web Vitals measurement
  measureCoreWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.addMetric('lcp', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.addMetric('fid', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.addMetric('cls', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Memory usage monitoring
  measureMemoryUsage(): void {
    if (typeof window === 'undefined' || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    this.addMetric('memory_used', memory.usedJSHeapSize);
    this.addMetric('memory_total', memory.totalJSHeapSize);
    this.addMetric('memory_limit', memory.jsHeapSizeLimit);
  }

  // Network information
  getNetworkInfo(): {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null {
    if (typeof window === 'undefined' || !(navigator as any).connection) {
      return null;
    }

    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  // Export metrics for analysis
  exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      metrics: this.getAllStats(),
      network: this.getNetworkInfo(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Send metrics to analytics endpoint
  async sendMetrics(endpoint: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const data = this.exportMetrics();
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      });
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    measureRender: (name: string, fn: () => void) => monitor.measureRender(name, fn),
    measureApiCall: <T>(name: string, apiCall: () => Promise<T>) => monitor.measureApiCall(name, apiCall),
    getStats: (name: string) => monitor.getStats(name),
    getAllStats: () => monitor.getAllStats(),
    exportMetrics: () => monitor.exportMetrics(),
    sendMetrics: (endpoint: string) => monitor.sendMetrics(endpoint),
  };
}

// Bundle size analyzer (for development)
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('📦 Bundle Analysis');
  
  // Analyze loaded scripts
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  let totalSize = 0;
  
  scripts.forEach(async (script) => {
    const src = (script as HTMLScriptElement).src;
    if (src.includes('/_next/')) {
      try {
        const response = await fetch(src, { method: 'HEAD' });
        const size = parseInt(response.headers.get('content-length') || '0');
        totalSize += size;
        console.log(`📄 ${src.split('/').pop()}: ${(size / 1024).toFixed(2)} KB`);
      } catch (error) {
        console.warn('Failed to analyze script size:', src);
      }
    }
  });

  console.log(`📊 Total estimated bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.groupEnd();
}
