import { feedParserService } from './feedParser';
import type { ParsedFeed } from '../../../shared/types/feed';

export interface FeedComparison {
  feed1Url: string;
  feed2Url: string;
  feed1: ParsedFeed;
  feed2: ParsedFeed;
  differences: {
    metadata: {
      title: { same: boolean; feed1?: string; feed2?: string };
      description: { same: boolean; feed1?: string; feed2?: string };
      link: { same: boolean; feed1?: string; feed2?: string };
      language: { same: boolean; feed1?: string; feed2?: string };
      image: { same: boolean; feed1?: string; feed2?: string };
    };
    items: {
      count: { same: boolean; feed1: number; feed2: number };
      commonItems: number;
      uniqueToFeed1: number;
      uniqueToFeed2: number;
      itemDifferences: Array<{
        guid: string;
        differences: string[];
      }>;
    };
    structure: {
      feed1Type: 'rss' | 'atom' | 'json';
      feed2Type: 'rss' | 'atom' | 'json';
      sameType: boolean;
    };
  };
  summary: {
    similarity: number; // 0-100
    recommendations: string[];
  };
}

export class FeedComparatorService {
  async compareFeeds(feed1Url: string, feed2Url: string): Promise<FeedComparison> {
    try {
      const [result1, result2] = await Promise.all([
        feedParserService.parseFeed(feed1Url),
        feedParserService.parseFeed(feed2Url)
      ]);

      if (!result1.success || !result1.feed) {
        throw new Error(`Failed to parse feed 1: ${result1.error}`);
      }

      if (!result2.success || !result2.feed) {
        throw new Error(`Failed to parse feed 2: ${result2.error}`);
      }

      const comparison = this.compareParsedFeeds(result1.feed, result2.feed, feed1Url, feed2Url);
      return comparison;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to compare feeds');
    }
  }

