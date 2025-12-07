import { Router } from 'express';
import { feedParserService } from '../services/feedParser';
import { validateUrlInput } from '../utils/urlValidator';

const router = Router();

router.post('/parse', async (req, res) => {
  try {
    const urlValidation = validateUrlInput(req.body.url);

    if (!urlValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: urlValidation.error || 'Invalid URL',
        suggestions: [
          'Provide a valid public feed URL in the request body',
          'Ensure the URL is a string type',
          'Only HTTP and HTTPS URLs are allowed',
          'Private/internal IP addresses are not permitted for security reasons'
        ]
      });
    }

    const url = urlValidation.url!;

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
