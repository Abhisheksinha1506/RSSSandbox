import { feedParserService } from './feedParser';
import type { ParsedFeed } from '../../../shared/types/feed';

export interface ConvertResult {
  success: boolean;
  convertedFeed?: string;
  originalType: 'rss' | 'atom' | 'json';
  targetType: 'rss' | 'atom' | 'json';
  error?: string;
}

export class FeedConverterService {
  async convertFeed(url: string, targetType: 'rss' | 'atom' | 'json'): Promise<ConvertResult> {
    try {
      // Parse the original feed
      const parseResult = await feedParserService.parseFeed(url);
      
      if (!parseResult.success || !parseResult.feed) {
        return {
          success: false,
          originalType: 'rss',
          targetType,
          error: parseResult.error || 'Failed to parse feed'
        };
      }

      const feed = parseResult.feed;
      const originalType = feed.type;

      // If already in target format, return as-is
      if (originalType === targetType) {
        return {
          success: true,
          convertedFeed: feed.raw || this.convertToFormat(feed, targetType),
          originalType,
          targetType
        };
      }

      // Convert to target format
      const convertedFeed = this.convertToFormat(feed, targetType);

      return {
        success: true,
        convertedFeed,
        originalType,
        targetType
      };
    } catch (error) {
      return {
        success: false,
        originalType: 'rss',
        targetType,
        error: error instanceof Error ? error.message : 'Failed to convert feed'
      };
    }
  }

  private convertToFormat(feed: ParsedFeed, targetType: 'rss' | 'atom' | 'json'): string {
    switch (targetType) {
      case 'rss':
        return this.convertToRSS(feed);
      case 'atom':
        return this.convertToAtom(feed);
      case 'json':
        return this.convertToJSONFeed(feed);
      default:
        throw new Error(`Unsupported target format: ${targetType}`);
    }
  }

  private convertToRSS(feed: ParsedFeed): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n';
    xml += '  <channel>\n';
    
    // Channel metadata
    xml += `    <title>${this.escapeXML(feed.metadata.title)}</title>\n`;
    xml += `    <link>${this.escapeXML(feed.metadata.link)}</link>\n`;
    xml += `    <description>${this.escapeXML(feed.metadata.description || '')}</description>\n`;
    if (feed.metadata.language) {
      xml += `    <language>${this.escapeXML(feed.metadata.language)}</language>\n`;
    }
    if (feed.metadata.copyright) {
      xml += `    <copyright>${this.escapeXML(feed.metadata.copyright)}</copyright>\n`;
    }
    if (feed.metadata.managingEditor) {
      xml += `    <managingEditor>${this.escapeXML(feed.metadata.managingEditor)}</managingEditor>\n`;
    }
    if (feed.metadata.webMaster) {
      xml += `    <webMaster>${this.escapeXML(feed.metadata.webMaster)}</webMaster>\n`;
    }
    if (feed.metadata.pubDate) {
      xml += `    <pubDate>${this.formatRFC822(feed.metadata.pubDate)}</pubDate>\n`;
    }
    if (feed.metadata.lastBuildDate) {
      xml += `    <lastBuildDate>${this.formatRFC822(feed.metadata.lastBuildDate)}</lastBuildDate>\n`;
    }
    if (feed.metadata.image) {
      xml += '    <image>\n';
      xml += `      <url>${this.escapeXML(feed.metadata.image.url)}</url>\n`;
      xml += `      <title>${this.escapeXML(feed.metadata.image.title)}</title>\n`;
      xml += `      <link>${this.escapeXML(feed.metadata.image.link)}</link>\n`;
      if (feed.metadata.image.width) {
        xml += `      <width>${feed.metadata.image.width}</width>\n`;
      }
      if (feed.metadata.image.height) {
        xml += `      <height>${feed.metadata.image.height}</height>\n`;
      }
      xml += '    </image>\n';
    }
    
    // Items
    feed.items.forEach(item => {
      xml += '    <item>\n';
      xml += `      <title>${this.escapeXML(item.title)}</title>\n`;
      xml += `      <link>${this.escapeXML(item.link)}</link>\n`;
      if (item.description) {
        xml += `      <description><![CDATA[${item.description}]]></description>\n`;
      }
      if (item.content) {
        xml += `      <content:encoded><![CDATA[${item.content}]]></content:encoded>\n`;
      }
      if (item.pubDate) {
        xml += `      <pubDate>${this.formatRFC822(item.pubDate)}</pubDate>\n`;
      }
      if (item.guid) {
        const isPermaLink = item.guid === item.link ? 'true' : 'false';
        xml += `      <guid isPermaLink="${isPermaLink}">${this.escapeXML(item.guid)}</guid>\n`;
      } else {
        xml += `      <guid isPermaLink="true">${this.escapeXML(item.link)}</guid>\n`;
      }
      if (item.author) {
        xml += `      <author>${this.escapeXML(item.author)}</author>\n`;
      }
      if (item.categories && item.categories.length > 0) {
        item.categories.forEach(category => {
          xml += `      <category>${this.escapeXML(category)}</category>\n`;
        });
      }
      if (item.enclosure) {
        xml += `      <enclosure url="${this.escapeXML(item.enclosure.url)}" type="${this.escapeXML(item.enclosure.type)}"`;
        if (item.enclosure.length) {
          xml += ` length="${item.enclosure.length}"`;
        }
        xml += ' />\n';
      }
      xml += '    </item>\n';
    });
    
