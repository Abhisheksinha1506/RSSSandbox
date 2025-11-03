import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  suggestions?: string[];
}

export function ErrorDisplay({ 
  error, 
  title = 'Error', 
  onRetry,
  suggestions = []
}: ErrorDisplayProps) {
  // Extract suggestions from common error patterns
  const getSuggestions = (errorMsg: string): string[] => {
    const suggestions: string[] = [];
    
    if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
      suggestions.push('Check if the feed URL is correct');
      suggestions.push('Verify the feed is publicly accessible');
    } else if (errorMsg.includes('timeout') || errorMsg.includes('Network')) {
      suggestions.push('Check your internet connection');
      suggestions.push('The feed server might be slow or unavailable');
    } else if (errorMsg.includes('Invalid URL')) {
      suggestions.push('Ensure the URL starts with http:// or https://');
      suggestions.push('Verify the URL format is correct');
    } else if (errorMsg.includes('parse') || errorMsg.includes('XML')) {
      suggestions.push('The feed might be malformed');
      suggestions.push('Try validating the feed structure');
    } else if (errorMsg.includes('CORS') || errorMsg.includes('Access-Control')) {
      suggestions.push('The feed server might not allow cross-origin requests');
      suggestions.push('Try accessing the feed directly in your browser');
    }
    
    return suggestions;
  };

  const errorSuggestions = suggestions.length > 0 ? suggestions : getSuggestions(error);

  return (
    <Alert className="border-destructive/50 bg-destructive/5">
      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
      <AlertTitle className="text-base sm:text-lg font-semibold mb-2">{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm sm:text-base text-foreground">{error}</p>
        
        {errorSuggestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-destructive/20">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Suggestions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
              {errorSuggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
        
        {onRetry && (
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
