import { feedParserService } from './feedParser';
import type { ParsedFeed } from '../../../shared/types/feed';

export interface FeedStatistics {
  feedUrl: string;
  feedType: 'rss' | 'atom' | 'json';
  metadata: {
    hasTitle: boolean;
    hasDescription: boolean;
    hasImage: boolean;
    hasLanguage: boolean;
    hasCopyright: boolean;
    hasDates: boolean;
  };
  items: {
    total: number;
    withTitle: number;
    withDescription: number;
    withContent: number;
    withImages: number;
    withEnclosures: number;
    withAuthors: number;
    withCategories: number;
    withDates: number;
    averageTitleLength: number;
    averageDescriptionLength: number;
    averageContentLength: number;
  };
  content: {
    totalImages: number;
    totalEnclosures: number;
    totalCategories: number;
    uniqueCategories: number;
    uniqueAuthors: number;
    averageItemsPerDay?: number;
    updateFrequency?: 'high' | 'medium' | 'low' | 'unknown';
  };
  dates: {
    oldestItem?: Date;
    newestItem?: Date;
    dateRange?: number; // days
    itemsWithDates: number;
    itemsWithoutDates: number;
  };
  quality: {
    completenessScore: number; // 0-100
    recommendations: string[];
  };
}

export class FeedStatisticsService {
  async getFeedStatistics(url: string): Promise<FeedStatistics> {
    try {
      const parseResult = await feedParserService.parseFeed(url);
      
      if (!parseResult.success || !parseResult.feed) {
        throw new Error(parseResult.error || 'Failed to parse feed');
      }

      const feed = parseResult.feed;
      const stats = this.calculateStatistics(feed, url);

      return stats;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to get feed statistics');
    }
  }

