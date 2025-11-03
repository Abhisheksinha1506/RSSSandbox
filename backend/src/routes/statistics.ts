import { Router } from 'express';
import { feedStatisticsService } from '../services/feedStatistics';

const router = Router();

router.post('/statistics', async (req, res) => {
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

    const result = await feedStatisticsService.getFeedStatistics(url);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Statistics error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;

