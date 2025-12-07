import { Router } from 'express';
import { previewService } from '../services/previewService';
import { validateUrlInput } from '../utils/urlValidator';

const router = Router();

router.post('/preview', async (req, res) => {
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

    const result = await previewService.getPreviewData(url);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to parse feed for preview'
      });
    }

    return res.json({
      success: true,
      data: result.data
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
