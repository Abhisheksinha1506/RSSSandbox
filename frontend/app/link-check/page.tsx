'use client';

import { useState } from 'react';
import { FeedInput } from '@/components/common/FeedInput';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

interface LinkCheckResult {
  url: string;
  status: number;
  statusText: string;
  ok: boolean;
  redirectChain?: string[];
  error?: string;
}

interface FeedLinkCheckResult {
  feedUrl: string;
  totalLinks: number;
  checkedLinks: number;
  brokenLinks: number;
  redirectLinks: number;
  workingLinks: number;
  links: LinkCheckResult[];
  recommendations: string[];
}

export default function LinkCheckPage() {
  const [result, setResult] = useState<FeedLinkCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.checkLinks(url);
      
      if (!response.success || !response.data) {
        setError(response.error || 'Failed to check links');
        setLoading(false);
        return;
      }

      setResult(response.data as FeedLinkCheckResult);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check links');
      setLoading(false);
    }
  };

  const getStatusBadge = (link: LinkCheckResult) => {
    if (link.ok) {
      return (
        <Badge className="bg-green-500 text-xs sm:text-sm">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {link.status} OK
        </Badge>
      );
    } else if (link.status >= 300 && link.status < 400) {
      return (
        <Badge variant="secondary" className="text-xs sm:text-sm">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {link.status} Redirect
        </Badge>
      );
    } else if (link.status === 404) {
      return (
        <Badge variant="destructive" className="text-xs sm:text-sm">
          <XCircle className="h-3 w-3 mr-1" />
          404 Broken
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs sm:text-sm">
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
  };

  return (
    <div className="container py-8 sm:py-12 px-4 sm:px-6 max-w-7xl">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Feed Link Checker
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Validate all links in your feed to find broken URLs, redirects, and accessibility issues.
        </p>
      </div>

      <div className="mb-4 sm:mb-6">
        <FeedInput onSubmit={handleSubmit} isLoading={loading} />
      </div>

      {loading && <LoadingState message="Checking all links in feed..." />}

      {error && <ErrorDisplay error={error} />}

      {result && (
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg sm:text-xl">Link Check Summary</CardTitle>
                {result.brokenLinks === 0 ? (
                  <Badge className="bg-green-500 text-xs sm:text-sm">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    All Links Working
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs sm:text-sm">
                    <XCircle className="h-3 w-3 mr-1" />
                    {result.brokenLinks} Broken Link(s)
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Links</p>
                  <p className="text-xl sm:text-2xl font-bold">{result.totalLinks}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Working Links</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{result.workingLinks}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Broken Links</p>
                  <p className="text-xl sm:text-2xl font-bold text-destructive">{result.brokenLinks}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Redirects</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-600">{result.redirectLinks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Link Details</CardTitle>
              <CardDescription className="text-sm">
                {result.links.length} link(s) checked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-auto">
                {result.links.map((link, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm font-mono text-primary hover:underline break-all flex items-center gap-1"
                        >
                          {link.url}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                        {getStatusBadge(link)}
                      </div>
                      {link.error && (
                        <p className="text-xs text-destructive mt-1 break-words">{link.error}</p>
                      )}
                      {link.redirectChain && link.redirectChain.length > 1 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Redirect Chain:</p>
                          {link.redirectChain.map((url, idx) => (
                            <p key={idx} className="text-xs font-mono text-muted-foreground ml-2">
                              {idx + 1}. {url}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

