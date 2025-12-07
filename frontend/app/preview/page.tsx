'use client';

import { useState, useMemo, useCallback } from 'react';
import { FeedInput } from '@/components/common/FeedInput';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleReaderTemplate } from '@/components/preview/templates/GoogleReaderTemplate';
import { AppleNewsTemplate } from '@/components/preview/templates/AppleNewsTemplate';
import { MinimalistTemplate } from '@/components/preview/templates/MinimalistTemplate';
import { ClassicRSSTemplate } from '@/components/preview/templates/ClassicRSSTemplate';
import { api } from '@/lib/api';
import { Info, ChevronDown, ChevronUp, CheckCircle2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewData {
  metadata: {
    title: string;
    description?: string;
    link: string;
    image?: string;
    language?: string;
  };
  items: Array<{
    title: string;
    link: string;
    description?: string;
    content?: string;
    pubDate?: string | Date;
    author?: string;
    image?: string;
    categories?: string[];
  }>;
  feedType: 'rss' | 'atom' | 'json';
}

export default function PreviewPage() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('google');
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const result = await api.previewFeed(url);
      
      if (!result.success || !result.data) {
        setError(result.error || 'Failed to load feed preview');
        setLoading(false);
        return;
      }

      // Convert date strings back to Date objects
      const data = result.data as PreviewData;
      const processedData: PreviewData = {
        ...data,
        items: data.items.map(item => ({
          ...item,
          pubDate: item.pubDate ? (typeof item.pubDate === 'string' ? new Date(item.pubDate) : item.pubDate) : undefined,
        })),
      };

      setPreviewData(processedData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed preview');
      setLoading(false);
    }
  }, []);

  const templateProps = useMemo(() => {
    if (!previewData) return null;

    return {
      metadata: previewData.metadata,
      items: previewData.items.map(item => ({
        ...item,
        pubDate: item.pubDate instanceof Date ? item.pubDate : (item.pubDate ? new Date(item.pubDate) : undefined),
      })),
    };
  }, [previewData]);

  const renderTemplate = useMemo(() => {
    if (!templateProps) return null;

    switch (selectedTemplate) {
      case 'google':
        return <GoogleReaderTemplate {...templateProps} />;
      case 'apple':
        return <AppleNewsTemplate {...templateProps} />;
      case 'minimalist':
        return <MinimalistTemplate {...templateProps} />;
      case 'classic':
        return <ClassicRSSTemplate {...templateProps} />;
      default:
        return <GoogleReaderTemplate {...templateProps} />;
    }
  }, [templateProps, selectedTemplate]);

  return (
    <div className="container py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Feed Preview Sandbox
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Preview how your feed looks across multiple reader templates and styles.
        </p>
      </div>

      <div className="mb-4 sm:mb-6 space-y-4">
        <Card className="border-2">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg md:text-xl">How to Use Feed Preview</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(!showInstructions)}
                className="h-8 w-8 p-0"
              >
                {showInstructions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showInstructions && (
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  What it does
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Feed Preview Sandbox lets you see how your RSS, Atom, or JSON Feed appears in different reader templates. 
                  This helps you test feed formatting and ensure your content displays correctly across various feed readers 
                  before publishing.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Step-by-step instructions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-muted-foreground ml-2">
                  <li>
                    <strong className="text-foreground">Enter a feed URL:</strong> Type or paste your feed URL into the input field above. 
                    You can also click "Examples" to try sample feeds.
                  </li>
                  <li>
                    <strong className="text-foreground">Click "Analyze":</strong> The tool will fetch and parse your feed. 
                    This may take a few seconds depending on the feed size and server response time.
                  </li>
                  <li>
                    <strong className="text-foreground">Select a template:</strong> Once loaded, use the template selector to switch 
                    between different reader styles (Google Reader, Apple News, Minimalist, Classic RSS).
                  </li>
                  <li>
                    <strong className="text-foreground">Review the preview:</strong> Check how your feed items, images, descriptions, 
                    and formatting appear in each template.
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Tips & best practices
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground ml-2">
                  <li>Ensure your feed URL is publicly accessible (no authentication required)</li>
                  <li>Some feeds may take a few seconds to load, especially if they contain many items</li>
                  <li>If you see errors, try validating your feed first using the RSS Spec & Linter tool</li>
                  <li>Check that your feed URL includes the protocol (http:// or https://)</li>
                  <li>For best results, ensure your feed follows RSS, Atom, or JSON Feed specifications</li>
                  <li>If a feed fails to load, check the error message for specific guidance on what went wrong</li>
                </ul>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> This tool only displays how your feed would appear in different 
                  reader templates. It doesn't modify your feed or affect how it's published. Use this to test and validate your feed 
                  formatting before making it available to subscribers.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        <FeedInput 
          onSubmit={handleSubmit} 
          isLoading={loading}
          description="Enter a feed URL to preview how it appears in different reader templates"
        />
      </div>

      {loading && <LoadingState message="Loading feed preview..." />}

      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => {
            const input = document.querySelector('input[type="url"]') as HTMLInputElement;
            if (input?.value) handleSubmit(input.value);
          }}
        />
      )}

      {previewData && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Feed Information</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Type: {previewData.feedType.toUpperCase()} | Items: {previewData.items.length}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Template Selector</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Choose a template to preview your feed</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Tabs value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1 sm:gap-2">
                  <TabsTrigger value="google" className="text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto">Google Reader</TabsTrigger>
                  <TabsTrigger value="apple" className="text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto">Apple News</TabsTrigger>
                  <TabsTrigger value="minimalist" className="text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto">Minimalist</TabsTrigger>
                  <TabsTrigger value="classic" className="text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto">Classic RSS</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <div className="border rounded-lg p-3 sm:p-4 md:p-6 bg-background overflow-x-auto">
            {renderTemplate}
          </div>
        </div>
      )}
    </div>
  );
}
