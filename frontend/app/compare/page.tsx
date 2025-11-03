'use client';

import { useState } from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, Info, GitCompare } from 'lucide-react';
import { api } from '@/lib/api';

interface FeedComparison {
  feed1Url: string;
  feed2Url: string;
  differences: {
    metadata: {
      title: { same: boolean; feed1?: string; feed2?: string };
      description: { same: boolean; feed1?: string; feed2?: string };
      link: { same: boolean; feed1?: string; feed2?: string };
      language: { same: boolean; feed1?: string; feed2?: string };
      image: { same: boolean; feed1?: string; feed2?: string };
    };
    items: {
      count: { same: boolean; feed1: number; feed2: number };
      commonItems: number;
      uniqueToFeed1: number;
      uniqueToFeed2: number;
      itemDifferences: Array<{
        guid: string;
        differences: string[];
      }>;
    };
    structure: {
      feed1Type: 'rss' | 'atom' | 'json';
      feed2Type: 'rss' | 'atom' | 'json';
      sameType: boolean;
    };
  };
  summary: {
    similarity: number;
    recommendations: string[];
  };
}

export default function ComparePage() {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [result, setResult] = useState<FeedComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!url1.trim() || !url2.trim()) {
      setError('Please provide both feed URLs');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.compareFeeds(url1.trim(), url2.trim());
      
      if (!response.success || !response.data) {
        setError(response.error || 'Failed to compare feeds');
        setLoading(false);
        return;
      }

      setResult(response.data as FeedComparison);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare feeds');
      setLoading(false);
    }
  };

  const getSimilarityBadge = (similarity: number) => {
    if (similarity >= 80) {
      return <Badge className="bg-green-500 text-xs sm:text-sm">Very Similar</Badge>;
    } else if (similarity >= 60) {
      return <Badge className="bg-blue-500 text-xs sm:text-sm">Similar</Badge>;
    } else if (similarity >= 40) {
      return <Badge variant="secondary" className="text-xs sm:text-sm">Different</Badge>;
    } else {
      return <Badge variant="destructive" className="text-xs sm:text-sm">Very Different</Badge>;
    }
  };

  return (
    <div className="container py-8 sm:py-12 px-4 sm:px-6 max-w-7xl">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Feed Comparison Tool
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Compare two feeds side-by-side to find differences and similarities.
        </p>
      </div>

      <Card className="border-2 shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feed-url-1" className="text-base font-semibold">Feed 1 URL</Label>
            <Input
              id="feed-url-1"
              type="url"
              placeholder="https://example.com/feed1.xml"
              value={url1}
              onChange={(e) => setUrl1(e.target.value)}
              disabled={loading}
              className="text-sm sm:text-base h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feed-url-2" className="text-base font-semibold">Feed 2 URL</Label>
            <Input
              id="feed-url-2"
              type="url"
              placeholder="https://example.com/feed2.xml"
              value={url2}
              onChange={(e) => setUrl2(e.target.value)}
              disabled={loading}
              className="text-sm sm:text-base h-11"
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !url1.trim() || !url2.trim()} 
            className="w-full h-11 font-semibold"
          >
            {loading ? 'Comparing...' : 'Compare Feeds'}
          </Button>
        </div>
      </Card>

      {loading && <LoadingState message="Comparing feeds..." />}

      {error && <ErrorDisplay error={error} />}

      {result && (
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  Similarity Score
                </CardTitle>
                {getSimilarityBadge(result.summary.similarity)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Similarity:</span>
                  <span className="text-2xl font-bold">{result.summary.similarity}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${result.summary.similarity}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Overview</TabsTrigger>
              <TabsTrigger value="metadata" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Metadata</TabsTrigger>
              <TabsTrigger value="items" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Items</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Structure Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Feed 1 Type</p>
                      <Badge variant="outline" className="text-xs sm:text-sm">{result.differences.structure.feed1Type.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Feed 2 Type</p>
                      <Badge variant="outline" className="text-xs sm:text-sm">{result.differences.structure.feed2Type.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Same Type</p>
                      {result.differences.structure.sameType ? (
                        <Badge className="bg-green-500 text-xs sm:text-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs sm:text-sm">
                          <XCircle className="h-3 w-3 mr-1" />
                          No
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Item Count Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Feed 1 Items</p>
                      <p className="text-xl sm:text-2xl font-bold">{result.differences.items.count.feed1}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Feed 2 Items</p>
                      <p className="text-xl sm:text-2xl font-bold">{result.differences.items.count.feed2}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Common Items</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{result.differences.items.commonItems}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Unique Items</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {result.differences.items.uniqueToFeed1 + result.differences.items.uniqueToFeed2}
                      </p>
                    </div>
                  </div>
                  {result.differences.items.uniqueToFeed1 > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <p className="text-xs sm:text-sm">
                        <strong>Feed 1 only:</strong> {result.differences.items.uniqueToFeed1} item(s)
                      </p>
                    </div>
                  )}
                  {result.differences.items.uniqueToFeed2 > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                      <p className="text-xs sm:text-sm">
                        <strong>Feed 2 only:</strong> {result.differences.items.uniqueToFeed2} item(s)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {result.summary.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.summary.recommendations.map((rec, index) => (
                        <div key={index} className="flex gap-2 p-3 rounded-lg bg-muted">
                          <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                          <p className="text-xs sm:text-sm break-words">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Metadata Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(result.differences.metadata).map(([key, value]) => (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          {value.same ? (
                            <Badge className="bg-green-500 text-xs sm:text-sm">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Same
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs sm:text-sm">
                              <XCircle className="h-3 w-3 mr-1" />
                              Different
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Feed 1</p>
                            <p className="text-sm font-mono break-all">{value.feed1 || '(empty)'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Feed 2</p>
                            <p className="text-sm font-mono break-all">{value.feed2 || '(empty)'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="space-y-4 mt-6">
              {result.differences.items.itemDifferences.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Item Differences</CardTitle>
                    <CardDescription className="text-sm">
                      {result.differences.items.itemDifferences.length} item(s) have differences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-auto">
                      {result.differences.items.itemDifferences.map((item, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs sm:text-sm font-mono break-all">{item.guid}</p>
                            <Badge variant="secondary" className="text-xs sm:text-sm">
                              {item.differences.length} difference(s)
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {item.differences.map((diff, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground">
                                • {diff}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Item Differences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <p className="text-sm">All common items are identical!</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

