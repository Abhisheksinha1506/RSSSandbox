import { Router } from 'express';
import { feedComparatorService } from '../services/feedComparator';

const router = Router();

router.post('/compare', async (req, res) => {
  try {
    const { url1, url2 } = req.body;

    if (!url1 || typeof url1 !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Feed 1 URL is required' 
      });
    }

    if (!url2 || typeof url2 !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Feed 2 URL is required' 
      });
    }

    // Basic URL validation
    try {
      new URL(url1);
      new URL(url2);
    } catch {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format' 
      });
    }

    const result = await feedComparatorService.compareFeeds(url1, url2);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Compare error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;

