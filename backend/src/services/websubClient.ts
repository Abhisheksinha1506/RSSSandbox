import { feedParserService } from './feedParser';
import fetch from 'node-fetch';
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
}

export class WebSubClient {
  private subscriptions: Map<string, WebSubSubscriptionResult> = new Map();

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
        const feedResponse = await fetch(feedUrl);
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

      const response = await fetch(subscribeUrl.toString(), {
        method: 'GET',
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

      // Store subscription
      this.subscriptions.set(topic, subscriptionResult);

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
    return this.subscriptions.get(topic);
  }

  getAllSubscriptions(): WebSubSubscriptionResult[] {
    return Array.from(this.subscriptions.values());
  }
}

export const webSubClient = new WebSubClient();
