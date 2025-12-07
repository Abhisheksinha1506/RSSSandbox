import { Router } from 'express';
import { feedConverterService } from '../services/feedConverter';
import { validateUrlInput } from '../utils/urlValidator';

const router = Router();

router.post('/convert', async (req, res) => {
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

    const { targetType } = req.body;

    if (!targetType || !['rss', 'atom', 'json'].includes(targetType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Target type must be one of: rss, atom, json',
        suggestions: [
          'Specify targetType as "rss", "atom", or "json"',
          'Ensure the targetType matches one of the supported formats'
        ]
      });
    }

    const url = urlValidation.url!;

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

