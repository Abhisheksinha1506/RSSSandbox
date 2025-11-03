'use client';

import { useState, useCallback } from 'react';
import { FeedInput } from '@/components/common/FeedInput';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Image as ImageIcon, Download } from 'lucide-react';
import { api } from '@/lib/api';

interface AccessibilityIssue {
  type: 'image' | 'enclosure';
  itemIndex: number;
  itemTitle: string;
  url: string;
  issue: string;
  location: string;
}

interface AccessibilityResult {
  issues: AccessibilityIssue[];
  totalImages: number;
  totalEnclosures: number;
  missingAltText: number;
  missingDescriptions: number;
}

interface ModifiedFeed {
  original: string;
  modified: string;
  changes: Array<{
    type: 'image_alt_added' | 'enclosure_description_added';
    location: string;
    value: string;
  }>;
}

export default function AccessibilityPage() {
  const [result, setResult] = useState<AccessibilityResult | null>(null);
  const [modifiedFeed, setModifiedFeed] = useState<ModifiedFeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  const handleSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setModifiedFeed(null);
    setCurrentUrl(url);

    try {
      const response = await api.checkAccessibility(url);
      
      if (!response.success || !response.data) {
        setError(response.error || 'Failed to check accessibility');
        setLoading(false);
        return;
      }

      setResult(response.data as AccessibilityResult);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check accessibility');
      setLoading(false);
    }
  }, []);

  const handleFixFeed = useCallback(async () => {
    if (!currentUrl) return;

    setLoading(true);
    setError(null);

    try {
      // Call API with fix=true to get modified feed
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/accessibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl, fix: true }),
      });

      const data = await response.json();
      
      if (!data.success || !data.data) {
        setError(data.error || 'Failed to fix feed');
        setLoading(false);
        return;
      }

      setModifiedFeed(data.data as ModifiedFeed);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fix feed');
      setLoading(false);
    }
  }, [currentUrl]);

  const downloadFeed = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="container py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Alt/Text Enforcer
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Check and fix missing alt-text in images and enclosures for better accessibility.
        </p>
      </div>

      <div className="mb-4 sm:mb-6">
        <FeedInput 
          onSubmit={handleSubmit} 
          isLoading={loading}
          description="Check images and enclosures for missing alt-text and descriptions"
        />
      </div>

      {loading && <LoadingState message="Checking accessibility..." />}

      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => {
            if (currentUrl) handleSubmit(currentUrl);
          }}
        />
      )}

      {result && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg sm:text-xl">Accessibility Summary</CardTitle>
                {result.missingAltText === 0 && result.missingDescriptions === 0 ? (
                  <Badge className="bg-green-500 text-xs sm:text-sm">
                    All Good
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs sm:text-sm">
                    Issues Found
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Images</p>
                  <p className="text-xl sm:text-2xl font-bold">{result.totalImages}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Enclosures</p>
                  <p className="text-xl sm:text-2xl font-bold">{result.totalEnclosures}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Missing Alt Text</p>
                  <p className="text-xl sm:text-2xl font-bold text-destructive">{result.missingAltText}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Missing Descriptions</p>
                  <p className="text-xl sm:text-2xl font-bold text-destructive">{result.missingDescriptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Issues Found</CardTitle>
                <CardDescription>
                  {result.issues.length} accessibility issue{result.issues.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.issues.map((issue, index) => (
                    <div key={index} className="flex gap-2 sm:gap-3 p-3 rounded-lg border">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <Badge variant={issue.type === 'image' ? 'default' : 'secondary'} className="text-xs sm:text-sm w-fit">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {issue.type}
                          </Badge>
                          <span className="font-medium text-sm sm:text-base break-words">{issue.itemTitle}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1 break-words">{issue.issue}</p>
                        <p className="text-xs font-mono text-muted-foreground break-all">{issue.url}</p>
                        <p className="text-xs text-muted-foreground mt-1 break-all">Location: {issue.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.missingAltText > 0 || result.missingDescriptions > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Fix Feed</CardTitle>
                <CardDescription>
                  Automatically add alt-text to images and descriptions to enclosures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleFixFeed} disabled={loading}>
                  Generate Fixed Feed
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Clear!</CardTitle>
                <CardDescription>
                  Your feed has no accessibility issues. All images have alt-text and all enclosures have descriptions.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      )}

      {modifiedFeed && (
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Fixed Feed</CardTitle>
              <CardDescription className="text-sm">
                {modifiedFeed.changes.length} change{modifiedFeed.changes.length !== 1 ? 's' : ''} made
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => downloadFeed(modifiedFeed.modified, 'feed-fixed.xml')}
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Fixed Feed
                </Button>
                <Button
                  onClick={() => downloadFeed(modifiedFeed.original, 'feed-original.xml')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Original
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-semibold">Changes Made:</h3>
                {modifiedFeed.changes.map((change, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs sm:text-sm w-fit">{change.type}</Badge>
                      <span className="text-xs sm:text-sm font-mono break-all">{change.location}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">Added: {change.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="modified" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="modified" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Fixed Feed</TabsTrigger>
              <TabsTrigger value="original" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Original Feed</TabsTrigger>
            </TabsList>
            <TabsContent value="modified" className="mt-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <pre className="text-xs overflow-auto max-h-96 bg-muted p-3 sm:p-4 rounded">
                    {modifiedFeed.modified}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="original" className="mt-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <pre className="text-xs overflow-auto max-h-96 bg-muted p-3 sm:p-4 rounded">
                    {modifiedFeed.original}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
