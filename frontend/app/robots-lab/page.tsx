'use client';

import { useState, useCallback } from 'react';
import { FeedInput } from '@/components/common/FeedInput';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { api } from '@/lib/api';

interface RobotsTestResult {
  robotsUrl: string;
  robotsText?: string;
  rules: Array<{
    allowed: boolean;
    disallowed: boolean;
    crawlDelay?: number;
    userAgent: string;
  }>;
  feedPath: string;
  feedAllowed: boolean;
  feedBlockedUserAgents: string[];
}

interface CorsTestResult {
  feedUrl: string;
  headers: Record<string, string>;
  corsEnabled: boolean;
  allowsAnyOrigin: boolean;
  allowedMethods: string[];
  allowedHeaders: string[];
  recommendations: string[];
}

interface HeadersLabResult {
  robots: RobotsTestResult;
  cors: CorsTestResult;
  httpHeaders: Record<string, string>;
  recommendations: string[];
}

export default function RobotsLabPage() {
  const [result, setResult] = useState<HeadersLabResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.testRobots(url);
      
      if (!response.success || !response.data) {
        setError(response.error || 'Failed to test robots and headers');
        setLoading(false);
        return;
      }

      setResult(response.data as HeadersLabResult);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test robots and headers');
      setLoading(false);
    }
  }, []);

  return (
    <div className="container py-8 sm:py-12 px-4 sm:px-6 max-w-7xl">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Robots/Headers Lab
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Test robots.txt rules, CORS headers, and simulate how different clients access your feed.
        </p>
      </div>

      <div className="mb-4 sm:mb-6">
        <FeedInput onSubmit={handleSubmit} isLoading={loading} />
      </div>

      {loading && <LoadingState message="Testing robots.txt and headers..." />}

      {error && <ErrorDisplay error={error} />}

      {result && (
        <div className="space-y-6">
          <Tabs defaultValue="robots" className="w-full">
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full h-auto">
              <TabsTrigger value="robots" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Robots.txt</TabsTrigger>
              <TabsTrigger value="cors" className="text-xs sm:text-sm px-2 sm:px-3 py-2">CORS Headers</TabsTrigger>
              <TabsTrigger value="headers" className="text-xs sm:text-sm px-2 sm:px-3 py-2">HTTP Headers</TabsTrigger>
              <TabsTrigger value="recommendations" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="robots" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Robots.txt Status</CardTitle>
                    {result.robots.feedAllowed ? (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Feed Allowed
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Feed Blocked
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Robots URL: {result.robots.robotsUrl}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.robots.robotsText ? (
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-2">Robots.txt Content:</h3>
                      <pre className="text-xs bg-muted p-3 sm:p-4 rounded overflow-auto max-h-64 font-mono">
                        {result.robots.robotsText}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <p className="break-all">No robots.txt found at {result.robots.robotsUrl}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm sm:text-base font-semibold mb-2">User Agent Rules:</h3>
                    <div className="space-y-2">
                      {result.robots.rules.map((rule, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <span className="text-sm sm:text-base font-medium break-words">{rule.userAgent}</span>
                            {rule.crawlDelay && (
                              <Badge variant="secondary" className="text-xs sm:text-sm w-fit">Crawl Delay: {rule.crawlDelay}s</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {rule.allowed ? (
                              <Badge className="bg-green-500 text-xs sm:text-sm">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Allowed
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs sm:text-sm">
                                <XCircle className="h-3 w-3 mr-1" />
                                Blocked
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.robots.feedBlockedUserAgents.length > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive">
                      <p className="text-sm font-medium text-destructive mb-1">Blocked User Agents:</p>
                      <p className="text-sm text-muted-foreground">
                        {result.robots.feedBlockedUserAgents.join(', ')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cors" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>CORS Headers</CardTitle>
                    {result.cors.corsEnabled ? (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Enabled
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Access-Control-Allow-Origin:</span>
                      <span className="text-sm font-mono">
                        {result.cors.headers['access-control-allow-origin'] || (
                          <span className="text-muted-foreground">Not present</span>
                        )}
                      </span>
                    </div>
                    {result.cors.allowsAnyOrigin && (
                      <Badge variant="destructive" className="mt-2">
                        ⚠️ Allows any origin
                      </Badge>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Access-Control-Allow-Methods:</span>
                      <span className="text-sm font-mono">
                        {result.cors.headers['access-control-allow-methods'] || (
                          <span className="text-muted-foreground">Not present</span>
                        )}
                      </span>
                    </div>

                    {result.cors.allowedMethods.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.cors.allowedMethods.map((method, index) => (
                          <Badge key={index} variant="secondary">{method}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Access-Control-Allow-Headers:</span>
                      <span className="text-sm font-mono">
                        {result.cors.headers['access-control-allow-headers'] || (
                          <span className="text-muted-foreground">Not present</span>
                        )}
                      </span>
                    </div>

                    {result.cors.allowedHeaders.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.cors.allowedHeaders.map((header, index) => (
                          <Badge key={index} variant="secondary">{header}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Access-Control-Max-Age:</span>
                      <span className="text-sm font-mono">
                        {result.cors.headers['access-control-max-age'] || (
                          <span className="text-muted-foreground">Not present</span>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="headers" className="space-y-4 mt-4 sm:mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">HTTP Headers</CardTitle>
                  <CardDescription className="text-sm">
                    All HTTP headers returned by the feed server
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(result.httpHeaders).map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0 p-2 rounded border">
                        <span className="text-xs sm:text-sm font-mono font-medium break-all">{key}:</span>
                        <span className="text-xs sm:text-sm font-mono text-muted-foreground sm:ml-4 sm:text-right flex-1 break-all">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4 mt-4 sm:mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Recommendations</CardTitle>
                  <CardDescription className="text-sm">
                    Suggestions to improve your feed's accessibility and security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <div key={index} className="flex gap-2 p-3 rounded-lg border">
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
