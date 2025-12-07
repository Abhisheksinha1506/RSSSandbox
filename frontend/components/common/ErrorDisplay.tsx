import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ExternalLink, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  suggestions?: string[];
}

interface ParsedError {
  type: 'http' | 'network' | 'cors' | 'parse' | 'ssl' | 'rate-limit' | 'unknown';
  httpCode?: number;
  suggestions: string[];
  troubleshooting: string[];
}

export function ErrorDisplay({ 
  error, 
  title = 'Error', 
  onRetry,
  suggestions = []
}: ErrorDisplayProps) {
  // Parse error message to extract detailed information
  const parseError = (errorMsg: string): ParsedError => {
    const msg = errorMsg.toLowerCase();
    const result: ParsedError = {
      type: 'unknown',
      suggestions: [],
      troubleshooting: []
    };

    // Extract HTTP status code
    const httpMatch = errorMsg.match(/http\s+(\d{3})/i) || errorMsg.match(/(\d{3}):/);
    if (httpMatch) {
      result.httpCode = parseInt(httpMatch[1], 10);
      result.type = 'http';
    }

    // HTTP Errors
    if (msg.includes('404') || msg.includes('not found')) {
      result.type = 'http';
      result.httpCode = 404;
      result.suggestions = [
        'Verify the feed URL is correct and complete',
        'Check if the feed has been moved or deleted',
        'Try opening the URL directly in your browser to confirm it exists',
        'Ensure the URL includes the protocol (http:// or https://)'
      ];
      result.troubleshooting = [
        'Copy the exact URL from your feed source',
        'Remove any trailing slashes or extra characters',
        'Check if the feed requires authentication'
      ];
    } else if (msg.includes('403') || msg.includes('forbidden')) {
      result.type = 'http';
      result.httpCode = 403;
      result.suggestions = [
        'The feed server is blocking access to this URL',
        'This may be due to server configuration or access restrictions',
        'The feed might require authentication or special permissions'
      ];
      result.troubleshooting = [
        'Contact the feed publisher for access credentials',
        'Check if the feed requires a specific user agent',
        'Verify if your IP address is blocked'
      ];
    } else if (msg.includes('401') || msg.includes('unauthorized')) {
      result.type = 'http';
      result.httpCode = 401;
      result.suggestions = [
        'This feed requires authentication to access',
        'You may need login credentials or an API key'
      ];
      result.troubleshooting = [
        'Contact the feed publisher for access credentials',
        'Check if the feed URL includes authentication tokens'
      ];
    } else if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('server error')) {
      result.type = 'http';
      result.suggestions = [
        'The feed server is experiencing technical difficulties',
        'This is a temporary server-side issue, not a problem with your request'
      ];
      result.troubleshooting = [
        'Wait a few minutes and try again',
        'Check the feed publisher\'s status page or social media for updates',
        'Try again later when the server may have recovered'
      ];
    } 
    // Network Errors
    else if (msg.includes('network') || msg.includes('connection') || msg.includes('timeout') || 
             msg.includes('enotfound') || msg.includes('econnrefused') || msg.includes('dns') ||
             msg.includes('getaddrinfo') || msg.includes('unable to connect')) {
      result.type = 'network';
      result.suggestions = [
        'Check your internet connection',
        'Verify the feed server is online and accessible',
        'The feed server may be temporarily unavailable'
      ];
      result.troubleshooting = [
        'Try accessing other websites to confirm your internet connection works',
        'Try opening the feed URL directly in your browser',
        'Check if you\'re behind a firewall or proxy that might be blocking the request',
        'Wait a few moments and try again'
      ];
    }
    // CORS Errors
    else if (msg.includes('cors') || msg.includes('cross-origin') || msg.includes('access-control')) {
      result.type = 'cors';
      result.suggestions = [
        'The feed server doesn\'t allow cross-origin requests',
        'This is a server-side configuration issue, not a problem with your request'
      ];
      result.troubleshooting = [
        'Try accessing the feed URL directly in your browser',
        'Contact the feed publisher to enable CORS headers',
        'Use a browser extension or proxy service that can bypass CORS restrictions',
        'Consider using the feed in a different application that handles CORS differently'
      ];
    }
    // SSL/TLS Errors
    else if (msg.includes('ssl') || msg.includes('tls') || msg.includes('certificate') || msg.includes('unable to verify')) {
      result.type = 'ssl';
      result.suggestions = [
        'There\'s a problem with the security certificate for this feed',
        'The connection cannot be verified as secure'
      ];
      result.troubleshooting = [
        'Check if the feed URL uses https:// (secure connection)',
        'The server\'s SSL certificate may be expired or invalid',
        'Contact the feed publisher about the certificate issue',
        'If this is your own feed, check your SSL certificate configuration'
      ];
    }
    // Rate Limiting
    else if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('429')) {
      result.type = 'rate-limit';
      result.suggestions = [
        'Too many requests have been made to this feed',
        'The server is temporarily limiting access'
      ];
      result.troubleshooting = [
        'Wait a few minutes before trying again',
        'Reduce the frequency of your requests',
        'Contact the feed publisher if you need higher rate limits'
      ];
    }
    // Parse Errors
    else if (msg.includes('parse') || msg.includes('invalid feed') || msg.includes('malformed') || 
             msg.includes('xml') || msg.includes('syntax') || msg.includes('not well-formed')) {
      result.type = 'parse';
      result.suggestions = [
        'The feed XML/JSON structure is malformed or invalid',
        'The feed doesn\'t conform to RSS, Atom, or JSON Feed specifications'
      ];
      result.troubleshooting = [
        'Use the RSS Spec & Linter tool to validate your feed structure',
        'Check the feed source for formatting errors',
        'Ensure all required XML/JSON elements are properly closed',
        'Verify the feed encoding (should be UTF-8)',
        'Check for special characters that might need escaping'
      ];
    }
    // Generic/Unknown Errors
    else {
      result.suggestions = [
        'This could be due to an invalid feed format, network issues, or server problems',
        'The feed URL might be incorrect or the feed might not be publicly accessible'
      ];
      result.troubleshooting = [
        'Try validating the feed URL in your browser first',
        'Use the RSS Spec & Linter tool to check the feed structure',
        'Verify the feed URL is correct and complete',
        'Check if the feed requires authentication or special headers',
        'Try a different feed URL to see if the problem persists'
      ];
    }

    return result;
  };

  const parsedError = parseError(error);
  const errorSuggestions = suggestions.length > 0 ? suggestions : parsedError.suggestions;

  // Extract URL from error message if present
  const urlMatch = error.match(/https?:\/\/[^\s"']+/i);
  const feedUrl = urlMatch ? urlMatch[0] : null;

  return (
    <Alert className="border-destructive/50 bg-destructive/5">
      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
      <AlertTitle className="text-base sm:text-lg font-semibold mb-2">{title}</AlertTitle>
      <AlertDescription className="space-y-4">
        <div>
          <p className="text-sm sm:text-base text-foreground font-medium mb-1">What went wrong:</p>
          <p className="text-sm sm:text-base text-foreground">{error}</p>
        </div>
        
        {parsedError.httpCode && (
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-muted text-xs font-mono">
            HTTP {parsedError.httpCode}
          </div>
        )}

        {feedUrl && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs h-7"
            >
              <a 
                href={feedUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open feed URL in browser
              </a>
            </Button>
          </div>
        )}
        
        {errorSuggestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-destructive/20">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">What to do next:</p>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground ml-6">
              {errorSuggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {parsedError.troubleshooting.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-destructive/20">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Troubleshooting steps:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground ml-6">
              {parsedError.troubleshooting.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}
        
        {onRetry && (
          <div className="pt-2 border-t border-destructive/20">
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
