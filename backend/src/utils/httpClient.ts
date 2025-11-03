import fetch from 'node-fetch';

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  ok: boolean;
}

export async function fetchWithHeaders(url: string, options?: {
  method?: 'GET' | 'HEAD' | 'POST';
  headers?: Record<string, string>;
}): Promise<HttpResponse> {
  try {
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: options?.headers || {}
    });

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
