'use client';

import { useState, useEffect } from 'react';
import { FeedInput } from '@/components/common/FeedInput';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Send, Radio } from 'lucide-react';
import { api } from '@/lib/api';

interface WebSubHub {
  url: string;
  self: string;
}

interface WebSubDiscovery {
  hub?: WebSubHub;
  found: boolean;
  error?: string;
}

interface WebSubEvent {
  type: string;
  timestamp: Date;
  message: string;
  data?: unknown;
}

export default function WebSubTestPage() {
  const [discovery, setDiscovery] = useState<WebSubDiscovery | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<WebSubEvent[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('not_subscribed');

  useEffect(() => {
    let websocket: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      // Clean up existing connection
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      
      try {
        websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
          reconnectAttempts = 0; // Reset on successful connection
      setEvents(prev => [...prev, {
        type: 'connection',
        timestamp: new Date(),
            message: 'WebSocket connected successfully'
      }]);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents(prev => [...prev, {
          type: data.type,
          timestamp: new Date(data.timestamp),
          message: data.message,
          data: data.data
        }]);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
          // Don't add error event here - onclose will handle it
        };

        websocket.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          
          // Only show disconnection event if it wasn't a manual close
          if (event.code !== 1000) {
            setEvents(prev => [...prev, {
              type: 'disconnection',
              timestamp: new Date(),
              message: `WebSocket disconnected (code: ${event.code})${event.reason ? ` - ${event.reason}` : ''}`
            }]);

            // Attempt to reconnect if we haven't exceeded max attempts
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
              console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
              
              reconnectTimeout = setTimeout(() => {
                connectWebSocket();
              }, delay);
            } else {
      setEvents(prev => [...prev, {
        type: 'error',
        timestamp: new Date(),
                message: 'WebSocket connection failed after multiple attempts. Please refresh the page.'
      }]);
            }
          }
    };

        setWs(websocket);
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
      setEvents(prev => [...prev, {
          type: 'error',
        timestamp: new Date(),
          message: `Failed to create WebSocket connection: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
      }
    };

    // Initial connection with a small delay to ensure backend is ready
    const initialTimeout = setTimeout(() => {
      connectWebSocket();
    }, 500);

    return () => {
      clearTimeout(initialTimeout);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (websocket) {
        // Use 1000 (Normal Closure) to indicate manual close
        if (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING) {
          websocket.close(1000, 'Component unmounting');
        }
      }
    };
  }, []);

  const handleSubmit = async (url: string) => {
    setLoading(true);
    setError(null);
    setDiscovery(null);
    setEvents([]);

    try {
      const response = await api.testWebSub(url);
      
      // Always set discovery data, even if hub is not found (that's not an error)
      if (response.data) {
      const discoveryData = response.data as WebSubDiscovery;
      setDiscovery(discoveryData);
      
      if (discoveryData.found && discoveryData.hub) {
        setEvents(prev => [...prev, {
          type: 'discovery',
          timestamp: new Date(),
          message: `Hub discovered: ${discoveryData.hub?.url || 'Unknown'}`,
          data: discoveryData.hub
        }]);
        } else {
          // Add informational event when hub is not found
          setEvents(prev => [...prev, {
            type: 'discovery',
            timestamp: new Date(),
            message: 'No WebSub hub found in feed (this is normal - WebSub is optional)',
            data: { url }
          }]);
        }
      } else if (response.error) {
        // Only set error if there was an actual error (network, parsing, etc.)
        setError(response.error);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover WebSub hub');
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!discovery?.hub) return;

    setLoading(true);
    setSubscriptionStatus('subscribing');

    try {
      // Generate callback URL
      const callbackUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/websub/verify`;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/websub-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          hub: discovery.hub.url,
          topic: discovery.hub.self,
          callback: callbackUrl,
          leaseSeconds: 86400
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data.verified) {
        setSubscriptionStatus('subscribed');
        setEvents(prev => [...prev, {
          type: 'subscribe',
          timestamp: new Date(),
          message: 'Subscription request sent',
          data: data.data
        }]);
      } else {
        setSubscriptionStatus('failed');
        setError(data.error || 'Subscription failed');
        setEvents(prev => [...prev, {
          type: 'error',
          timestamp: new Date(),
          message: data.error || 'Subscription failed'
        }]);
      }
      
      setLoading(false);
    } catch (err) {
      setSubscriptionStatus('failed');
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 sm:py-12 px-4 sm:px-6 max-w-7xl">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          WebSub Hub Tester
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Verify and debug WebSub (PubSubHubbub) publisher/subscriber flows.
        </p>
      </div>

      <div className="mb-4 sm:mb-6">
        <FeedInput onSubmit={handleSubmit} isLoading={loading} />
      </div>

      {loading && <LoadingState message="Discovering WebSub hub..." />}

      {error && !discovery && <ErrorDisplay error={error} />}

      {discovery && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hub Discovery</CardTitle>
                {discovery.found ? (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Hub Found
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    No Hub Found
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {discovery.found && discovery.hub ? (
                <>
                  <div>
                    <p className="text-sm font-medium mb-1">Hub URL:</p>
                    <p className="text-sm font-mono text-muted-foreground">{discovery.hub.url}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Topic (Self URL):</p>
                    <p className="text-sm font-mono text-muted-foreground">{discovery.hub.self}</p>
                  </div>
                  <Button onClick={handleSubscribe} disabled={loading || subscriptionStatus === 'subscribed'}>
                    <Send className="h-4 w-4 mr-2" />
                    Subscribe to Hub
                  </Button>
                  {subscriptionStatus === 'subscribing' && (
                    <p className="text-sm text-muted-foreground">Subscribing to hub...</p>
                  )}
                  {subscriptionStatus === 'subscribed' && (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Subscribed
                    </Badge>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="font-medium">No WebSub hub found</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                    <p className="mb-2">{discovery.error || 'This feed does not support WebSub (PubSubHubbub).'}</p>
                    <p className="text-xs">
                      <strong>Note:</strong> This is completely normal. WebSub is an optional feature that enables real-time feed updates. 
                      Most feeds do not support WebSub. You can still use all other tools (parsing, validation, preview, caching, etc.) 
                      with this feed.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg sm:text-xl">Event Log</CardTitle>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  <Radio className="h-3 w-3 mr-1" />
                  {ws?.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                Real-time WebSub events and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-auto">
                {events.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">No events yet...</p>
                ) : (
                  events.map((event, index) => (
                    <div key={index} className="flex gap-2 sm:gap-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        {event.type === 'error' ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : event.type === 'subscribe' ? (
                          <Send className="h-4 w-4 text-blue-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs sm:text-sm w-fit">{event.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm break-words">{event.message}</p>
                        {event.data ? (
                          <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-auto">
                            {String(JSON.stringify(event.data as Record<string, unknown>, null, 2))}
                          </pre>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
