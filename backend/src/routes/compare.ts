import { Router } from 'express';
import { feedComparatorService } from '../services/feedComparator';
import { validateUrlInput } from '../utils/urlValidator';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply stricter rate limiting to resource-intensive endpoint
router.use('/compare', strictRateLimiter);

router.post('/compare', async (req, res) => {
  try {
    const url1Validation = validateUrlInput(req.body.url1);
    if (!url1Validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: url1Validation.error || 'Invalid URL 1',
        suggestions: [
          'Provide a valid public feed URL for url1',
          'Only HTTP and HTTPS URLs are allowed',
          'Private/internal IP addresses are not permitted for security reasons'
        ]
      });
    }

    const url2Validation = validateUrlInput(req.body.url2);
    if (!url2Validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: url2Validation.error || 'Invalid URL 2',
        suggestions: [
          'Provide a valid public feed URL for url2',
          'Only HTTP and HTTPS URLs are allowed',
          'Private/internal IP addresses are not permitted for security reasons'
        ]
      });
    }

    const url1 = url1Validation.url!;
    const url2 = url2Validation.url!;

    const result = await feedComparatorService.compareFeeds(url1, url2);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Compare error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      suggestions: [
        'This is an unexpected server error',
        'Try again in a few moments',
        'If the problem persists, check both feed URLs and try different feeds'
      ]
    });
  }
});

export default router;

