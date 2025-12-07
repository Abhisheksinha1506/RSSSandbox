'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardDescription } from '@/components/ui/card';
import { Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  label?: string;
  description?: string;
  exampleUrls?: string[];
}

// More reliable example feeds that are publicly accessible
const DEFAULT_EXAMPLES = [
  'https://feeds.feedburner.com/oreilly/radar', // O'Reilly Radar - reliable tech feed
  'https://www.nasa.gov/rss/dyn/breaking_news.rss', // NASA Breaking News
  'https://rss.cnn.com/rss/edition.rss', // CNN RSS
  'https://feeds.npr.org/1001/rss.xml', // NPR News
];

export function FeedInput({ 
  onSubmit, 
  isLoading = false, 
  placeholder = 'https://example.com/feed.xml', 
  label = 'Feed URL',
  description,
  exampleUrls = DEFAULT_EXAMPLES
}: FeedInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const validateUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      setError('Please enter a feed URL');
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    onSubmit(trimmedUrl);
  }, [url, onSubmit]);

  const handleExampleClick = useCallback((exampleUrl: string) => {
    setUrl(exampleUrl);
    setError(null);
    setSelectedExample(exampleUrl);
    setShowExamples(false);
    
    // Clear any existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    // Auto-submit the example URL after a brief delay to show visual feedback
    submitTimeoutRef.current = setTimeout(() => {
      onSubmit(exampleUrl);
      submitTimeoutRef.current = null;
    }, 100);
  }, [onSubmit]);

  return (
    <Card className="border-2 shadow-md p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="feed-url" className="text-sm sm:text-base font-semibold">
              {label}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="text-xs sm:text-sm h-7 sm:h-8 px-2"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Examples
            </Button>
          </div>
          
          {description && (
            <CardDescription className="text-xs sm:text-sm flex items-start gap-2">
              <Info className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span>{description}</span>
            </CardDescription>
          )}

          {showExamples && (
            <div className="p-3 rounded-lg bg-muted/50 border border-dashed space-y-2 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-medium text-muted-foreground">
                Click an example to load it automatically:
              </p>
              <div className="flex flex-wrap gap-2">
                {exampleUrls.map((exampleUrl, index) => {
                  const domain = exampleUrl.replace(/^https?:\/\//, '').split('/')[0];
                  const isSelected = selectedExample === exampleUrl;
                  const isProcessing = isLoading && isSelected;
                  
                  return (
                    <Button
                      key={index}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleExampleClick(exampleUrl)}
                      disabled={isLoading}
                      className={cn(
                        "text-xs h-7 sm:h-8 transition-all",
                        isSelected && "ring-2 ring-primary ring-offset-2",
                        isProcessing && "opacity-75"
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <span className="animate-spin mr-1">⏳</span>
                          Loading...
                        </>
                      ) : (
                        domain
                      )}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground/70 italic">
                Examples are automatically submitted when clicked
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 space-y-1">
              <Input
                id="feed-url"
                type="url"
                placeholder={placeholder}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                  // Clear selected example when user types
                  if (selectedExample && e.target.value !== selectedExample) {
                    setSelectedExample(null);
                  }
                }}
                disabled={isLoading}
                className={cn(
                  "text-sm sm:text-base h-10 sm:h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all",
                  error && "border-destructive focus:border-destructive focus:ring-destructive/20"
                )}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'url-error' : undefined}
              />
              {error && (
                <p id="url-error" className="text-xs text-destructive flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !url.trim()} 
              className="w-full sm:w-auto h-10 sm:h-11 font-semibold shadow-sm hover:shadow-md transition-all min-w-[100px] sm:min-w-[120px] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
