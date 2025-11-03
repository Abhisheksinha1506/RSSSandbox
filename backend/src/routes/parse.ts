import { Router } from 'express';
import { feedParserService } from '../services/feedParser';

const router = Router();

router.post('/parse', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Feed URL is required' 
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

    const result = await feedParserService.parseFeed(url);
    
    if (result.success && result.feed) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Parse error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
