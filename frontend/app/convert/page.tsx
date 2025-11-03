'use client';

import { useState } from 'react';
import { FeedInput } from '@/components/common/FeedInput';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ConvertResult {
  success: boolean;
  convertedFeed?: string;
  originalType?: 'rss' | 'atom' | 'json';
  targetType?: 'rss' | 'atom' | 'json';
  error?: string;
}

export default function ConvertPage() {
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTargetType, setSelectedTargetType] = useState<'rss' | 'atom' | 'json'>('rss');

  const handleSubmit = async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.convertFeed(url, selectedTargetType);
      
      if (!response.success) {
        setError(response.error || 'Failed to convert feed');
        setLoading(false);
        return;
      }

      setResult({
        success: response.success,
        convertedFeed: response.convertedFeed,
        originalType: response.originalType as 'rss' | 'atom' | 'json' | undefined,
        targetType: response.targetType as 'rss' | 'atom' | 'json' | undefined,
        error: response.error,
      });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert feed');
      setLoading(false);
    }
  };

  const downloadFeed = (content: string, filename: string) => {
    const blob = new Blob([content], { 
      type: selectedTargetType === 'json' ? 'application/json' : 'application/xml' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilename = () => {
    const extension = selectedTargetType === 'json' ? 'json' : 
                     selectedTargetType === 'atom' ? 'xml' : 'xml';
    return `feed.${extension}`;
  };

  return (
    <div className="container py-8 sm:py-12 px-4 sm:px-6 max-w-7xl">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Feed Format Converter
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Convert feeds between RSS 2.0, Atom, and JSON Feed formats.
        </p>
      </div>

      <div className="mb-4 sm:mb-6">
        <FeedInput onSubmit={handleSubmit} isLoading={loading} />
      </div>

      <div className="mb-4 sm:mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Target Format</CardTitle>
            <CardDescription className="text-sm">
              Select the format you want to convert to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTargetType} onValueChange={(value) => setSelectedTargetType(value as 'rss' | 'atom' | 'json')}>
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="rss" className="text-xs sm:text-sm px-2 sm:px-3 py-2">RSS 2.0</TabsTrigger>
                <TabsTrigger value="atom" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Atom</TabsTrigger>
                <TabsTrigger value="json" className="text-xs sm:text-sm px-2 sm:px-3 py-2">JSON Feed</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {loading && <LoadingState message="Converting feed..." />}

      {error && <ErrorDisplay error={error} />}

      {result && result.success && (
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg sm:text-xl">Conversion Result</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {result.originalType && (
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      From: {result.originalType.toUpperCase()}
                    </Badge>
                  )}
                  {result.targetType && (
                    <Badge className="bg-green-500 text-xs sm:text-sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      To: {result.targetType.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => result.convertedFeed && downloadFeed(result.convertedFeed, getFilename())}
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Converted Feed
                </Button>
              </div>

              <div className="mt-4">
                <h3 className="text-sm sm:text-base font-semibold mb-2">Converted Feed Preview:</h3>
                <div className="border rounded-lg p-3 sm:p-4 bg-muted overflow-auto max-h-96">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {result.convertedFeed}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

