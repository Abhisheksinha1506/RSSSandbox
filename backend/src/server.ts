import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { websocketService } from './services/websocketService';

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

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