    xml += '  </channel>\n';
    xml += '</rss>';
    
    return xml;
  }

  private convertToAtom(feed: ParsedFeed): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<feed xmlns="http://www.w3.org/2005/Atom">\n';
    
    // Feed metadata
    xml += `  <title>${this.escapeXML(feed.metadata.title)}</title>\n`;
    xml += `  <link href="${this.escapeXML(feed.metadata.link)}" rel="alternate" />\n`;
    xml += `  <id>${this.escapeXML(feed.metadata.link)}</id>\n`;
    xml += `  <updated>${(feed.metadata.lastBuildDate || feed.metadata.pubDate || new Date()).toISOString()}</updated>\n`;
    if (feed.metadata.description) {
      xml += `  <subtitle>${this.escapeXML(feed.metadata.description)}</subtitle>\n`;
    }
    if (feed.metadata.language) {
      xml += `  <lang>${this.escapeXML(feed.metadata.language)}</lang>\n`;
    }
    if (feed.metadata.copyright) {
      xml += `  <rights>${this.escapeXML(feed.metadata.copyright)}</rights>\n`;
    }
    if (feed.metadata.image?.url) {
      xml += `  <icon>${this.escapeXML(feed.metadata.image.url)}</icon>\n`;
    }
    
    // Entries
    feed.items.forEach(item => {
      xml += '  <entry>\n';
      xml += `    <title>${this.escapeXML(item.title)}</title>\n`;
      xml += `    <link href="${this.escapeXML(item.link)}" rel="alternate" />\n`;
      xml += `    <id>${this.escapeXML(item.guid || item.link)}</id>\n`;
      xml += `    <updated>${(item.pubDate || new Date()).toISOString()}</updated>\n`;
      if (item.pubDate) {
        xml += `    <published>${item.pubDate.toISOString()}</published>\n`;
      }
      if (item.author) {
        xml += '    <author>\n';
        xml += `      <name>${this.escapeXML(item.author)}</name>\n`;
        xml += '    </author>\n';
      }
      if (item.categories && item.categories.length > 0) {
        item.categories.forEach(category => {
          xml += `    <category term="${this.escapeXML(category)}" />\n`;
        });
      }
      if (item.description) {
        xml += `    <summary type="html"><![CDATA[${item.description}]]></summary>\n`;
      }
      if (item.content) {
        xml += `    <content type="html"><![CDATA[${item.content}]]></content>\n`;
      }
      xml += '  </entry>\n';
    });
    
    xml += '</feed>';
    
    return xml;
  }

  private convertToJSONFeed(feed: ParsedFeed): string {
    const jsonFeed: any = {
      version: 'https://jsonfeed.org/version/1.1',
      title: feed.metadata.title,
      description: feed.metadata.description,
      home_page_url: feed.metadata.link,
      feed_url: feed.metadata.link,
      language: feed.metadata.language,
      icon: feed.metadata.image?.url,
      items: feed.items.map(item => ({
        id: item.guid || item.link,
        url: item.link,
        title: item.title,
        content_html: item.content,
        content_text: this.stripHTML(item.content || item.description || ''),
        summary: item.description,
        date_published: item.pubDate ? item.pubDate.toISOString() : undefined,
        date_modified: item.pubDate ? item.pubDate.toISOString() : undefined,
        authors: item.author ? [{ name: item.author }] : undefined,
        tags: item.categories,
        image: item.image,
        attachments: item.enclosure ? [{
          url: item.enclosure.url,
          mime_type: item.enclosure.type,
          size_in_bytes: item.enclosure.length
        }] : undefined
      })).filter(item => item.title)
    };

    // Remove undefined values
    Object.keys(jsonFeed).forEach(key => {
      if (jsonFeed[key] === undefined) {
        delete jsonFeed[key];
      }
    });

    jsonFeed.items.forEach((item: any) => {
      Object.keys(item).forEach(key => {
        if (item[key] === undefined) {
          delete item[key];
        }
      });
    });

    return JSON.stringify(jsonFeed, null, 2);
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

  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
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

export const feedConverterService = new FeedConverterService();

