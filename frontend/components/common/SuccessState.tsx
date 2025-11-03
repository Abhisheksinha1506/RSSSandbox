import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface SuccessStateProps {
  message: string;
  description?: string;
}

export function SuccessState({ message, description }: SuccessStateProps) {
  return (
    <Card className="py-8 sm:py-12 border-2 border-green-500/20 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/10">
      <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
        <div className="relative">
          <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
          <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 sm:h-12 sm:w-12 border-2 border-green-500/20"></div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm sm:text-base font-semibold text-foreground">{message}</p>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

