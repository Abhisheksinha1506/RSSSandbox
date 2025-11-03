import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ExternalLink } from 'lucide-react';

interface GoogleReaderTemplateProps {
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

export function GoogleReaderTemplate({ metadata, items }: GoogleReaderTemplateProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-b pb-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">{metadata.title}</h2>
        {metadata.description && (
          <p className="text-sm sm:text-base text-muted-foreground">{metadata.description}</p>
        )}
        {metadata.link && (
          <a
            href={metadata.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2 break-all"
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{metadata.link}</span>
          </a>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6">
        {items.map((item, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="mb-2 text-lg sm:text-xl">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors break-words"
                    >
                      {item.title}
                    </a>
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    {item.pubDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        {formatDate(item.pubDate)}
                      </div>
                    )}
                    {item.author && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{item.author}</span>
                      </div>
                    )}
                  </div>
                </div>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-md sm:flex-shrink-0"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {item.description && (
                <CardDescription className="mb-3">
                  {item.description}
                </CardDescription>
              )}
              {item.content && (
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}
              {item.categories && item.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {item.categories.map((category, catIndex) => (
                    <Badge key={catIndex} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Read more
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
