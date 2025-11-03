import { Router } from 'express';
import { headersLab } from '../services/headersLab';

const router = Router();

router.post('/robots-test', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Feed URL is required' 
      });
    }

    const result = await headersLab.testAll(url);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Robots test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
