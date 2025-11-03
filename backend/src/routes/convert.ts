import { Router } from 'express';
import { feedConverterService } from '../services/feedConverter';

const router = Router();

router.post('/convert', async (req, res) => {
  try {
    const { url, targetType } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Feed URL is required' 
      });
    }

    if (!targetType || !['rss', 'atom', 'json'].includes(targetType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Target type must be one of: rss, atom, json' 
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format' 
      });
    }

    const result = await feedConverterService.convertFeed(url, targetType);
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Convert error:', error);
    return res.status(500).json({
      success: false,
      originalType: 'rss',
      targetType: req.body.targetType || 'rss',
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;

