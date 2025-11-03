import robotsParser from 'robots-parser';
import fetch from 'node-fetch';
import { URL } from 'url';

export interface RobotsTestResult {
  robotsUrl: string;
  robotsText?: string;
  rules: {
    allowed: boolean;
    disallowed: boolean;
    crawlDelay?: number;
    userAgent: string;
  }[];
  feedPath: string;
  feedAllowed: boolean;
  feedBlockedUserAgents: string[];
}

export class RobotsTester {
  async testRobots(feedUrl: string, userAgents: string[] = ['*', 'Googlebot', 'Bingbot']): Promise<RobotsTestResult> {
    try {
      const feedUrlObj = new URL(feedUrl);
      const baseUrl = `${feedUrlObj.protocol}//${feedUrlObj.host}`;
      const robotsUrl = `${baseUrl}/robots.txt`;
      const feedPath = feedUrlObj.pathname;

      // Fetch robots.txt
      let robotsText: string | undefined;
      try {
        const response = await fetch(robotsUrl);
        if (response.ok) {
          robotsText = await response.text();
        }
      } catch (error) {
        // robots.txt doesn't exist or can't be fetched
        robotsText = undefined;
      }

      const rules: RobotsTestResult['rules'] = [];
      const feedBlockedUserAgents: string[] = [];

      if (robotsText) {
        const robots = robotsParser(robotsUrl, robotsText);

        userAgents.forEach((userAgent) => {
          const isAllowed = robots.isAllowed(feedUrl, userAgent) ?? true;
          const isDisallowed = robots.isDisallowed(feedUrl, userAgent) ?? false;
          const crawlDelay = robots.getCrawlDelay(userAgent);

          rules.push({
            allowed: isAllowed,
            disallowed: isDisallowed,
            crawlDelay,
            userAgent,
          });

          if (isDisallowed) {
            feedBlockedUserAgents.push(userAgent);
          }
        });
      } else {
        // No robots.txt - all agents allowed
        userAgents.forEach((userAgent) => {
          rules.push({
            allowed: true,
            disallowed: false,
            userAgent,
          });
        });
      }

      const feedAllowed = feedBlockedUserAgents.length === 0;

      return {
        robotsUrl,
        robotsText,
        rules,
        feedPath,
        feedAllowed,
        feedBlockedUserAgents,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to test robots.txt');
    }
  }
}

export const robotsTester = new RobotsTester();
