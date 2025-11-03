export interface WebSubHub {
  url: string;
  self: string;
}

export interface WebSubSubscription {
  hub: string;
  topic: string;
  callback: string;
  leaseSeconds?: number;
  secret?: string;
}

export interface WebSubEvent {
  type: 'subscribe' | 'unsubscribe' | 'verify' | 'notification' | 'error';
  timestamp: Date;
  message: string;
  data?: unknown;
}
