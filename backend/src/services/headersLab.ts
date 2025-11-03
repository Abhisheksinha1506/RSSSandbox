import { robotsTester } from './robotsTester';
import { corsTester } from './corsTester';
import { fetchWithHeaders } from '../utils/httpClient';

export interface HeadersLabResult {
  robots: Awaited<ReturnType<typeof robotsTester.testRobots>>;
  cors: Awaited<ReturnType<typeof corsTester.testCors>>;
  httpHeaders: Record<string, string>;
  recommendations: string[];
}

export class HeadersLab {
  async testAll(url: string): Promise<HeadersLabResult> {
    const recommendations: string[] = [];

    // Test robots.txt
    const robots = await robotsTester.testRobots(url);
    if (!robots.feedAllowed) {
      recommendations.push(`⚠️ Feed is blocked for: ${robots.feedBlockedUserAgents.join(', ')}`);
    }

    // Test CORS
    const cors = await corsTester.testCors(url);
    if (!cors.corsEnabled) {
      recommendations.push('⚠️ CORS is not enabled. Browser-based readers may have issues accessing your feed.');
    }

    // Get all HTTP headers
    const httpResponse = await fetchWithHeaders(url, { method: 'HEAD' });
    const httpHeaders: Record<string, string> = {};
    Object.keys(httpResponse.headers).forEach((key) => {
      httpHeaders[key.toLowerCase()] = httpResponse.headers[key];
    });

    // Additional recommendations based on headers
    if (!httpHeaders['x-content-type-options']) {
      recommendations.push('Consider adding X-Content-Type-Options: nosniff header');
    }

    if (!httpHeaders['x-frame-options']) {
      recommendations.push('Consider adding X-Frame-Options header for security');
    }

    recommendations.push(...cors.recommendations);

    return {
      robots,
      cors,
      httpHeaders,
      recommendations: [...new Set(recommendations)], // Remove duplicates
    };
  }
}

export const headersLab = new HeadersLab();
