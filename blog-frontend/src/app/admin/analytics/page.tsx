'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange, type DateRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';

// Local date helpers (avoid external deps)
function addDaysLocal(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatYYYYMMDD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface AnalyticsOverview {
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

interface TimeSeriesData {
  date: string;
  value: number;
}

interface RealTimeStats {
  [key: string]: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDaysLocal(new Date(), -30),
    to: new Date(),
  });
  const [selectedMetric, setSelectedMetric] = useState('page_view');
  const [granularity, setGranularity] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  useEffect(() => {
    if (token) {
      fetchAnalyticsData();
      fetchRealTimeStats();
      
      // Refresh real-time stats every 30 seconds
      const interval = setInterval(fetchRealTimeStats, 30000);
      return () => clearInterval(interval);
    }
  }, [token, dateRange, selectedMetric, granularity]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

      // Fetch overview
      const overviewResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/overview?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const overviewData = await overviewResponse.json();
      setOverview(overviewData);

      // Fetch time series
      const timeSeriesParams = new URLSearchParams(params);
      timeSeriesParams.append('metric', selectedMetric);
      timeSeriesParams.append('granularity', granularity);

      const timeSeriesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/timeseries?${timeSeriesParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const timeSeriesData = await timeSeriesResponse.json();
      setTimeSeriesData(timeSeriesData);

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTimeStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/realtime`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setRealTimeStats(data);
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const exportData = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/export?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analytics-${formatYYYYMMDD(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (loading && !overview) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor your blog's performance and user engagement</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Activity
          </CardTitle>
          <CardDescription>Live stats from the last 5 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{realTimeStats.online_users || 0}</div>
              <div className="text-sm text-muted-foreground">Online Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeStats.page_view || 0}</div>
              <div className="text-sm text-muted-foreground">Page Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeStats.article_view || 0}</div>
              <div className="text-sm text-muted-foreground">Article Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeStats.search || 0}</div>
              <div className="text-sm text-muted-foreground">Searches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeStats.article_like || 0}</div>
              <div className="text-sm text-muted-foreground">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeStats.article_share || 0}</div>
              <div className="text-sm text-muted-foreground">Shares</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalPageViews.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalSessions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalUsers.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(overview.avgSessionDuration)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Traffic Trends</CardTitle>
                  <CardDescription>View your site's traffic over time</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page_view">Page Views</SelectItem>
                      <SelectItem value="article_view">Article Views</SelectItem>
                      <SelectItem value="search">Searches</SelectItem>
                      <SelectItem value="article_like">Likes</SelectItem>
                      <SelectItem value="article_share">Shares</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={granularity} onValueChange={(value: any) => setGranularity(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hour">Hourly</SelectItem>
                      <SelectItem value="day">Daily</SelectItem>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          {overview && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Articles</CardTitle>
                <CardDescription>Most viewed articles in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview.topArticles.map((article, index) => (
                    <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{article.title}</div>
                          <div className="text-sm text-muted-foreground">ID: {article.id}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{article.views.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">views</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          {overview && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Device Types</CardTitle>
                  <CardDescription>How users access your site</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={overview.deviceStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.device} ${(entry.percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {overview.deviceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Browser Usage</CardTitle>
                  <CardDescription>Popular browsers among your visitors</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={overview.browserStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="browser" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          {overview && (
            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Where your traffic is coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview.topReferrers.map((referrer, index) => (
                    <div key={referrer.referrer} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{referrer.referrer}</div>
                          <div className="text-sm text-muted-foreground">Referrer</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{referrer.visits.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">visits</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
