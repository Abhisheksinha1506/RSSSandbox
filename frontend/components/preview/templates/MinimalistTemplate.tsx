interface MinimalistTemplateProps {
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

export function MinimalistTemplate({ metadata, items }: MinimalistTemplateProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 py-6 sm:py-8 px-4">
      <header className="border-b pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-light mb-2">{metadata.title}</h1>
        {metadata.description && (
          <p className="text-sm sm:text-base text-muted-foreground font-light">{metadata.description}</p>
        )}
      </header>

      <div className="space-y-8 sm:space-y-12">
        {items.map((item, index) => (
          <article key={index} className="border-b pb-8 last:border-0">
            <div className="mb-2">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-normal hover:text-primary transition-colors"
              >
                {item.title}
              </a>
            </div>
            <div className="text-sm text-muted-foreground mb-4 space-x-4">
              {item.pubDate && <span>{formatDate(item.pubDate)}</span>}
              {item.author && <span>{item.author}</span>}
            </div>
            {item.description && (
              <p className="text-muted-foreground leading-relaxed mb-4">
                {item.description}
              </p>
            )}
            {item.content && (
              <div
                className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            )}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-4 inline-block"
              >
                Read full article →
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
