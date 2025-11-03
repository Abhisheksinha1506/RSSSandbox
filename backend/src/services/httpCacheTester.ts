import { fetchWithHeaders, parseCacheControl } from '../utils/httpClient';

export interface CacheTestResult {
  url: string;
  headers: {
    etag?: string;
    lastModified?: string;
    cacheControl?: string;
    expires?: string;
  };
  cacheControlDirectives: Record<string, string | number>;
  conditionalGet: {
    etagTest?: {
      status: number;
      responseTime: number;
      cached: boolean;
    };
    lastModifiedTest?: {
      status: number;
      responseTime: number;
      cached: boolean;
    };
  };
  recommendations: string[];
  cacheable: boolean;
}

export class HttpCacheTester {
  async testCache(url: string): Promise<CacheTestResult> {
    const recommendations: string[] = [];
    let cacheable = false;

    // Initial request
    const initialRequest = await fetchWithHeaders(url, { method: 'HEAD' });
    
    const headers = {
      etag: initialRequest.headers['etag'] || initialRequest.headers['ETag'],
      lastModified: initialRequest.headers['last-modified'] || initialRequest.headers['Last-Modified'],
      cacheControl: initialRequest.headers['cache-control'] || initialRequest.headers['Cache-Control'],
      expires: initialRequest.headers['expires'] || initialRequest.headers['Expires'],
    };

    const cacheControlDirectives = parseCacheControl(headers.cacheControl || '');

    // Check if cacheable
    if (headers.etag || headers.lastModified) {
      cacheable = true;
    }

    if (cacheControlDirectives['no-cache']) {
      cacheable = false;
      recommendations.push('Consider removing "no-cache" directive if you want clients to cache your feed');
    }

    if (cacheControlDirectives['no-store']) {
      cacheable = false;
      recommendations.push('The "no-store" directive prevents all caching');
    }

    if (cacheControlDirectives['max-age']) {
      cacheable = true;
      const maxAge = cacheControlDirectives['max-age'];
      if (typeof maxAge === 'number' && maxAge < 300) {
        recommendations.push(`Consider increasing max-age (currently ${maxAge}s) for better caching`);
      }
    } else if (!headers.etag && !headers.lastModified) {
      recommendations.push('Add Cache-Control with max-age directive for better caching');
    }

    if (!headers.etag && !headers.lastModified) {
      recommendations.push('Consider adding ETag or Last-Modified header for conditional GET support');
    }

    // Test conditional GET with ETag
    let etagTest;
    if (headers.etag) {
      const startTime = Date.now();
      const etagResponse = await fetchWithHeaders(url, {
        method: 'GET',
        headers: {
          'If-None-Match': headers.etag,
        },
      });
      const responseTime = Date.now() - startTime;
      
      etagTest = {
        status: etagResponse.status,
        responseTime,
        cached: etagResponse.status === 304,
      };

      if (etagResponse.status !== 304) {
        recommendations.push('ETag header present but conditional GET did not return 304 Not Modified');
      }
    } else {
      recommendations.push('Add ETag header to enable conditional GET requests');
    }

    // Test conditional GET with Last-Modified
    let lastModifiedTest;
    if (headers.lastModified) {
      const startTime = Date.now();
      const lastModifiedResponse = await fetchWithHeaders(url, {
        method: 'GET',
        headers: {
          'If-Modified-Since': headers.lastModified,
        },
      });
      const responseTime = Date.now() - startTime;
      
      lastModifiedTest = {
        status: lastModifiedResponse.status,
        responseTime,
        cached: lastModifiedResponse.status === 304,
      };

      if (lastModifiedResponse.status !== 304) {
        recommendations.push('Last-Modified header present but conditional GET did not return 304 Not Modified');
      }
    } else {
      recommendations.push('Add Last-Modified header to enable conditional GET requests');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your feed is well-configured for HTTP caching!');
    }

    return {
      url,
      headers,
      cacheControlDirectives,
      conditionalGet: {
        etagTest,
        lastModifiedTest,
      },
      recommendations,
      cacheable,
    };
  }
}

export const httpCacheTester = new HttpCacheTester();
