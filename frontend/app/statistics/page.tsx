'use client';

import { useState, useMemo, useCallback } from 'react';
import { FeedInput } from '@/components/common/FeedInput';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, Info, TrendingUp, Calendar, User, Tag, Image as ImageIcon, FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface FeedStatistics {
  feedUrl: string;
  feedType: 'rss' | 'atom' | 'json';
  metadata: {
    hasTitle: boolean;
    hasDescription: boolean;
    hasImage: boolean;
    hasLanguage: boolean;
    hasCopyright: boolean;
    hasDates: boolean;
  };
  items: {
    total: number;
    withTitle: number;
    withDescription: number;
    withContent: number;
    withImages: number;
    withEnclosures: number;
    withAuthors: number;
    withCategories: number;
    withDates: number;
    averageTitleLength: number;
    averageDescriptionLength: number;
    averageContentLength: number;
  };
  content: {
    totalImages: number;
    totalEnclosures: number;
    totalCategories: number;
    uniqueCategories: number;
    uniqueAuthors: number;
    averageItemsPerDay?: number;
    updateFrequency?: 'high' | 'medium' | 'low' | 'unknown';
  };
  dates: {
    oldestItem?: string;
    newestItem?: string;
    dateRange?: number;
    itemsWithDates: number;
    itemsWithoutDates: number;
  };
  quality: {
    completenessScore: number;
    recommendations: string[];
  };
}

export default function StatisticsPage() {
  const [result, setResult] = useState<FeedStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.getStatistics(url);
      
      if (!response.success || !response.data) {
        setError(response.error || 'Failed to get statistics');
        setLoading(false);
        return;
      }

      const stats = response.data as FeedStatistics;
      // Convert date strings back to Date objects if needed
      if (stats.dates.oldestItem && typeof stats.dates.oldestItem === 'string') {
        stats.dates.oldestItem = new Date(stats.dates.oldestItem).toISOString();
      }
      if (stats.dates.newestItem && typeof stats.dates.newestItem === 'string') {
        stats.dates.newestItem = new Date(stats.dates.newestItem).toISOString();
      }

      setResult(stats);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get statistics');
      setLoading(false);
    }
  }, []);

  const getQualityBadge = useCallback((score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-500 text-xs sm:text-sm">Excellent</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-blue-500 text-xs sm:text-sm">Good</Badge>;
    } else if (score >= 40) {
      return <Badge variant="secondary" className="text-xs sm:text-sm">Fair</Badge>;
    } else {
      return <Badge variant="destructive" className="text-xs sm:text-sm">Poor</Badge>;
    }
  }, []);

  const getFrequencyBadge = useCallback((frequency?: string) => {
    if (!frequency || frequency === 'unknown') return <Badge variant="outline">Unknown</Badge>;
    if (frequency === 'high') return <Badge className="bg-green-500">High</Badge>;
    if (frequency === 'medium') return <Badge className="bg-blue-500">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  }, []);

  return (
    <div className="container py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Feed Statistics Dashboard
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Comprehensive statistics and metrics for your RSS feed.
        </p>
      </div>

      <div className="mb-4 sm:mb-6">
        <FeedInput 
          onSubmit={handleSubmit} 
          isLoading={loading}
          description="Enter a feed URL to get comprehensive statistics and quality metrics"
        />
      </div>

      {loading && <LoadingState message="Analyzing feed statistics..." />}

      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => {
            const input = document.querySelector('input[type="url"]') as HTMLInputElement;
            if (input?.value) handleSubmit(input.value);
          }}
        />
      )}

      {result && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Quality Score Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg sm:text-xl">Quality Score</CardTitle>
                {getQualityBadge(result.quality.completenessScore)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completeness Score:</span>
                  <span className="text-2xl font-bold">{result.quality.completenessScore}/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${result.quality.completenessScore}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Overview</TabsTrigger>
              <TabsTrigger value="items" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Items</TabsTrigger>
              <TabsTrigger value="content" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Content</TabsTrigger>
              <TabsTrigger value="recommendations" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Feed Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Feed Type</p>
                      <Badge variant="outline" className="text-xs sm:text-sm">{result.feedType.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Items</p>
                      <p className="text-xl sm:text-2xl font-bold">{result.items.total}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Update Frequency</p>
                      {getFrequencyBadge(result.content.updateFrequency)}
                    </div>
                    {result.content.averageItemsPerDay && (
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Avg Items/Day</p>
                        <p className="text-xl sm:text-2xl font-bold">{result.content.averageItemsPerDay}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Unique Authors</p>
                      <p className="text-xl sm:text-2xl font-bold">{result.content.uniqueAuthors}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Unique Categories</p>
                      <p className="text-xl sm:text-2xl font-bold">{result.content.uniqueCategories}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Metadata Completeness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(result.metadata).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-xs sm:text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        {value ? (
                          <Badge className="bg-green-500 text-xs sm:text-sm">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Present
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs sm:text-sm">
                            <XCircle className="h-3 w-3 mr-1" />
                            Missing
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Item Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Items</p>
                      <p className="text-xl sm:text-2xl font-bold">{result.items.total}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">With Titles</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{result.items.withTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">With Descriptions</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{result.items.withDescription}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">With Content</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{result.items.withContent}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">With Dates</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{result.items.withDates}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">With Authors</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{result.items.withAuthors}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">With Categories</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{result.items.withCategories}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">With Images</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{result.items.withImages}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">With Enclosures</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{result.items.withEnclosures}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Content Length Averages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Avg Title Length</p>
                      <p className="text-xl sm:text-2xl font-bold">{result.items.averageTitleLength} chars</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Avg Description Length</p>
                      <p className="text-xl sm:text-2xl font-bold">{result.items.averageDescriptionLength} chars</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Avg Content Length</p>
                      <p className="text-xl sm:text-2xl font-bold">{result.items.averageContentLength} chars</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Content Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Total Images
                      </p>
                      <p className="text-xl sm:text-2xl font-bold">{result.content.totalImages}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Total Enclosures
                      </p>
                      <p className="text-xl sm:text-2xl font-bold">{result.content.totalEnclosures}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Total Categories
                      </p>
                      <p className="text-xl sm:text-2xl font-bold">{result.content.totalCategories}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Unique Authors
                      </p>
                      <p className="text-xl sm:text-2xl font-bold">{result.content.uniqueAuthors}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {result.dates.oldestItem && result.dates.newestItem && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Date Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Oldest Item</p>
                        <p className="text-sm font-medium">
                          {new Date(result.dates.oldestItem).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Newest Item</p>
                        <p className="text-sm font-medium">
                          {new Date(result.dates.newestItem).toLocaleDateString()}
                        </p>
                      </div>
                      {result.dates.dateRange !== undefined && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Date Range</p>
                          <p className="text-sm font-medium">{result.dates.dateRange} days</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Items With Dates</p>
                        <p className="text-sm font-medium">
                          {result.dates.itemsWithDates} / {result.items.total}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Recommendations</CardTitle>
                  <CardDescription className="text-sm">
                    Suggestions to improve your feed quality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.quality.recommendations.map((rec, index) => (
                      <div key={index} className="flex gap-2 p-3 rounded-lg bg-muted">
                        <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                        <p className="text-xs sm:text-sm break-words">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