  private calculateStatistics(feed: ParsedFeed, feedUrl: string): FeedStatistics {
    const items = feed.items;
    const recommendations: string[] = [];

    // Metadata statistics
    const metadata = {
      hasTitle: !!feed.metadata.title,
      hasDescription: !!feed.metadata.description,
      hasImage: !!feed.metadata.image,
      hasLanguage: !!feed.metadata.language,
      hasCopyright: !!feed.metadata.copyright,
      hasDates: !!(feed.metadata.pubDate || feed.metadata.lastBuildDate),
    };

    // Item statistics - single pass optimization
    let totalTitleLength = 0;
    let totalDescriptionLength = 0;
    let totalContentLength = 0;
    const dates: Date[] = [];
    const categories = new Set<string>();
    const authors = new Set<string>();

    // Counters for single-pass statistics
    let withTitle = 0;
    let withDescription = 0;
    let withContent = 0;
    let withImages = 0;
    let withEnclosures = 0;
    let withAuthors = 0;
    let withCategories = 0;
    let withDates = 0;
    let totalImages = 0;
    let totalEnclosures = 0;

    items.forEach(item => {
      if (item.title) {
        withTitle++;
        totalTitleLength += item.title.length;
      }
      if (item.description) {
        withDescription++;
        totalDescriptionLength += item.description.length;
      }
      if (item.content) {
        withContent++;
        totalContentLength += item.content.length;
      }
      if (item.image) {
        withImages++;
        totalImages++;
      }
      if (item.enclosure) {
        withEnclosures++;
        totalEnclosures++;
      }
      if (item.author) {
        withAuthors++;
        authors.add(item.author);
      }
      if (item.categories && item.categories.length > 0) {
        withCategories++;
        item.categories.forEach(cat => categories.add(cat));
      }
      if (item.pubDate) {
        withDates++;
        dates.push(item.pubDate);
      }
    });

    const itemsStats = {
      total: items.length,
      withTitle,
      withDescription,
      withContent,
      withImages,
      withEnclosures,
      withAuthors,
      withCategories,
      withDates,
      averageTitleLength: withTitle > 0 
        ? Math.round(totalTitleLength / withTitle) 
        : 0,
      averageDescriptionLength: withDescription > 0
        ? Math.round(totalDescriptionLength / withDescription)
        : 0,
      averageContentLength: withContent > 0
        ? Math.round(totalContentLength / withContent)
        : 0,
    };

    // Content statistics
    const totalCategories = items.reduce((sum, item) => sum + (item.categories?.length || 0), 0);
    const uniqueCategories = categories.size;
    const uniqueAuthors = authors.size;

    // Date statistics
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const oldestItem = sortedDates.length > 0 ? sortedDates[0] : undefined;
    const newestItem = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : undefined;
    const dateRange = oldestItem && newestItem 
      ? Math.ceil((newestItem.getTime() - oldestItem.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Calculate average items per day
    let averageItemsPerDay: number | undefined;
    let updateFrequency: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
    if (dateRange && dateRange > 0 && items.length > 0) {
      averageItemsPerDay = Math.round((items.length / dateRange) * 100) / 100;
      if (averageItemsPerDay >= 1) {
        updateFrequency = 'high';
      } else if (averageItemsPerDay >= 0.1) {
        updateFrequency = 'medium';
      } else {
        updateFrequency = 'low';
      }
    }

    // Quality score calculation (0-100)
    let completenessScore = 0;
    const maxScore = 100;

    // Metadata completeness (20 points)
    if (metadata.hasTitle) completenessScore += 5;
    if (metadata.hasDescription) completenessScore += 3;
    if (metadata.hasImage) completenessScore += 2;
    if (metadata.hasLanguage) completenessScore += 2;
    if (metadata.hasDates) completenessScore += 3;
    if (metadata.hasCopyright) completenessScore += 2;
    if (metadata.hasDescription && feed.metadata.description!.length > 50) completenessScore += 3;

    // Item completeness (80 points) - only calculate if items exist
    if (items.length > 0) {
      const scorePerItem = maxScore / items.length;
      items.forEach(item => {
        let itemScore = 0;
        if (item.title) itemScore += 10;
        if (item.link) itemScore += 10;
        if (item.description || item.content) itemScore += 15;
        if (item.pubDate) itemScore += 15;
        if (item.guid) itemScore += 10;
        if (item.author) itemScore += 5;
        if (item.categories && item.categories.length > 0) itemScore += 5;
        if (item.image) itemScore += 5;
        if (item.enclosure) itemScore += 5;
        completenessScore += (itemScore * scorePerItem) / 100;
      });
    } else {
      // If no items, only metadata score counts (max 20 points)
      completenessScore = Math.min(20, completenessScore);
    }

    completenessScore = Math.min(100, Math.round(completenessScore));

    // Generate recommendations
    if (completenessScore < 50) {
      recommendations.push('Feed quality is low. Consider adding missing metadata and item fields.');
    }
    if (!metadata.hasDescription) {
      recommendations.push('Add a feed description to help users understand your feed.');
    }
    if (itemsStats.withDates < itemsStats.total * 0.8) {
      recommendations.push(`Only ${itemsStats.withDates} of ${itemsStats.total} items have publication dates. Consider adding dates to all items.`);
    }
    if (itemsStats.withAuthors < itemsStats.total * 0.5) {
      recommendations.push(`Only ${itemsStats.withAuthors} of ${itemsStats.total} items have authors. Consider adding author information.`);
    }
    if (itemsStats.averageDescriptionLength < 100) {
      recommendations.push('Item descriptions are quite short. Consider adding more detailed descriptions.');
    }
    if (items.length === 0) {
      recommendations.push('Feed contains no items. A feed should have at least one item.');
    }
    if (items.length > 0 && items.length < 5) {
      recommendations.push('Feed has very few items. Consider adding more content.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Feed quality is excellent! All metadata and items are well-structured.');
    }

    return {
      feedUrl,
      feedType: feed.type,
      metadata,
      items: itemsStats,
      content: {
        totalImages,
        totalEnclosures,
        totalCategories,
        uniqueCategories,
        uniqueAuthors,
        averageItemsPerDay,
        updateFrequency,
      },
      dates: {
        oldestItem,
        newestItem,
        dateRange,
        itemsWithDates: itemsStats.withDates,
        itemsWithoutDates: itemsStats.total - itemsStats.withDates,
      },
      quality: {
        completenessScore,
        recommendations,
      },
    };
  }
}

export const feedStatisticsService = new FeedStatisticsService();

