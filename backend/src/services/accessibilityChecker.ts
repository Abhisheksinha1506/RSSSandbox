import * as cheerio from 'cheerio';
import { feedParserService } from './feedParser';
import type { ParsedFeed } from '../../../shared/types/feed';

export interface AccessibilityIssue {
  type: 'image' | 'enclosure';
  itemIndex: number;
  itemTitle: string;
  url: string;
  issue: string;
  location: string;
}

export interface AccessibilityResult {
  issues: AccessibilityIssue[];
  totalImages: number;
  totalEnclosures: number;
  missingAltText: number;
  missingDescriptions: number;
}

export class AccessibilityChecker {
  async checkAccessibility(url: string): Promise<AccessibilityResult> {
    const issues: AccessibilityIssue[] = [];
    let totalImages = 0;
    let totalEnclosures = 0;
    let missingAltText = 0;
    let missingDescriptions = 0;

    try {
      const result = await feedParserService.parseFeed(url);
      
      if (!result.success || !result.feed) {
        throw new Error(result.error || 'Failed to parse feed');
      }

      const feed = result.feed;

      feed.items.forEach((item, index) => {
        // Check images in description/content
        if (item.description || item.content) {
          const html = item.description || item.content || '';
          const $ = cheerio.load(html);
          
          $('img').each((_, element) => {
            totalImages++;
            const img = $(element);
            const src = img.attr('src') || '';
            const alt = img.attr('alt');
            
            if (!alt || alt.trim() === '') {
              missingAltText++;
              issues.push({
                type: 'image',
                itemIndex: index,
                itemTitle: item.title || `Item ${index + 1}`,
                url: src,
                issue: 'Missing alt text',
                location: `items[${index}].description/img`,
              });
            }
          });
        }

        // Check item.image field
        if (item.image) {
          totalImages++;
          // Item-level images typically don't have alt text in RSS
          // But we can check if description exists for the item
          if (!item.description || item.description.trim() === '') {
            missingAltText++;
            issues.push({
              type: 'image',
              itemIndex: index,
              itemTitle: item.title || `Item ${index + 1}`,
              url: item.image,
              issue: 'Image without descriptive content',
              location: `items[${index}].image`,
            });
          }
        }

        // Check enclosures
        if (item.enclosure) {
          totalEnclosures++;
          if (!item.description || item.description.trim() === '') {
            missingDescriptions++;
            issues.push({
              type: 'enclosure',
              itemIndex: index,
              itemTitle: item.title || `Item ${index + 1}`,
              url: item.enclosure.url,
              issue: 'Enclosure without description',
              location: `items[${index}].enclosure`,
            });
          }
        }
      });

      return {
        issues,
        totalImages,
        totalEnclosures,
        missingAltText,
        missingDescriptions,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to check accessibility');
    }
  }
}

export const accessibilityChecker = new AccessibilityChecker();
