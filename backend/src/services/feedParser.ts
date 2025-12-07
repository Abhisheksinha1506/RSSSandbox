import Parser from 'rss-parser';
import { XMLParser } from 'fast-xml-parser';
import { fetchWithTimeout } from '../utils/httpClient';
import type { ParsedFeed, FeedParseResult, FeedItem, FeedMetadata } from '../../../shared/types/feed';

// Type definitions for rss-parser output
interface RSSParserFeed {
  title?: string;
  description?: string;
  link?: string;
  feedUrl?: string;
  language?: string;
  copyright?: string;
  managingEditor?: string;
  webMaster?: string;
  pubDate?: string;
  lastBuildDate?: string;
  image?: {
    url?: string;
    title?: string;
    link?: string;
    width?: number;
    height?: number;
  } | string;
  items?: RSSParserItem[];
  raw?: string;
}

interface RSSParserItem {
  title?: string;
  link?: string;
  description?: string;
  contentSnippet?: string;
  content?: string;
  'content:encoded'?: string;
  pubDate?: string;
  guid?: string;
  id?: string;
  author?: string;
  creator?: string;
  categories?: string[];
  thumbnail?: {
    url?: string;
  };
  'media:thumbnail'?: {
    '@'?: {
      url?: string;
    };
  };
  enclosure?: {
    url?: string;
    type?: string;
    length?: number;
  };
}

interface JSONFeedItem {
  title?: string;
  url?: string;
  external_url?: string;
  summary?: string;
  content_html?: string;
  content_text?: string;
  date_published?: string;
  id?: string;
  authors?: Array<{ name?: string }>;
  tags?: string[];
  image?: string;
  banner_image?: string;
  attachments?: Array<{
    url?: string;
    mime_type?: string;
    size_in_bytes?: number;
  }>;
}

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'content'],
      ['media:thumbnail', 'thumbnail'],
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure']
    ]
  }
});

interface CacheEntry {
  result: FeedParseResult;
  timestamp: number;
  accessTime: number; // For LRU eviction
}

/**
 * LRU Cache implementation with size limits and TTL
 */
class LRUCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttl: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    // Start periodic cleanup every minute
    this.startCleanup();
  }

  get(url: string): FeedParseResult | null {
    const entry = this.cache.get(url);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    // Check TTL
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(url);
      return null;
    }

    // Update access time for LRU
    entry.accessTime = now;
    // Move to end (most recently used)
    this.cache.delete(url);
    this.cache.set(url, entry);
    
    return entry.result;
  }

  set(url: string, result: FeedParseResult): void {
    const now = Date.now();
    
    // If updating existing entry, remove it first to move to end (most recently used)
    if (this.cache.has(url)) {
      this.cache.delete(url);
    }
    
    // If cache is full and we're adding a new entry, remove least recently used (first key)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Add/update entry at the end (most recently used position)
    this.cache.set(url, {
      result,
      timestamp: now,
      accessTime: now
    });
  }

  private startCleanup(): void {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached feeds
const cache = new LRUCache(MAX_CACHE_SIZE, CACHE_TTL);

// Track in-flight requests to prevent duplicate concurrent requests
const inFlightRequests = new Map<string, Promise<FeedParseResult>>();

// Size limits to prevent memory issues
const MAX_FEED_ITEMS = 1000;
const MAX_FEED_SIZE_MB = 10;
const MAX_FEED_SIZE_BYTES = MAX_FEED_SIZE_MB * 1024 * 1024;
const SIZE_CHECK_THRESHOLD = MAX_FEED_SIZE_BYTES * 0.8; // Only do expensive check if > 80% of limit

/**
 * Estimate feed size without expensive JSON.stringify
 * Uses raw feed size + overhead estimate for normalization
 */
function estimateFeedSize(normalizedFeed: ParsedFeed, rawFeedSize?: number): number {
  // If we have raw feed size, use it as base (most accurate)
  let estimatedSize = rawFeedSize || 0;
  
  // Add overhead for normalization (metadata + structure overhead)
  // Typically normalization adds 10-20% overhead
  if (rawFeedSize) {
    estimatedSize = Math.ceil(estimatedSize * 1.2);
  } else {
    // Fallback: estimate from string lengths
    estimatedSize = 0;
    if (normalizedFeed.metadata) {
      estimatedSize += (normalizedFeed.metadata.title?.length || 0);
      estimatedSize += (normalizedFeed.metadata.description?.length || 0);
      estimatedSize += (normalizedFeed.metadata.link?.length || 0);
    }
    if (normalizedFeed.items) {
      normalizedFeed.items.forEach(item => {
        estimatedSize += (item.title?.length || 0);
        estimatedSize += (item.description?.length || 0);
        estimatedSize += (item.content?.length || 0);
        estimatedSize += (item.link?.length || 0);
      });
    }
    // Add overhead for JSON structure (brackets, quotes, etc.)
    estimatedSize = Math.ceil(estimatedSize * 1.3);
  }
  
  return estimatedSize;
}

export class FeedParserService {
  async parseFeed(url: string, useCache = true): Promise<FeedParseResult> {
    // Check cache first
    if (useCache) {
      const cached = cache.get(url);
      if (cached) {
        return cached;
      }
    }

    // Check if there's already an in-flight request for this URL
    const inFlight = inFlightRequests.get(url);
    if (inFlight) {
      return inFlight;
    }

    // Create new request promise
    const requestPromise = this.parseFeedInternal(url).then(result => {
      // Remove from in-flight requests
      inFlightRequests.delete(url);
      
      // Cache successful results
      if (useCache && result.success) {
        cache.set(url, result);
      }
      
      return result;
    }).catch(error => {
      // Remove from in-flight requests on error
      inFlightRequests.delete(url);
      throw error;
    });

    // Track in-flight request
    inFlightRequests.set(url, requestPromise);
    
    return requestPromise;
  }

  private async parseFeedInternal(url: string): Promise<FeedParseResult> {
    try {
      // Try RSS/Atom first with rss-parser
      const feed = await parser.parseURL(url) as unknown as RSSParserFeed;
      
      // Determine feed type
      let feedType: 'rss' | 'atom' | 'json' = 'rss';
      if (feed.feedUrl?.includes('atom')) {
        feedType = 'atom';
      }

      // Check item count limit
      if (feed.items && feed.items.length > MAX_FEED_ITEMS) {
        return {
          success: false,
          error: `Feed contains ${feed.items.length} items, which exceeds the maximum limit of ${MAX_FEED_ITEMS} items. Please use a feed with fewer items.`
        };
      }

      // Normalize to common structure
      const normalizedFeed: ParsedFeed = {
        type: feedType,
        metadata: this.normalizeMetadata(feed),
        items: feed.items.map(item => this.normalizeItem(item)),
        raw: feed as unknown as string
      };

      // Check feed size (optimized - avoid expensive JSON.stringify)
      // Try to get raw feed size from the parser if available
      const rawFeedSize = typeof feed.raw === 'string' ? feed.raw.length : undefined;
      let feedSize = estimateFeedSize(normalizedFeed, rawFeedSize);
      
      // Only do expensive JSON.stringify if estimate is close to limit
      if (feedSize > SIZE_CHECK_THRESHOLD) {
        feedSize = JSON.stringify(normalizedFeed).length;
      }
      
      if (feedSize > MAX_FEED_SIZE_BYTES) {
        return {
          success: false,
          error: `Feed size (${Math.round(feedSize / 1024 / 1024 * 100) / 100}MB) exceeds the maximum limit of ${MAX_FEED_SIZE_MB}MB. Please use a smaller feed.`
        };
      }

      return {
        success: true,
        feed: normalizedFeed
      };
    } catch (error) {
      // Try JSON Feed format as fallback
      let jsonFeedError: Error | null = null;
      let httpStatus: number | undefined;
      let httpStatusText: string | undefined;
      
      try {
        const response = await fetchWithTimeout(url, {
          headers: {
            'Accept': 'application/json, application/feed+json, */*'
          },
          timeout: 30000
        });
        
        httpStatus = response.status;
        httpStatusText = response.statusText;
        
        if (!response.ok) {
          // If JSON feed fetch fails with HTTP error, use the original error
          // (which is likely more descriptive from rss-parser)
          jsonFeedError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        } else {
          const jsonData = await response.json() as { version?: string; items?: JSONFeedItem[]; title?: string; description?: string; home_page_url?: string; language?: string; icon?: string };
          
          if (jsonData.version && jsonData.version.startsWith('https://jsonfeed.org')) {
            const items = jsonData.items || [];
            
            // Check item count limit
            if (items.length > MAX_FEED_ITEMS) {
              return {
                success: false,
                error: `Feed contains ${items.length} items, which exceeds the maximum limit of ${MAX_FEED_ITEMS} items. Please use a feed with fewer items.`
              };
            }

            // Get raw JSON size before stringifying (we already have it from response)
            const rawJsonString = JSON.stringify(jsonData);
            const rawFeedSize = rawJsonString.length;

            const normalizedFeed: ParsedFeed = {
              type: 'json',
              metadata: {
                title: jsonData.title || '',
                description: jsonData.description,
                link: jsonData.home_page_url || '',
                language: jsonData.language,
                image: jsonData.icon ? {
                  url: jsonData.icon,
                  title: jsonData.title || '',
                  link: jsonData.home_page_url || ''
                } : undefined
              },
              items: items.map((item: JSONFeedItem) => this.normalizeJsonFeedItem(item)),
              raw: rawJsonString
            };

            // Check feed size (optimized - use raw JSON size as base)
            let feedSize = estimateFeedSize(normalizedFeed, rawFeedSize);
            
            // Only do expensive JSON.stringify if estimate is close to limit
            if (feedSize > SIZE_CHECK_THRESHOLD) {
              feedSize = JSON.stringify(normalizedFeed).length;
            }
            
            if (feedSize > MAX_FEED_SIZE_BYTES) {
              return {
                success: false,
                error: `Feed size (${Math.round(feedSize / 1024 / 1024 * 100) / 100}MB) exceeds the maximum limit of ${MAX_FEED_SIZE_MB}MB. Please use a smaller feed.`
              };
            }

            return {
              success: true,
              feed: normalizedFeed
            };
          }
        }
      } catch (jsonError) {
        // JSON feed fetch/parse failed, fall through to main error
        jsonFeedError = jsonError instanceof Error ? jsonError : new Error(String(jsonError));
        // Try to extract HTTP status from fetch error if available
        if (jsonError && typeof jsonError === 'object' && 'status' in jsonError) {
          httpStatus = (jsonError as any).status;
        }
      }

      // Parse and categorize the original error (from rss-parser)
      // This is usually more informative than the JSON feed error
      // Pass HTTP status information if available
      const parsedError = this.parseError(error, url, httpStatus, httpStatusText);
      return {
        success: false,
        error: parsedError.message
      };
    }
  }

  /**
   * Parse and categorize errors to provide detailed, actionable error messages
   */
  private parseError(error: unknown, url: string, httpStatus?: number, httpStatusText?: string): { message: string; type: 'network' | 'http' | 'cors' | 'parse' | 'unknown' } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = errorMessage.toLowerCase();

    // Check for HTTP errors
    if (httpStatus) {
      switch (httpStatus) {
        case 404:
          return {
            type: 'http',
            message: `HTTP 404: Feed not found at this URL. Verify the feed URL is correct and publicly accessible. Try opening "${url}" directly in your browser to confirm it exists.`
          };
        case 403:
          return {
            type: 'http',
            message: `HTTP 403: Access forbidden. The feed server is blocking access to this URL. This may be due to server configuration or access restrictions. Try checking if the feed requires authentication.`
          };
        case 401:
          return {
            type: 'http',
            message: `HTTP 401: Authentication required. This feed requires authentication to access. Contact the feed publisher for access credentials.`
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: 'http',
            message: `HTTP ${httpStatus}: Server error. The feed server is experiencing issues (${httpStatusText || 'Server Error'}). The problem is on the server side, not with your request. Try again later.`
          };
        default:
          if (httpStatus >= 400 && httpStatus < 500) {
            return {
              type: 'http',
              message: `HTTP ${httpStatus}: Client error (${httpStatusText || 'Error'}). The request was invalid or the feed URL may be incorrect. Verify the URL and try again.`
            };
          } else if (httpStatus >= 500) {
            return {
              type: 'http',
              message: `HTTP ${httpStatus}: Server error (${httpStatusText || 'Error'}). The feed server encountered an error. Try again later or contact the feed publisher.`
            };
          }
      }
    }

    // Check for network errors
    if (errorString.includes('enotfound') || 
        errorString.includes('econnrefused') || 
        errorString.includes('timeout') ||
        errorString.includes('network') ||
        errorString.includes('dns') ||
        errorString.includes('getaddrinfo') ||
        errorString.includes('connection') ||
        errorString.includes('econnreset')) {
      return {
        type: 'network',
        message: `Network connection failed: Unable to connect to the feed server at "${url}". Check your internet connection and try again. If the problem persists, the feed server may be temporarily unavailable or the URL may be incorrect.`
      };
    }

    // Check for CORS errors
    if (errorString.includes('cors') || 
        errorString.includes('cross-origin') ||
        errorString.includes('access-control') ||
        errorString.includes('no access-control-allow-origin')) {
      return {
        type: 'cors',
        message: `CORS policy blocked: The feed server doesn't allow cross-origin requests from this application. This is a server-side configuration issue. Try accessing "${url}" directly in your browser, or contact the feed publisher to enable CORS headers.`
      };
    }

    // Check for parse/format errors
    if (errorString.includes('parse') || 
        errorString.includes('xml') ||
        errorString.includes('invalid') ||
        errorString.includes('malformed') ||
        errorString.includes('syntax') ||
        errorString.includes('unexpected') ||
        errorString.includes('not well-formed')) {
      return {
        type: 'parse',
        message: `Invalid feed format: The feed XML/JSON is malformed or invalid. The feed structure doesn't conform to RSS, Atom, or JSON Feed specifications. Validate your feed structure using the RSS Spec & Linter tool, or check the feed source for formatting errors.`
      };
    }

    // Check for SSL/TLS errors
    if (errorString.includes('ssl') || 
        errorString.includes('tls') ||
        errorString.includes('certificate') ||
        errorString.includes('unable to verify')) {
      return {
        type: 'network',
        message: `SSL/TLS error: There's a problem with the security certificate for "${url}". The connection cannot be verified as secure. This may indicate a server configuration issue or an expired certificate.`
      };
    }

    // Check for rate limiting
    if (errorString.includes('rate limit') || 
        errorString.includes('too many requests') ||
        errorString.includes('429')) {
      return {
        type: 'http',
        message: `Rate limit exceeded: Too many requests to this feed. Please wait a few moments before trying again.`
      };
    }

    // Generic error with context
    return {
      type: 'unknown',
      message: `Failed to parse feed from "${url}": ${errorMessage}. This could be due to an invalid feed format, network issues, or server problems. Try validating the feed URL in your browser first, or use the RSS Spec & Linter tool to check the feed structure.`
    };
  }

  private normalizeMetadata(feed: RSSParserFeed): FeedMetadata {
    return {
      title: feed.title || '',
      description: feed.description,
      link: feed.link || feed.feedUrl || '',
      language: feed.language,
      copyright: feed.copyright,
      managingEditor: feed.managingEditor,
      webMaster: feed.webMaster,
      pubDate: feed.pubDate ? new Date(feed.pubDate) : undefined,
      lastBuildDate: feed.lastBuildDate ? new Date(feed.lastBuildDate) : undefined,
      image: feed.image ? {
        url: feed.image.url || feed.image,
        title: feed.image.title || feed.title || '',
        link: feed.image.link || feed.link || '',
        width: feed.image.width,
        height: feed.image.height
      } : undefined
    };
  }

  private normalizeItem(item: RSSParserItem): FeedItem {
    return {
      title: item.title || '',
      link: item.link || '',
      description: item.contentSnippet || item.description,
      content: item.content || item['content:encoded'],
      pubDate: item.pubDate ? new Date(item.pubDate) : undefined,
      guid: item.guid || item.id || item.link,
      author: item.author || item.creator,
      categories: item.categories || [],
      image: item.thumbnail?.url || item['media:thumbnail']?.['@']?.url || this.extractImageFromContent(item.content || item.description),
      enclosure: item.enclosure ? {
        url: item.enclosure.url,
        type: item.enclosure.type,
        length: item.enclosure.length
      } : undefined
    };
  }

  private normalizeJsonFeedItem(item: JSONFeedItem): FeedItem {
    return {
      title: item.title || '',
      link: item.url || item.external_url || '',
      description: item.summary,
      content: item.content_html || item.content_text,
      pubDate: item.date_published ? new Date(item.date_published) : undefined,
      guid: item.id || item.url,
      author: item.authors?.[0]?.name,
      categories: item.tags || [],
      image: item.image || item.banner_image,
      enclosure: item.attachments?.[0] ? {
        url: item.attachments[0].url,
        type: item.attachments[0].mime_type,
        length: item.attachments[0].size_in_bytes
      } : undefined
    };
  }

  private extractImageFromContent(content?: string): string | undefined {
    if (!content) return undefined;
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : undefined;
  }

  /**
   * Clear the cache (useful for testing or manual cache invalidation)
   */
  clearCache(): void {
    cache.clear();
  }

  /**
   * Get cache size (useful for monitoring)
   */
  getCacheSize(): number {
    return cache.size();
  }

  /**
   * Get number of in-flight requests (useful for monitoring)
   */
  getInFlightRequestCount(): number {
    return inFlightRequests.size;
  }

  /**
   * Cleanup resources (call on shutdown)
   */
  destroy(): void {
    cache.destroy();
    inFlightRequests.clear();
  }
}

export const feedParserService = new FeedParserService();

