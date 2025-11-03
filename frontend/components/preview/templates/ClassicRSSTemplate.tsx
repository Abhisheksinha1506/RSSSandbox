import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ClassicRSSTemplateProps {
  metadata: {
    title: string;
    description?: string;
    link: string;
    image?: string;
  };
  items: Array<{
    title: string;
    link: string;
    description?: string;
    content?: string;
    pubDate?: Date;
    author?: string;
    image?: string;
    categories?: string[];
  }>;
}

export function ClassicRSSTemplate({ metadata, items }: ClassicRSSTemplateProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold mb-2">{metadata.title}</h2>
        {metadata.description && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">{metadata.description}</p>
        )}
        {metadata.link && (
          <a
            href={metadata.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-primary hover:underline break-all"
          >
            {metadata.link}
          </a>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <Card key={index} className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors break-words"
                >
                  {item.title}
                </a>
              </CardTitle>
              <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:space-x-3 gap-1 sm:gap-0">
                {item.pubDate && <span>{formatDate(item.pubDate)}</span>}
                {item.author && <span>by <span className="truncate">{item.author}</span></span>}
              </div>
            </CardHeader>
            <CardContent>
              {item.description && (
                <CardDescription className="mb-2">
                  {item.description}
                </CardDescription>
              )}
              {item.content && (
                <div
                  className="prose prose-sm max-w-none text-muted-foreground mb-2"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}
              {item.categories && item.categories.length > 0 && (
                <div className="text-xs text-muted-foreground mb-2">
                  Categories: {item.categories.join(', ')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
