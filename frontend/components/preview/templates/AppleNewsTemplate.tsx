import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User } from 'lucide-react';

interface AppleNewsTemplateProps {
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

export function AppleNewsTemplate({ metadata, items }: AppleNewsTemplateProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center py-6 sm:py-8 border-b">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 px-4">{metadata.title}</h1>
        {metadata.description && (
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            {metadata.description}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:gap-8">
        {items.map((item, index) => (
          <article key={index} className="group">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              {item.image && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                  {item.pubDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.pubDate)}
                    </div>
                  )}
                  {item.author && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.author}
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl mb-3">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {item.title}
                  </a>
                </CardTitle>
                {item.description && (
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
                )}
              </CardHeader>
              {item.content && (
                <CardContent>
                  <div
                    className="prose prose-lg max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </CardContent>
              )}
            </Card>
          </article>
        ))}
      </div>
    </div>
  );
}
