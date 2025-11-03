export interface FeedItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate?: Date;
  guid?: string;
  author?: string;
  categories?: string[];
  image?: string;
  enclosure?: {
    url: string;
    type: string;
    length?: number;
  };
}

export interface FeedMetadata {
  title: string;
  description?: string;
  link: string;
  language?: string;
  copyright?: string;
  managingEditor?: string;
  webMaster?: string;
  pubDate?: Date;
  lastBuildDate?: Date;
  image?: {
    url: string;
    title: string;
    link: string;
    width?: number;
    height?: number;
  };
}

export interface ParsedFeed {
  type: 'rss' | 'atom' | 'json';
  metadata: FeedMetadata;
  items: FeedItem[];
  raw?: string;
}

export interface FeedParseResult {
  success: boolean;
  feed?: ParsedFeed;
  error?: string;
}
