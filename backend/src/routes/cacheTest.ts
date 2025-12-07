import { Router } from 'express';
import { httpCacheTester } from '../services/httpCacheTester';
import { validateUrlInput } from '../utils/urlValidator';

const router = Router();

router.post('/cache-test', async (req, res) => {
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

    const url = urlValidation.url!;

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
