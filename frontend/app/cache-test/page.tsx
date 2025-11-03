'use client';

import { useState, useCallback } from 'react';
import { FeedInput } from '@/components/common/FeedInput';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { CopyButton } from '@/components/common/CopyButton';

interface CacheTestResult {
  url: string;
  headers: {
    etag?: string;
    lastModified?: string;
    cacheControl?: string;
    expires?: string;
  };
  cacheControlDirectives: Record<string, string | number>;
  conditionalGet: {
    etagTest?: {
      status: number;
      responseTime: number;
      cached: boolean;
    };
    lastModifiedTest?: {
      status: number;
      responseTime: number;
      cached: boolean;
    };
  };
  recommendations: string[];
  cacheable: boolean;
}

export default function CacheTestPage() {
  const [result, setResult] = useState<CacheTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.testCache(url);
      
      if (!response.success || !response.data) {
        setError(response.error || 'Failed to test cache');
        setLoading(false);
        return;
      }

      setResult(response.data as CacheTestResult);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test cache');
      setLoading(false);
    }
  }, []);

  return (
    <div className="container py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          HTTP Caching Tester
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Test ETag, Last-Modified headers and conditional GET behavior to ensure proper caching.
        </p>
      </div>

      <div className="mb-4 sm:mb-6">
        <FeedInput 
          onSubmit={handleSubmit} 
          isLoading={loading}
          description="Enter your feed URL to test HTTP caching headers and conditional GET behavior"
        />
      </div>

      {loading && <LoadingState message="Testing HTTP caching..." />}

      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => {
            const lastUrl = result?.url;
            if (lastUrl) handleSubmit(lastUrl);
          }}
        />
      )}

      {result && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-base sm:text-lg md:text-xl">Cache Status</CardTitle>
                {result.cacheable ? (
                  <Badge className="bg-green-500 text-xs sm:text-sm">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Cacheable
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs sm:text-sm">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Cacheable
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium">ETag:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-mono break-all text-left sm:text-right">
                      {result.headers.etag || <span className="text-muted-foreground">Not present</span>}
                    </span>
                    {result.headers.etag && (
                      <CopyButton text={result.headers.etag} size="sm" variant="ghost" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium">Last-Modified:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-mono break-all text-left sm:text-right">
                      {result.headers.lastModified || <span className="text-muted-foreground">Not present</span>}
                    </span>
                    {result.headers.lastModified && (
                      <CopyButton text={result.headers.lastModified} size="sm" variant="ghost" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium">Cache-Control:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-mono break-all text-left sm:text-right">
                      {result.headers.cacheControl || <span className="text-muted-foreground">Not present</span>}
                    </span>
                    {result.headers.cacheControl && (
                      <CopyButton text={result.headers.cacheControl} size="sm" variant="ghost" />
                    )}
                  </div>
                </div>
                {result.headers.expires && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                    <span className="text-xs sm:text-sm font-medium">Expires:</span>
                    <span className="text-xs sm:text-sm font-mono break-all text-left sm:text-right">{result.headers.expires}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {Object.keys(result.cacheControlDirectives).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cache-Control Directives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(result.cacheControlDirectives).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-medium font-mono">{key}:</span>
                      <Badge variant="secondary">{String(value)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(result.conditionalGet.etagTest || result.conditionalGet.lastModifiedTest) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Conditional GET Test Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.conditionalGet.etagTest && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <span className="text-xs sm:text-sm font-medium">ETag Test:</span>
                      {result.conditionalGet.etagTest.cached ? (
                        <Badge className="bg-green-500 text-xs sm:text-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          304 Not Modified
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs sm:text-sm">
                          <XCircle className="h-3 w-3 mr-1" />
                          {result.conditionalGet.etagTest.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Response time: {result.conditionalGet.etagTest.responseTime}ms
                    </p>
                  </div>
                )}

                {result.conditionalGet.lastModifiedTest && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <span className="text-xs sm:text-sm font-medium">Last-Modified Test:</span>
                      {result.conditionalGet.lastModifiedTest.cached ? (
                        <Badge className="bg-green-500 text-xs sm:text-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          304 Not Modified
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs sm:text-sm">
                          <XCircle className="h-3 w-3 mr-1" />
                          {result.conditionalGet.lastModifiedTest.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Response time: {result.conditionalGet.lastModifiedTest.responseTime}ms
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="flex gap-2 p-3 rounded-lg bg-muted">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <p className="text-xs sm:text-sm break-words">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
