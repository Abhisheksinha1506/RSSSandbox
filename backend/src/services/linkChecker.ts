import { feedParserService } from './feedParser';
import { fetchWithHeaders } from '../utils/httpClient';
import * as cheerio from 'cheerio';

export interface LinkCheckResult {
  url: string;
  status: number;
  statusText: string;
  ok: boolean;
  redirectChain?: string[];
  error?: string;
}

export interface FeedLinkCheckResult {
  feedUrl: string;
  totalLinks: number;
  checkedLinks: number;
  brokenLinks: number;
  redirectLinks: number;
  workingLinks: number;
  links: LinkCheckResult[];
  recommendations: string[];
}

export class LinkCheckerService {
  async checkFeedLinks(feedUrl: string): Promise<FeedLinkCheckResult> {
    try {
      const parseResult = await feedParserService.parseFeed(feedUrl);
      
      if (!parseResult.success || !parseResult.feed) {
        throw new Error(parseResult.error || 'Failed to parse feed');
      }

      const feed = parseResult.feed;
      const links: LinkCheckResult[] = [];
      const recommendations: string[] = [];

      // Collect all links from feed
      const linkUrls = new Set<string>();

      // Add feed link
      if (feed.metadata.link) {
        linkUrls.add(feed.metadata.link);
      }

      // Add item links
      feed.items.forEach(item => {
        if (item.link) {
          linkUrls.add(item.link);
        }
        // Extract links from description/content
        if (item.description || item.content) {
          const html = item.description || item.content || '';
          const $ = cheerio.load(html);
          $('a').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
              try {
                const absoluteUrl = new URL(href, item.link || feedUrl).toString();
                linkUrls.add(absoluteUrl);
              } catch {
                // Invalid URL, skip
              }
            }
          });
        }
        // Add image URLs
        if (item.image) {
          linkUrls.add(item.image);
        }
        // Add enclosure URLs
        if (item.enclosure?.url) {
          linkUrls.add(item.enclosure.url);
        }
      });

      // Check each link with batching to prevent overwhelming the server
      const linkUrlsArray = Array.from(linkUrls);
      const BATCH_SIZE = 10; // Process 10 links at a time
      const BATCH_DELAY = 100; // 100ms delay between batches
      
      for (let i = 0; i < linkUrlsArray.length; i += BATCH_SIZE) {
        const batch = linkUrlsArray.slice(i, i + BATCH_SIZE);
        const batchChecks = await Promise.allSettled(
          batch.map(url => this.checkLink(url))
        );

        batchChecks.forEach((result, batchIndex) => {
          if (result.status === 'fulfilled') {
            links.push(result.value);
          } else {
            links.push({
              url: batch[batchIndex],
              status: 0,
              statusText: 'Error',
              ok: false,
              error: result.reason?.message || 'Failed to check link'
            });
          }
        });

        // Add delay between batches (except for the last batch)
        if (i + BATCH_SIZE < linkUrlsArray.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      // Calculate statistics
      const totalLinks = links.length;
      const checkedLinks = links.length;
      const brokenLinks = links.filter(l => !l.ok && l.status === 404).length;
      const redirectLinks = links.filter(l => l.status >= 300 && l.status < 400).length;
      const workingLinks = links.filter(l => l.ok).length;

      // Generate recommendations
      if (brokenLinks > 0) {
        recommendations.push(`Found ${brokenLinks} broken link(s) (404 Not Found). Please fix or remove these links.`);
      }
      if (redirectLinks > 0) {
        recommendations.push(`Found ${redirectLinks} redirect link(s). Consider updating to final URLs for better performance.`);
      }
      if (brokenLinks === 0 && redirectLinks === 0) {
        recommendations.push('All links are working correctly!');
      }
      if (brokenLinks / totalLinks > 0.1) {
        recommendations.push('⚠️ More than 10% of links are broken. This significantly impacts feed quality.');
      }

      return {
        feedUrl,
        totalLinks,
        checkedLinks,
        brokenLinks,
        redirectLinks,
        workingLinks,
        links,
        recommendations
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to check feed links');
    }
  }

  private async checkLink(url: string, maxRedirects: number = 5, redirectChain: string[] = []): Promise<LinkCheckResult> {
    try {
      // Prevent infinite redirect loops
      if (redirectChain.length >= maxRedirects) {
        return {
          url: redirectChain[0] || url,
          status: 0,
          statusText: 'Error',
          ok: false,
          error: `Maximum redirect depth (${maxRedirects}) exceeded`,
          redirectChain: redirectChain.length > 0 ? redirectChain : undefined
        };
      }

      // Prevent redirect loops by checking if we've seen this URL before
      if (redirectChain.includes(url)) {
        return {
          url: redirectChain[0] || url,
          status: 0,
          statusText: 'Error',
          ok: false,
          error: 'Redirect loop detected',
          redirectChain: redirectChain.length > 0 ? redirectChain : undefined
        };
      }

      const currentChain = [...redirectChain, url];
      const response = await fetchWithHeaders(url, { method: 'HEAD' });

      // Follow redirects recursively
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers['location'] || response.headers['Location'];
        if (location) {
          try {
            const redirectUrl = new URL(location, url).toString();
            // Recursively follow the redirect
            return this.checkLink(redirectUrl, maxRedirects, currentChain);
          } catch (urlError) {
            // Invalid redirect URL
            return {
              url: currentChain[0],
              status: response.status,
              statusText: response.statusText,
              ok: false,
              redirectChain: currentChain.length > 1 ? currentChain : undefined,
              error: `Invalid redirect URL: ${location}`
            };
          }
        }
      }

      return {
        url: currentChain[0],
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        redirectChain: currentChain.length > 1 ? currentChain : undefined,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        url: redirectChain[0] || url,
        status: 0,
        statusText: 'Error',
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to check link',
        redirectChain: redirectChain.length > 0 ? redirectChain : undefined
      };
    }
  }
}

export const linkCheckerService = new LinkCheckerService();

