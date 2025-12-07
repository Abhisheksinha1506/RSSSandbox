import { Router } from 'express';
import { linterService } from '../services/linter';
import { validateUrlInput } from '../utils/urlValidator';

const router = Router();

router.post('/validate', async (req, res) => {
  try {
    const urlValidation = validateUrlInput(req.body.url);
    if (!urlValidation.isValid) {
      return res.status(400).json({ 
        valid: false,
        issues: [{
          severity: 'error',
          message: urlValidation.error || 'Invalid URL',
          suggestion: 'Provide a valid public feed URL. Private/internal IP addresses are not permitted for security reasons.'
        }]
      });
    }

    const url = urlValidation.url!;

    const result = await linterService.lintFeed(url);
    
    return res.json(result);
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      valid: false,
      issues: [{
        severity: 'error',
        message: error instanceof Error ? error.message : 'Internal server error',
        suggestion: 'This is an unexpected server error. Try again in a few moments.'
      }]
    });
  }
});

export default router;