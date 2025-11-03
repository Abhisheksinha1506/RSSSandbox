import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export function LoadingState({ 
  message = 'Loading...', 
  progress,
  showProgress = false 
}: LoadingStateProps) {
  return (
    <Card className="py-12 sm:py-16 border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
        <div className="relative">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-spin" />
          <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm sm:text-base font-medium text-foreground">{message}</p>
          {showProgress && progress !== undefined && (
            <div className="w-48 sm:w-64 max-w-full mx-auto">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
