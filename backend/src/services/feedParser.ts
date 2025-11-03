import Parser from 'rss-parser';
import { XMLParser } from 'fast-xml-parser';
import type { ParsedFeed, FeedParseResult, FeedItem, FeedMetadata } from '../../../shared/types/feed';

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'content'],
      ['media:thumbnail', 'thumbnail'],
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure']
    ]
  }
});

export class FeedParserService {
  async parseFeed(url: string): Promise<FeedParseResult> {
    try {
      // Try RSS/Atom first with rss-parser
      const feed = await parser.parseURL(url);
      
      // Determine feed type
      let feedType: 'rss' | 'atom' | 'json' = 'rss';
      if (feed.feedUrl?.includes('atom')) {
        feedType = 'atom';
      }

      // Normalize to common structure
      const normalizedFeed: ParsedFeed = {
        type: feedType,
        metadata: this.normalizeMetadata(feed),
        items: feed.items.map(item => this.normalizeItem(item)),
        raw: feed as unknown as string
      };

      return {
        success: true,
        feed: normalizedFeed
      };
    } catch (error) {
      // Try JSON Feed format
      try {
        const response = await fetch(url);
        const jsonData = await response.json() as any;
        
        if (jsonData.version && jsonData.version.startsWith('https://jsonfeed.org')) {
          const normalizedFeed: ParsedFeed = {
            type: 'json',
            metadata: {
              title: jsonData.title || '',
              description: jsonData.description,
              link: jsonData.home_page_url || '',
              language: jsonData.language,
              image: jsonData.icon ? {
                url: jsonData.icon,
                title: jsonData.title || '',
                link: jsonData.home_page_url || ''
              } : undefined
            },
            items: (jsonData.items || []).map((item: any) => this.normalizeJsonFeedItem(item)),
            raw: JSON.stringify(jsonData)
          };

          return {
            success: true,
            feed: normalizedFeed
          };
        }
      } catch (jsonError) {
        // Ignore JSON feed errors, fall through to main error
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse feed'
      };
    }
  }

  private normalizeMetadata(feed: any): FeedMetadata {
    return {
      title: feed.title || '',
      description: feed.description,
      link: feed.link || feed.feedUrl || '',
      language: feed.language,
      copyright: feed.copyright,
      managingEditor: feed.managingEditor,
      webMaster: feed.webMaster,
      pubDate: feed.pubDate ? new Date(feed.pubDate) : undefined,
      lastBuildDate: feed.lastBuildDate ? new Date(feed.lastBuildDate) : undefined,
      image: feed.image ? {
        url: feed.image.url || feed.image,
        title: feed.image.title || feed.title || '',
        link: feed.image.link || feed.link || '',
        width: feed.image.width,
        height: feed.image.height
      } : undefined
    };
  }

  private normalizeItem(item: any): FeedItem {
    return {
      title: item.title || '',
      link: item.link || '',
      description: item.contentSnippet || item.description,
      content: item.content || item['content:encoded'],
      pubDate: item.pubDate ? new Date(item.pubDate) : undefined,
      guid: item.guid || item.id || item.link,
      author: item.author || item.creator,
      categories: item.categories || [],
      image: item.thumbnail?.url || item['media:thumbnail']?.['@']?.url || this.extractImageFromContent(item.content || item.description),
      enclosure: item.enclosure ? {
        url: item.enclosure.url,
        type: item.enclosure.type,
        length: item.enclosure.length
      } : undefined
    };
  }

  private normalizeJsonFeedItem(item: any): FeedItem {
    return {
      title: item.title || '',
      link: item.url || item.external_url || '',
      description: item.summary,
      content: item.content_html || item.content_text,
      pubDate: item.date_published ? new Date(item.date_published) : undefined,
      guid: item.id || item.url,
      author: item.authors?.[0]?.name,
      categories: item.tags || [],
      image: item.image || item.banner_image,
      enclosure: item.attachments?.[0] ? {
        url: item.attachments[0].url,
        type: item.attachments[0].mime_type,
        length: item.attachments[0].size_in_bytes
      } : undefined
    };
  }

  private extractImageFromContent(content?: string): string | undefined {
    if (!content) return undefined;
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : undefined;
  }
}

export const feedParserService = new FeedParserService();
