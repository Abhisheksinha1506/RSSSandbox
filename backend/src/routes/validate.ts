import { Router } from 'express';
import { linterService } from '../services/linter';

const router = Router();

router.post('/validate', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        valid: false,
        issues: [{
          severity: 'error',
          message: 'Feed URL is required'
        }]
      });
    }

    const result = await linterService.lintFeed(url);
    
    return res.json(result);
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      valid: false,
      issues: [{
        severity: 'error',
        message: error instanceof Error ? error.message : 'Internal server error'
      }]
    });
  }
});

export default router;