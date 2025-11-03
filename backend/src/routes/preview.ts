import { Router } from 'express';
import { previewService } from '../services/previewService';

const router = Router();

router.post('/preview', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Feed URL is required' 
      });
    }

    const previewData = await previewService.getPreviewData(url);
    
    if (!previewData) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse feed for preview'
      });
    }

    return res.json({
      success: true,
      data: previewData
    });
  } catch (error) {
    console.error('Preview error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
