import { Router } from 'express';
import { accessibilityChecker } from '../services/accessibilityChecker';
import { feedModifier } from '../services/feedModifier';
import { validateUrlInput } from '../utils/urlValidator';

const router = Router();

router.post('/accessibility', async (req, res) => {
  try {
    const urlValidation = validateUrlInput(req.body.url);
    if (!urlValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: urlValidation.error || 'Invalid URL',
        suggestions: [
          'Provide a valid public feed URL',
          'Only HTTP and HTTPS URLs are allowed',
          'Private/internal IP addresses are not permitted for security reasons'
        ]
      });
    }

    const { fix } = req.body;
    const url = urlValidation.url!;

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
      error: error instanceof Error ? error.message : 'Internal server error',
      suggestions: [
        'This is an unexpected server error',
        'Try again in a few moments',
        'If the problem persists, check the feed URL and try a different feed'
      ]
    });
  }
});

export default router;
