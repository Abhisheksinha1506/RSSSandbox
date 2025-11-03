import { feedParserService } from './feedParser';
import type { ParsedFeed } from '../../../shared/types/feed';

export interface PreviewData {
  metadata: {
    title: string;
    description?: string;
    link: string;
    image?: string;
    language?: string;
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
  feedType: 'rss' | 'atom' | 'json';
}

export class PreviewService {
  async getPreviewData(url: string): Promise<PreviewData | null> {
    try {
      const result = await feedParserService.parseFeed(url);
      
      if (!result.success || !result.feed) {
        return null;
      }

      const feed = result.feed;

      return {
        metadata: {
          title: feed.metadata.title || '',
          description: feed.metadata.description,
          link: feed.metadata.link || '',
          image: feed.metadata.image?.url,
          language: feed.metadata.language,
        },
        items: feed.items.map(item => ({
          title: item.title || '',
          link: item.link || '',
          description: item.description,
          content: item.content,
          pubDate: item.pubDate,
          author: item.author,
          image: item.image,
          categories: item.categories,
        })),
        feedType: feed.type,
      };
    } catch (error) {
      console.error('Preview service error:', error);
      return null;
    }
  }
}

export const previewService = new PreviewService();
