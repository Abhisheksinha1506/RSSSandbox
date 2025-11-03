import { feedParserService } from './feedParser';
import type { LinterResult, LinterIssue } from '../../../shared/types/linter';
import type { ParsedFeed } from '../../../shared/types/feed';

export class LinterService {
  async lintFeed(url: string): Promise<LinterResult> {
    const issues: LinterIssue[] = [];

    try {
      const result = await feedParserService.parseFeed(url);

      if (!result.success || !result.feed) {
        return {
          valid: false,
          issues: [
            {
              severity: 'error',
              message: result.error || 'Failed to parse feed',
            },
          ],
        };
      }

      const feed = result.feed;
      issues.push(...this.validateFeedMetadata(feed));
      issues.push(...this.validateFeedItems(feed));

      return {
        valid: issues.filter((i) => i.severity === 'error').length === 0,
        issues,
        feedType: feed.type,
      };
    } catch (error) {
      return {
        valid: false,
        issues: [
          {
            severity: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        ],
      };
    }
  }

  private validateFeedMetadata(feed: ParsedFeed): LinterIssue[] {
    const issues: LinterIssue[] = [];

    // Required fields
    if (!feed.metadata.title || feed.metadata.title.trim() === '') {
      issues.push({
        severity: 'error',
        message: 'Feed title is required',
        field: 'title',
      });
    }

    if (!feed.metadata.link || feed.metadata.link.trim() === '') {
      issues.push({
        severity: 'error',
        message: 'Feed link is required',
        field: 'link',
      });
    } else {
      try {
        new URL(feed.metadata.link);
      } catch {
        issues.push({
          severity: 'error',
          message: 'Feed link must be a valid URL',
          field: 'link',
        });
      }
    }

    // Recommended fields
    if (!feed.metadata.description || feed.metadata.description.trim() === '') {
      issues.push({
        severity: 'warning',
        message: 'Feed description is recommended but not required',
        field: 'description',
        suggestion: 'Add a description to help users understand your feed',
      });
    }

    if (!feed.metadata.lastBuildDate && !feed.metadata.pubDate) {
      issues.push({
        severity: 'info',
        message: 'Consider adding a publication or last build date',
        field: 'pubDate',
      });
    }

    return issues;
  }

  private validateFeedItems(feed: ParsedFeed): LinterIssue[] {
    const issues: LinterIssue[] = [];

    if (feed.items.length === 0) {
      issues.push({
        severity: 'warning',
        message: 'Feed contains no items',
        suggestion: 'A feed should contain at least one item',
      });
      return issues;
    }

    feed.items.forEach((item, index) => {
      // Required fields per item
      if (!item.title || item.title.trim() === '') {
        issues.push({
          severity: 'error',
          message: `Item ${index + 1} is missing a title`,
          field: `items[${index}].title`,
        });
      }

      if (!item.link || item.link.trim() === '') {
        issues.push({
          severity: 'error',
          message: `Item ${index + 1} is missing a link`,
          field: `items[${index}].link`,
        });
      } else {
        try {
          new URL(item.link);
        } catch {
          issues.push({
            severity: 'error',
            message: `Item ${index + 1} link is not a valid URL`,
            field: `items[${index}].link`,
          });
        }
      }

      // Recommended fields
      if (!item.description && !item.content) {
        issues.push({
          severity: 'warning',
          message: `Item ${index + 1} has no description or content`,
          field: `items[${index}].description`,
          suggestion: 'Add a description to help users understand the item',
        });
      }

      if (!item.pubDate) {
        issues.push({
          severity: 'info',
          message: `Item ${index + 1} has no publication date`,
          field: `items[${index}].pubDate`,
          suggestion: 'Add a publication date for better feed management',
        });
      }

      if (!item.guid && !item.link) {
        issues.push({
          severity: 'warning',
          message: `Item ${index + 1} has no unique identifier (guid)`,
          field: `items[${index}].guid`,
          suggestion: 'Add a guid for better item tracking',
        });
      }

      // RSS-specific validations
      if (feed.type === 'rss') {
        if (item.pubDate) {
          // Validate RFC 822 format
          const date = new Date(item.pubDate);
          if (isNaN(date.getTime())) {
            issues.push({
              severity: 'error',
              message: `Item ${index + 1} has an invalid publication date format`,
              field: `items[${index}].pubDate`,
              suggestion: 'Use RFC 822 format (e.g., "Mon, 01 Jan 2024 12:00:00 GMT")',
            });
          }
        }
      }

      // Atom-specific validations
      if (feed.type === 'atom') {
        if (item.pubDate) {
          // Validate RFC 3339 format
          const date = new Date(item.pubDate);
          if (isNaN(date.getTime())) {
            issues.push({
              severity: 'error',
              message: `Item ${index + 1} has an invalid date format for Atom`,
              field: `items[${index}].pubDate`,
              suggestion: 'Use RFC 3339 format (e.g., "2024-01-01T12:00:00Z")',
            });
          }
        }
      }

      // JSON Feed-specific validations
      if (feed.type === 'json') {
        if (!item.guid && !item.link) {
          issues.push({
            severity: 'error',
            message: `Item ${index + 1} must have either an id or url`,
            field: `items[${index}].id`,
          });
        }
      }
    });

    return issues;
  }
}

export const linterService = new LinterService();
