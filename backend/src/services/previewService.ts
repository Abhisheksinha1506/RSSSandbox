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

export interface PreviewResult {
  success: boolean;
  data?: PreviewData;
  error?: string;
}

export class PreviewService {
  async getPreviewData(url: string): Promise<PreviewResult> {
    try {
      const result = await feedParserService.parseFeed(url);
      
      if (!result.success || !result.feed) {
        return {
          success: false,
          error: result.error || 'Failed to parse feed for preview'
        };
      }

      const feed = result.feed;

      // Handle empty feeds gracefully
      if (!feed.items || feed.items.length === 0) {
        return {
          success: true,
          data: {
            metadata: {
              title: feed.metadata?.title || '',
              description: feed.metadata?.description,
              link: feed.metadata?.link || '',
              image: feed.metadata?.image?.url,
              language: feed.metadata?.language,
            },
            items: [],
            feedType: feed.type,
          }
        };
      }

      return {
        success: true,
        data: {
          metadata: {
            title: feed.metadata?.title || '',
            description: feed.metadata?.description,
            link: feed.metadata?.link || '',
            image: feed.metadata?.image?.url,
            language: feed.metadata?.language,
          },
          items: feed.items.map(item => ({
            title: item.title || '',
            link: item.link || '',
            description: item.description,
            content: item.content,
            pubDate: item.pubDate,
            author: item.author,
            image: item.image,
            categories: item.categories || [],
          })),
          feedType: feed.type,
        }
      };
    } catch (error) {
      console.error('Preview service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred while generating preview'
      };
    }
  }
}

export const previewService = new PreviewService();