  private compareParsedFeeds(
    feed1: ParsedFeed,
    feed2: ParsedFeed,
    feed1Url: string,
    feed2Url: string
  ): FeedComparison {
    // Compare metadata
    const metadataDifferences = {
      title: {
        same: feed1.metadata.title === feed2.metadata.title,
        feed1: feed1.metadata.title,
        feed2: feed2.metadata.title,
      },
      description: {
        same: feed1.metadata.description === feed2.metadata.description,
        feed1: feed1.metadata.description,
        feed2: feed2.metadata.description,
      },
      link: {
        same: feed1.metadata.link === feed2.metadata.link,
        feed1: feed1.metadata.link,
        feed2: feed2.metadata.link,
      },
      language: {
        same: feed1.metadata.language === feed2.metadata.language,
        feed1: feed1.metadata.language,
        feed2: feed2.metadata.language,
      },
      image: {
        same: feed1.metadata.image?.url === feed2.metadata.image?.url,
        feed1: feed1.metadata.image?.url,
        feed2: feed2.metadata.image?.url,
      },
    };

    // Compare items - optimized with Map-based lookups (O(n) instead of O(n²))
    // Create Maps for O(1) item lookup by GUID/link
    const feed1ItemMap = new Map<string, typeof feed1.items[0]>();
    const feed2ItemMap = new Map<string, typeof feed2.items[0]>();
    
    feed1.items.forEach(item => {
      const guid = item.guid || item.link;
      if (guid) {
        feed1ItemMap.set(guid, item);
      }
    });
    
    feed2.items.forEach(item => {
      const guid = item.guid || item.link;
      if (guid) {
        feed2ItemMap.set(guid, item);
      }
    });

    const feed1ItemGuids = new Set(feed1ItemMap.keys());
    const feed2ItemGuids = new Set(feed2ItemMap.keys());

    // Find common items (by GUID or link)
    const commonGuids = new Set<string>();
    feed1ItemGuids.forEach(guid => {
      if (feed2ItemGuids.has(guid)) {
        commonGuids.add(guid);
      }
    });

    const uniqueToFeed1 = feed1.items.filter(item => {
      const guid = item.guid || item.link;
      return guid && !feed2ItemGuids.has(guid);
    });

    const uniqueToFeed2 = feed2.items.filter(item => {
      const guid = item.guid || item.link;
      return guid && !feed1ItemGuids.has(guid);
    });

    // Compare common items for differences - using Map lookups (O(1) instead of O(n))
    const itemDifferences: Array<{ guid: string; differences: string[] }> = [];
    
    commonGuids.forEach(guid => {
      const item1 = feed1ItemMap.get(guid);
      const item2 = feed2ItemMap.get(guid);
      
      if (item1 && item2) {
        const differences: string[] = [];
        
        if (item1.title !== item2.title) {
          differences.push('Title differs');
        }
        if (item1.link !== item2.link) {
          differences.push('Link differs');
        }
        if (item1.description !== item2.description) {
          differences.push('Description differs');
        }
        if (item1.content !== item2.content) {
          differences.push('Content differs');
        }
        if (item1.author !== item2.author) {
          differences.push('Author differs');
        }
        if (JSON.stringify(item1.categories) !== JSON.stringify(item2.categories)) {
          differences.push('Categories differ');
        }
        if (item1.pubDate?.getTime() !== item2.pubDate?.getTime()) {
          differences.push('Publication date differs');
        }
        
        if (differences.length > 0) {
          itemDifferences.push({ guid, differences });
        }
      }
    });

    // Calculate similarity score
    let similarityScore = 0;
    const maxScore = 100;
    
    // Metadata similarity (30 points)
    let metadataScore = 0;
    if (metadataDifferences.title.same) metadataScore += 5;
    if (metadataDifferences.description.same) metadataScore += 5;
    if (metadataDifferences.link.same) metadataScore += 5;
    if (metadataDifferences.language.same) metadataScore += 5;
    if (metadataDifferences.image.same) metadataScore += 5;
    if (feed1.type === feed2.type) metadataScore += 5;
    
    similarityScore += metadataScore;

    // Item count similarity (20 points)
    const itemCountDiff = Math.abs(feed1.items.length - feed2.items.length);
    const maxItemCount = Math.max(feed1.items.length, feed2.items.length);
    const itemCountSimilarity = maxItemCount > 0 
      ? Math.max(0, 20 * (1 - itemCountDiff / maxItemCount))
      : 20;
    similarityScore += itemCountSimilarity;

    // Common items similarity (50 points)
    const totalItems = Math.max(feed1.items.length, feed2.items.length);
    const commonItemsSimilarity = totalItems > 0 
      ? (50 * commonGuids.size) / totalItems
      : 50;
    similarityScore += commonItemsSimilarity;

    // Adjust for item differences
    const itemDiffPenalty = itemDifferences.length * 2;
    similarityScore = Math.max(0, similarityScore - itemDiffPenalty);

    similarityScore = Math.round(Math.min(100, similarityScore));

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (similarityScore < 50) {
      recommendations.push('Feeds are significantly different. Verify you are comparing the correct feeds.');
    }
    
    if (feed1.type !== feed2.type) {
      recommendations.push(`Feed formats differ: Feed 1 is ${feed1.type.toUpperCase()}, Feed 2 is ${feed2.type.toUpperCase()}.`);
    }
    
    if (uniqueToFeed1.length > 0) {
      recommendations.push(`Feed 1 has ${uniqueToFeed1.length} item(s) not found in Feed 2.`);
    }
    
    if (uniqueToFeed2.length > 0) {
      recommendations.push(`Feed 2 has ${uniqueToFeed2.length} item(s) not found in Feed 1.`);
    }
    
    if (itemDifferences.length > 0) {
      recommendations.push(`${itemDifferences.length} common item(s) have differences in content.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Feeds are very similar! They appear to be the same or very closely related.');
    }

    return {
      feed1Url,
      feed2Url,
      feed1,
      feed2,
      differences: {
        metadata: metadataDifferences,
        items: {
          count: {
            same: feed1.items.length === feed2.items.length,
            feed1: feed1.items.length,
            feed2: feed2.items.length,
          },
          commonItems: commonGuids.size,
          uniqueToFeed1: uniqueToFeed1.length,
          uniqueToFeed2: uniqueToFeed2.length,
          itemDifferences,
        },
        structure: {
          feed1Type: feed1.type,
          feed2Type: feed2.type,
          sameType: feed1.type === feed2.type,
        },
      },
      summary: {
        similarity: similarityScore,
        recommendations,
      },
    };
  }
}

export const feedComparatorService = new FeedComparatorService();

