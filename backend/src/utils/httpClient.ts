import fetch from 'node-fetch';

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  ok: boolean;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Wrapper for fetch with timeout support using AbortController
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit & { timeout?: number }
): Promise<Response> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const { timeout: _, ...fetchOptions } = options || {};

  // Create AbortController for proper request cancellation
  // AbortController is available natively in Node.js 18+
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    // Clear timeout if request completes successfully
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        throw new Error(`Request timeout: Request to ${url} exceeded ${timeout}ms`);
      }
    }
    throw error;
  }
}

export async function fetchWithHeaders(url: string, options?: {
  method?: 'GET' | 'HEAD' | 'POST';
  headers?: Record<string, string>;
  timeout?: number;
}): Promise<HttpResponse> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

  // Create AbortController for proper request cancellation
  // AbortController is available natively in Node.js 18+
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: options?.headers || {},
      signal: controller.signal
    });

    // Clear timeout if request completes successfully
    clearTimeout(timeoutId);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const body = options?.method === 'HEAD' ? undefined : await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      ok: response.ok
    };
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        throw new Error(`HTTP request timeout: Request to ${url} exceeded ${timeout}ms`);
      }
    }
    
    throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function parseCacheControl(header?: string): Record<string, string | number> {
  const directives: Record<string, string | number> = {};
  
  if (!header) return directives;

  const parts = header.split(',');
  parts.forEach(part => {
    const [key, value] = part.trim().split('=');
    if (key) {
      const cleanKey = key.trim().toLowerCase();
      const cleanValue = value?.trim() || '';
      
      if (cleanValue) {
        // Try to parse as number (max-age, s-maxage, etc.)
        const numValue = parseInt(cleanValue, 10);
        directives[cleanKey] = isNaN(numValue) ? cleanValue : numValue;
      } else {
        directives[cleanKey] = 'true';
      }
    }
  });

  return directives;
}
