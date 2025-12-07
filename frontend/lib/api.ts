const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiRequestOptions extends RequestInit {
  signal?: AbortSignal;
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: options.signal,
    });

    let data;
    try {
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response body');
      }
      data = JSON.parse(text);
    } catch (parseError) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      throw new Error('Failed to parse response as JSON');
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data as T;
  } catch (error) {
    // Don't throw error if request was aborted
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw error instanceof Error ? error : new Error('Network error occurred');
  }
}

export const api = {
  parseFeed: async (url: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; feed?: unknown; error?: string }>('/parse', {
      method: 'POST',
      body: JSON.stringify({ url }),
      signal,
    });
    return data;
  },

  validateFeed: async (url: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ valid: boolean; feedType?: string; issues?: unknown[]; error?: string }>('/validate', {
      method: 'POST',
      body: JSON.stringify({ url }),
      signal,
    });
    return data;
  },

  previewFeed: async (url: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/preview', {
      method: 'POST',
      body: JSON.stringify({ url }),
      signal,
    });
    return data;
  },

  testCache: async (url: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/cache-test', {
      method: 'POST',
      body: JSON.stringify({ url }),
      signal,
    });
    return data;
  },

  checkAccessibility: async (url: string, fix = false, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/accessibility', {
      method: 'POST',
      body: JSON.stringify({ url, fix }),
      signal,
    });
    return data;
  },

  testRobots: async (url: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/robots-test', {
      method: 'POST',
      body: JSON.stringify({ url }),
      signal,
    });
    return data;
  },

  testWebSub: async (url: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/websub-test', {
      method: 'POST',
      body: JSON.stringify({ url, action: 'discover' }),
      signal,
    });
    return data;
  },

  subscribeWebSub: async (hub: string, topic: string, callback: string, leaseSeconds?: number, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/websub-test', {
      method: 'POST',
      body: JSON.stringify({
        action: 'subscribe',
        hub,
        topic,
        callback,
        leaseSeconds: leaseSeconds || 86400,
      }),
      signal,
    });
    return data;
  },

  convertFeed: async (url: string, targetType: 'rss' | 'atom' | 'json', signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; convertedFeed?: string; originalType?: string; targetType?: string; error?: string }>('/convert', {
      method: 'POST',
      body: JSON.stringify({ url, targetType }),
      signal,
    });
    return data;
  },

  checkLinks: async (url: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/link-check', {
      method: 'POST',
      body: JSON.stringify({ url }),
      signal,
    });
    return data;
  },

  getStatistics: async (url: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/statistics', {
      method: 'POST',
      body: JSON.stringify({ url }),
      signal,
    });
    return data;
  },

  compareFeeds: async (url1: string, url2: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/compare', {
      method: 'POST',
      body: JSON.stringify({ url1, url2 }),
      signal,
    });
    return data;
  },

  generateOPML: async (feedUrls: string[], signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; opml?: string; error?: string }>('/opml/generate', {
      method: 'POST',
      body: JSON.stringify({ feedUrls }),
      signal,
    });
    return data;
  },

  parseOPML: async (opmlContent: string, signal?: AbortSignal) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/opml/parse', {
      method: 'POST',
      body: JSON.stringify({ opmlContent }),
      signal,
    });
    return data;
  },
};