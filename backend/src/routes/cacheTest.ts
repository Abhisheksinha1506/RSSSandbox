import { Router } from 'express';
import { httpCacheTester } from '../services/httpCacheTester';

const router = Router();

router.post('/cache-test', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Feed URL is required' 
      });
    }

    const result = await httpCacheTester.testCache(url);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Cache test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
