import { fetchWithHeaders } from '../utils/httpClient';
import { URL } from 'url';

export interface CorsTestResult {
  feedUrl: string;
  headers: {
    'access-control-allow-origin'?: string;
    'access-control-allow-methods'?: string;
    'access-control-allow-headers'?: string;
    'access-control-max-age'?: string;
  };
  corsEnabled: boolean;
  allowsAnyOrigin: boolean;
  allowedMethods: string[];
  allowedHeaders: string[];
  recommendations: string[];
}

export class CorsTester {
  async testCors(feedUrl: string): Promise<CorsTestResult> {
    const recommendations: string[] = [];
    let corsEnabled = false;
    let allowsAnyOrigin = false;

    try {
      const response = await fetchWithHeaders(feedUrl, { method: 'HEAD' });

      const headers = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'] || response.headers['Access-Control-Allow-Origin'],
        'access-control-allow-methods': response.headers['access-control-allow-methods'] || response.headers['Access-Control-Allow-Methods'],
        'access-control-allow-headers': response.headers['access-control-allow-headers'] || response.headers['Access-Control-Allow-Headers'],
        'access-control-max-age': response.headers['access-control-max-age'] || response.headers['Access-Control-Max-Age'],
      };

      if (headers['access-control-allow-origin']) {
        corsEnabled = true;
        if (headers['access-control-allow-origin'] === '*') {
          allowsAnyOrigin = true;
          recommendations.push('⚠️ Using "*" allows all origins. Consider specifying allowed origins for better security.');
        }
      } else {
        recommendations.push('CORS headers not present. This may prevent browser-based feed readers from accessing your feed.');
      }

      const allowedMethods = headers['access-control-allow-methods']
        ? headers['access-control-allow-methods'].split(',').map((m) => m.trim())
        : [];

      const allowedHeaders = headers['access-control-allow-headers']
        ? headers['access-control-allow-headers'].split(',').map((h) => h.trim())
        : [];

      if (!headers['access-control-allow-methods']) {
        recommendations.push('Add Access-Control-Allow-Methods header (e.g., "GET, OPTIONS")');
      }

      if (headers['access-control-max-age']) {
        const maxAge = parseInt(headers['access-control-max-age'], 10);
        if (maxAge < 86400) {
          recommendations.push(`Consider increasing Access-Control-Max-Age (currently ${maxAge}s) for better preflight caching`);
        }
      } else {
        recommendations.push('Consider adding Access-Control-Max-Age header for preflight caching');
      }

      if (recommendations.length === 0) {
        recommendations.push('CORS is properly configured!');
      }

      return {
        feedUrl,
        headers,
        corsEnabled,
        allowsAnyOrigin,
        allowedMethods,
        allowedHeaders,
        recommendations,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to test CORS');
    }
  }
}

export const corsTester = new CorsTester();
