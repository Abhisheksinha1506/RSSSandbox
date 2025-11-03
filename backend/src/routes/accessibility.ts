import { Router } from 'express';
import { accessibilityChecker } from '../services/accessibilityChecker';
import { feedModifier } from '../services/feedModifier';

const router = Router();

router.post('/accessibility', async (req, res) => {
  try {
    const { url, fix } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Feed URL is required' 
      });
    }

    if (fix) {
      // Return modified feed
      const modified = await feedModifier.addAltText(url);
      return res.json({
        success: true,
        data: modified
      });
    } else {
      // Return accessibility check results
      const result = await accessibilityChecker.checkAccessibility(url);
      return res.json({
        success: true,
        data: result
      });
    }
  } catch (error) {
    console.error('Accessibility check error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
