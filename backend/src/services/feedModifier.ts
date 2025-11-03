import * as cheerio from 'cheerio';
import { feedParserService } from './feedParser';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export interface ModifiedFeed {
  original: string;
  modified: string;
  changes: Array<{
    type: 'image_alt_added' | 'enclosure_description_added';
    location: string;
    value: string;
  }>;
}

export class FeedModifier {
  async addAltText(url: string): Promise<ModifiedFeed> {
    try {
      const result = await feedParserService.parseFeed(url);
      
      if (!result.success || !result.feed) {
        throw new Error(result.error || 'Failed to parse feed');
      }

      const feed = result.feed;
      const changes: ModifiedFeed['changes'] = [];

      // For RSS/Atom, we need to modify the raw XML
      if (feed.type === 'rss' || feed.type === 'atom') {
        // Fetch the original feed XML
        const response = await fetch(url);
        const originalXml = await response.text();

        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
        });
        const builder = new XMLBuilder({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          format: true,
        });

        const feedObj = parser.parse(originalXml);

        // Process RSS format
        if (feed.type === 'rss' && feedObj.rss?.channel?.item) {
          const items = Array.isArray(feedObj.rss.channel.item)
            ? feedObj.rss.channel.item
            : [feedObj.rss.channel.item];

          items.forEach((item: any, index: number) => {
            const feedItem = feed.items[index];
            if (!feedItem) return;

            // Add alt text to images in description
            if (item.description) {
              const $ = cheerio.load(item.description);
              $('img').each((_, element) => {
                const img = $(element);
                if (!img.attr('alt') || img.attr('alt')?.trim() === '') {
                  const altText = this.generateAltText(feedItem.title || `Item ${index + 1}`);
                  img.attr('alt', altText);
                  changes.push({
                    type: 'image_alt_added',
                    location: `items[${index}].description/img`,
                    value: altText,
                  });
                }
              });
              item.description = $.html();
            }
          });
        }

        // Process Atom format
        if (feed.type === 'atom' && feedObj.feed?.entry) {
          const entries = Array.isArray(feedObj.feed.entry)
            ? feedObj.feed.entry
            : [feedObj.feed.entry];

          entries.forEach((entry: any, index: number) => {
            const feedItem = feed.items[index];
            if (!feedItem) return;

            // Add alt text to images in content/summary
            ['content', 'summary'].forEach((field) => {
              if (entry[field]?.['#text'] || entry[field]) {
                const html = entry[field]['#text'] || entry[field];
                const $ = cheerio.load(html);
                $('img').each((_, element) => {
                  const img = $(element);
                  if (!img.attr('alt') || img.attr('alt')?.trim() === '') {
                    const altText = this.generateAltText(feedItem.title || `Item ${index + 1}`);
                    img.attr('alt', altText);
                    changes.push({
                      type: 'image_alt_added',
                      location: `items[${index}].${field}/img`,
                      value: altText,
                    });
                  }
                });
                if (entry[field]['#text']) {
                  entry[field]['#text'] = $.html();
                } else {
                  entry[field] = $.html();
                }
              }
            });
          });
        }

        const modifiedXml = builder.build(feedObj);

        return {
          original: originalXml,
          modified: modifiedXml,
          changes,
        };
      }

      // For JSON Feed, modify JSON
      if (feed.type === 'json') {
        const response = await fetch(url);
        const originalJson = await response.json();
        const modifiedJson = JSON.parse(JSON.stringify(originalJson));

        if (modifiedJson.items) {
          modifiedJson.items.forEach((item: any, index: number) => {
            const feedItem = feed.items[index];
            if (!feedItem) return;

            // Add alt text to images in content_html
            if (item.content_html) {
              const $ = cheerio.load(item.content_html);
              $('img').each((_, element) => {
                const img = $(element);
                if (!img.attr('alt') || img.attr('alt')?.trim() === '') {
                  const altText = this.generateAltText(feedItem.title || `Item ${index + 1}`);
                  img.attr('alt', altText);
                  changes.push({
                    type: 'image_alt_added',
                    location: `items[${index}].content_html/img`,
                    value: altText,
                  });
                }
              });
              item.content_html = $.html();
            }

            // Add description to enclosures
            if (item.attachments && item.attachments.length > 0) {
              item.attachments.forEach((attachment: any) => {
                if (!attachment.title && !attachment.summary) {
                  const description = this.generateAltText(feedItem.title || `Item ${index + 1}`);
                  attachment.summary = description;
                  changes.push({
                    type: 'enclosure_description_added',
                    location: `items[${index}].attachments[${item.attachments.indexOf(attachment)}]`,
                    value: description,
                  });
                }
              });
            }
          });
        }

        return {
          original: JSON.stringify(originalJson, null, 2),
          modified: JSON.stringify(modifiedJson, null, 2),
          changes,
        };
      }

      throw new Error('Unsupported feed type');
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to modify feed');
    }
  }

  private generateAltText(title: string): string {
    // Generate a simple alt text from the title
    return `Image from: ${title}`;
  }
}

export const feedModifier = new FeedModifier();
