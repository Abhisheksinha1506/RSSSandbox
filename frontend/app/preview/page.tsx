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

      <div className="mb-4 sm:mb-6">
        <FeedInput 
          onSubmit={handleSubmit} 
          isLoading={loading}
          description="Preview how your feed appears in different reader templates"
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
