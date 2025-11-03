import { Card, CardContent } from '@/components/ui/card';
import { FileText, Info } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ 
  title = 'No data yet',
  description = 'Enter a feed URL to get started',
  icon,
  action
}: EmptyStateProps) {
  const Icon = icon || <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />;

  return (
    <Card className="border-dashed border-2 py-8 sm:py-12">
      <CardContent className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
        <div className="text-muted-foreground">{Icon}</div>
        <div className="space-y-1">
          <p className="text-sm sm:text-base font-semibold text-foreground">{title}</p>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">{description}</p>
          )}
        </div>
        {action && <div className="pt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}

