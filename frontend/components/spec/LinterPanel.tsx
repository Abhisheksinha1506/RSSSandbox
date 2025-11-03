'use client';

import { useState } from 'react';
import { FeedInput } from '@/components/common/FeedInput';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { SuccessState } from '@/components/common/SuccessState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { LinterResult } from '@shared/types/linter';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface LinterPanelProps {
  onFeedValidated?: (valid: boolean) => void;
}

export function LinterPanel({ onFeedValidated }: LinterPanelProps) {
  const [result, setResult] = useState<LinterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const validationResult = await api.validateFeed(url);
      
      if (validationResult.error) {
        setError(validationResult.error);
        setLoading(false);
        return;
      }

      const linterResult: LinterResult = {
        valid: validationResult.valid || false,
        issues: (validationResult.issues || []) as LinterResult['issues'],
        feedType: validationResult.feedType as 'rss' | 'atom' | 'json' | undefined,
      };

      setResult(linterResult);
      onFeedValidated?.(linterResult.valid);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate feed');
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <FeedInput onSubmit={handleSubmit} isLoading={loading} />
      
      {loading && <LoadingState message="Validating feed..." />}
      
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={() => {
            // Retry with last entered URL if available
            const input = document.querySelector('input[type="url"]') as HTMLInputElement;
            if (input?.value) handleSubmit(input.value);
          }}
        />
      )}
      
      {result && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base sm:text-lg md:text-xl">Validation Results</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {result.valid ? (
                  <Badge variant="default" className="bg-green-500 text-xs sm:text-sm">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs sm:text-sm">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Invalid
                  </Badge>
                )}
                {result.feedType && (
                  <Badge variant="outline" className="text-xs sm:text-sm">{result.feedType.toUpperCase()}</Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Found {result.issues.length} issue{result.issues.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {result.issues.length === 0 ? (
              <SuccessState 
                message="No issues found! Your feed is valid."
                description="All required and recommended fields are present and properly formatted."
              />
            ) : (
              <div className="space-y-3">
                {result.issues.map((issue: { severity: string; message: string; field?: string; suggestion?: string }, index: number) => (
                  <div
                    key={index}
                    className="flex gap-2 sm:gap-3 p-3 rounded-lg border"
                  >
                    <div className="mt-0.5 flex-shrink-0">{getSeverityIcon(issue.severity)}</div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <p className="font-medium text-sm sm:text-base break-words">{issue.message}</p>
                        <Badge variant={getSeverityColor(issue.severity) as any} className="text-xs sm:text-sm shrink-0">
                          {issue.severity}
                        </Badge>
                      </div>
                      {issue.field && (
                        <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                          Field: {issue.field}
                        </p>
                      )}
                      {issue.suggestion && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          💡 {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
