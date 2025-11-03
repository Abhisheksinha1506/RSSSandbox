import { XMLParser } from 'fast-xml-parser';
import { fetchWithHeaders } from '../utils/httpClient';

export interface OPMLFeed {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  description?: string;
  category?: string[];
}

export interface OPMLResult {
  title: string;
  feeds: OPMLFeed[];
  dateCreated: Date;
  dateModified: Date;
}

export class OPMLGeneratorService {
  async generateOPML(feedUrls: string[]): Promise<string> {
    if (!feedUrls || feedUrls.length === 0) {
      throw new Error('At least one feed URL is required');
    }

    // Fetch basic info for each feed
    const feeds: OPMLFeed[] = [];
    
    for (const url of feedUrls) {
      try {
        // Validate URL
        new URL(url);
        
        // Try to fetch feed to get title
        try {
          const response = await fetchWithHeaders(url, { method: 'GET' });
          if (response.body) {
            const parser = new XMLParser();
            const feedData = parser.parse(response.body);
            
            let title = url;
            if (feedData.rss?.channel?.title) {
              title = feedData.rss.channel.title;
            } else if (feedData.feed?.title) {
              title = typeof feedData.feed.title === 'string' 
                ? feedData.feed.title 
                : feedData.feed.title['#text'] || feedData.feed.title['#cdata-section'] || url;
            }
            
            feeds.push({
              title,
              xmlUrl: url,
              htmlUrl: feedData.rss?.channel?.link || feedData.feed?.link?.['@_href'] || url,
            });
          } else {
            feeds.push({
              title: url,
              xmlUrl: url,
              htmlUrl: url,
            });
          }
        } catch {
          // If we can't fetch, just use the URL as title
          feeds.push({
            title: url,
            xmlUrl: url,
            htmlUrl: url,
          });
        }
      } catch {
        // Invalid URL, skip
      }
    }

    // Generate OPML XML
    const now = new Date();
    const opml = this.buildOPML({
      title: 'RSS Feed Subscription List',
      feeds,
      dateCreated: now,
      dateModified: now,
    });

    return opml;
  }

  async parseOPML(opmlContent: string): Promise<OPMLResult> {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      });
      
      const opmlData = parser.parse(opmlContent);
      
      if (!opmlData.opml || !opmlData.opml.body) {
        throw new Error('Invalid OPML format');
      }

      const feeds: OPMLFeed[] = [];
      const outline = opmlData.opml.body.outline;
      
      const processOutline = (outlineItem: any) => {
        if (Array.isArray(outlineItem)) {
          outlineItem.forEach(item => processOutline(item));
        } else if (outlineItem['@_xmlUrl']) {
          feeds.push({
            title: outlineItem['@_title'] || outlineItem['@_text'] || outlineItem['@_xmlUrl'],
            xmlUrl: outlineItem['@_xmlUrl'],
            htmlUrl: outlineItem['@_htmlUrl'],
            description: outlineItem['@_description'],
            category: outlineItem['@_category'] ? [outlineItem['@_category']] : undefined,
          });
        } else if (outlineItem.outline) {
          // Nested outlines
          processOutline(outlineItem.outline);
        }
      };

      processOutline(outline);

      const head = opmlData.opml.head || {};
      const title = head.title || 'Imported OPML';
      const dateCreated = head.dateCreated ? new Date(head.dateCreated) : new Date();
      const dateModified = head.dateModified ? new Date(head.dateModified) : new Date();

      return {
        title,
        feeds,
        dateCreated,
        dateModified,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to parse OPML');
    }
  }

  private buildOPML(result: OPMLResult): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<opml version="2.0">\n';
    xml += '  <head>\n';
    xml += `    <title>${this.escapeXML(result.title)}</title>\n`;
    xml += `    <dateCreated>${this.formatRFC822(result.dateCreated)}</dateCreated>\n`;
    xml += `    <dateModified>${this.formatRFC822(result.dateModified)}</dateModified>\n`;
    xml += '  </head>\n';
    xml += '  <body>\n';
    
    result.feeds.forEach(feed => {
      xml += '    <outline';
      xml += ` text="${this.escapeXML(feed.title)}"`;
      xml += ` type="rss"`;
      xml += ` xmlUrl="${this.escapeXML(feed.xmlUrl)}"`;
      if (feed.htmlUrl) {
        xml += ` htmlUrl="${this.escapeXML(feed.htmlUrl)}"`;
      }
      if (feed.description) {
        xml += ` description="${this.escapeXML(feed.description)}"`;
      }
      xml += ' />\n';
    });
    
    xml += '  </body>\n';
    xml += '</opml>';
    
    return xml;
  }

  private formatRFC822(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = days[date.getUTCDay()];
    const dayNum = date.getUTCDate().toString().padStart(2, '0');
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    
    return `${day}, ${dayNum} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const opmlGeneratorService = new OPMLGeneratorService();

