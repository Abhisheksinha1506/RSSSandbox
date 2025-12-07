import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { websocketService } from './services/websocketService';
import { feedParserService } from './services/feedParser';
import { webSubClient } from './services/websubClient';
import { apiRateLimiter, strictRateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket server
websocketService.initialize(server);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Apply general rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
import parseRouter from './routes/parse';
import validateRouter from './routes/validate';
import previewRouter from './routes/preview';
import cacheTestRouter from './routes/cacheTest';
import accessibilityRouter from './routes/accessibility';
import robotsLabRouter from './routes/robotsLab';
import websubRouter from './routes/websub';
import convertRouter from './routes/convert';
import linkCheckRouter from './routes/linkCheck';
import statisticsRouter from './routes/statistics';
import compareRouter from './routes/compare';
import opmlRouter from './routes/opml';

// Register routes
app.use('/api', parseRouter);
app.use('/api', validateRouter);
app.use('/api', previewRouter);
app.use('/api', cacheTestRouter);
app.use('/api', accessibilityRouter);
app.use('/api', robotsLabRouter);
app.use('/api', websubRouter);
app.use('/api', convertRouter);
app.use('/api', linkCheckRouter);
app.use('/api', statisticsRouter);
app.use('/api', compareRouter);
app.use('/api', opmlRouter);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'RSS Developer Suite API',
    version: '0.1.0',
    endpoints: [
      '/api/parse',
      '/api/validate',
      '/api/preview',
      '/api/cache-test',
      '/api/accessibility',
      '/api/robots-test',
      '/api/websub-test',
      '/api/convert',
      '/api/link-check',
      '/api/statistics',
      '/api/compare',
      '/api/opml/generate',
      '/api/opml/parse'
    ]
  });
});

// Global error handlers
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, log and continue
  if (process.env.NODE_ENV === 'production') {
    // In production, log but don't crash
    console.error('Unhandled promise rejection logged. Server continuing...');
  } else {
    // In development, exit to catch issues early
    console.error('Unhandled promise rejection in development. Exiting...');
    gracefulShutdown('unhandledRejection');
  }
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // Uncaught exceptions are more serious, always shutdown gracefully
  gracefulShutdown('uncaughtException');
});

// Graceful shutdown handler
let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  // Close server to stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');

    // Close WebSocket server
    websocketService.close();
    console.log('WebSocket server closed');

    // Cleanup feed parser cache
    feedParserService.destroy();
    console.log('Feed parser cache cleaned up');

    // Cleanup WebSub client subscriptions
    webSubClient.destroy();
    console.log('WebSub client cleaned up');

    console.log('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
