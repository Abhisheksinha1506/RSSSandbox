const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data as T;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Network error occurred');
  }
}

export const api = {
  parseFeed: async (url: string) => {
    const data = await apiRequest<{ success: boolean; feed?: unknown; error?: string }>('/parse', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return data;
  },

  validateFeed: async (url: string) => {
    const data = await apiRequest<{ valid: boolean; feedType?: string; issues?: unknown[]; error?: string }>('/validate', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return data;
  },

  previewFeed: async (url: string) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/preview', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return data;
  },

  testCache: async (url: string) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/cache-test', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return data;
  },

  checkAccessibility: async (url: string, fix = false) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/accessibility', {
      method: 'POST',
      body: JSON.stringify({ url, fix }),
    });
    return data;
  },

  testRobots: async (url: string) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/robots-test', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return data;
  },

  testWebSub: async (url: string) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/websub-test', {
      method: 'POST',
      body: JSON.stringify({ url, action: 'discover' }),
    });
    return data;
  },

  convertFeed: async (url: string, targetType: 'rss' | 'atom' | 'json') => {
    const data = await apiRequest<{ success: boolean; convertedFeed?: string; originalType?: string; targetType?: string; error?: string }>('/convert', {
      method: 'POST',
      body: JSON.stringify({ url, targetType }),
    });
    return data;
  },

  checkLinks: async (url: string) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/link-check', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return data;
  },

  getStatistics: async (url: string) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/statistics', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return data;
  },

  compareFeeds: async (url1: string, url2: string) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/compare', {
      method: 'POST',
      body: JSON.stringify({ url1, url2 }),
    });
    return data;
  },

  generateOPML: async (feedUrls: string[]) => {
    const data = await apiRequest<{ success: boolean; opml?: string; error?: string }>('/opml/generate', {
      method: 'POST',
      body: JSON.stringify({ feedUrls }),
    });
    return data;
  },

  parseOPML: async (opmlContent: string) => {
    const data = await apiRequest<{ success: boolean; data?: unknown; error?: string }>('/opml/parse', {
      method: 'POST',
      body: JSON.stringify({ opmlContent }),
    });
    return data;
  },
};