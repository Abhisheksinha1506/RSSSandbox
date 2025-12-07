import { feedParserService } from './feedParser';
import { fetchWithTimeout } from '../utils/httpClient';
import type { WebSubHub, WebSubSubscription } from '../../../shared/types/websub';

export interface WebSubDiscoveryResult {
  hub?: WebSubHub;
  found: boolean;
  error?: string;
}

export interface WebSubSubscriptionResult {
  subscription: WebSubSubscription;
  verified: boolean;
  error?: string;
  timestamp: number; // For TTL eviction
}

interface SubscriptionEntry {
  result: WebSubSubscriptionResult;
  timestamp: number;
}

export class WebSubClient {
  private subscriptions: Map<string, SubscriptionEntry> = new Map();
  private readonly SUBSCRIPTION_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup of expired subscriptions
    this.startCleanup();
  }

  private startCleanup(): void {
    // Clean up expired subscriptions every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.subscriptions.entries()) {
      // Remove entries older than TTL
      if (now - entry.timestamp > this.SUBSCRIPTION_TTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.subscriptions.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired WebSub subscription(s)`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.subscriptions.clear();
  }

  async discoverHub(feedUrl: string): Promise<WebSubDiscoveryResult> {
    try {
      const result = await feedParserService.parseFeed(feedUrl);
      
      if (!result.success || !result.feed) {
        return {
          found: false,
          error: result.error || 'Failed to parse feed',
        };
      }

      // Try to fetch the feed HTML to find hub links
      try {
        const feedResponse = await fetchWithTimeout(feedUrl, { timeout: 30000 });
        const feedText = await feedResponse.text();

        // Look for rel="hub" link in feed content
        const hubMatch = feedText.match(/<link[^>]*rel=["']hub["'][^>]*href=["']([^"']+)["']/i);
        const selfMatch = feedText.match(/<link[^>]*rel=["']self["'][^>]*href=["']([^"']+)["']/i);

        if (hubMatch) {
          return {
            hub: {
              url: hubMatch[1],
              self: selfMatch ? selfMatch[1] : feedUrl,
            },
            found: true,
          };
        }

        // For Atom feeds, check link elements
        const atomLinkMatch = feedText.match(/<atom:link[^>]*rel=["']hub["'][^>]*href=["']([^"']+)["']/i);
        if (atomLinkMatch) {
          return {
            hub: {
              url: atomLinkMatch[1],
              self: feedUrl,
            },
            found: true,
          };
        }

        return {
          found: false,
          error: 'No WebSub hub found in feed. This feed does not support WebSub (PubSubHubbub). WebSub is an optional feature that enables real-time feed updates. Most feeds do not support WebSub.',
        };
      } catch (error) {
        return {
          found: false,
          error: error instanceof Error ? error.message : 'Failed to fetch feed',
        };
      }
    } catch (error) {
      return {
        found: false,
        error: error instanceof Error ? error.message : 'Failed to discover hub',
      };
    }
  }

  async subscribe(hub: string, topic: string, callback: string, leaseSeconds = 86400): Promise<WebSubSubscriptionResult> {
    try {
      // Subscribe to hub
      const subscribeUrl = new URL(hub);
      subscribeUrl.searchParams.set('hub.mode', 'subscribe');
      subscribeUrl.searchParams.set('hub.topic', topic);
      subscribeUrl.searchParams.set('hub.callback', callback);
      subscribeUrl.searchParams.set('hub.lease_seconds', leaseSeconds.toString());

      const response = await fetchWithTimeout(subscribeUrl.toString(), {
        method: 'GET',
        timeout: 30000
      });

      const subscription: WebSubSubscription = {
        hub,
        topic,
        callback,
        leaseSeconds,
      };

      const subscriptionResult: WebSubSubscriptionResult = {
        subscription,
        verified: response.status === 202 || response.status === 204,
      };

      if (!subscriptionResult.verified) {
        subscriptionResult.error = `Hub returned status ${response.status}`;
      }

      // Store subscription with timestamp
      subscriptionResult.timestamp = Date.now();
      this.subscriptions.set(topic, {
        result: subscriptionResult,
        timestamp: subscriptionResult.timestamp
      });

      return subscriptionResult;
    } catch (error) {
      return {
        subscription: {
          hub,
          topic,
          callback,
          leaseSeconds,
        },
        verified: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe',
      };
    }
  }

  getSubscription(topic: string): WebSubSubscriptionResult | undefined {
    const entry = this.subscriptions.get(topic);
    if (!entry) {
      return undefined;
    }

    // Check if subscription has expired
    const now = Date.now();
    if (now - entry.timestamp > this.SUBSCRIPTION_TTL) {
      this.subscriptions.delete(topic);
      return undefined;
    }

    return entry.result;
  }

  getAllSubscriptions(): WebSubSubscriptionResult[] {
    const now = Date.now();
    const validSubscriptions: WebSubSubscriptionResult[] = [];

    for (const [key, entry] of this.subscriptions.entries()) {
      // Filter out expired subscriptions
      if (now - entry.timestamp <= this.SUBSCRIPTION_TTL) {
        validSubscriptions.push(entry.result);
      } else {
        // Remove expired subscription
        this.subscriptions.delete(key);
      }
    }

    return validSubscriptions;
  }
}

export const webSubClient = new WebSubClient();
