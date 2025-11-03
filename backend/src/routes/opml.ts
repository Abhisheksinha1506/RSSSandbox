import { Router } from 'express';
import { opmlGeneratorService } from '../services/opmlGenerator';

const router = Router();

router.post('/opml/generate', async (req, res) => {
  try {
    const { feedUrls } = req.body;

    if (!feedUrls || !Array.isArray(feedUrls) || feedUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one feed URL is required' 
      });
    }

    // Validate URLs
    feedUrls.forEach((url: string) => {
      try {
        new URL(url);
      } catch {
        throw new Error(`Invalid URL: ${url}`);
      }
    });

    const opml = await opmlGeneratorService.generateOPML(feedUrls);
    
    return res.json({
      success: true,
      opml
    });
  } catch (error) {
    console.error('OPML generate error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/opml/parse', async (req, res) => {
  try {
    const { opmlContent } = req.body;

    if (!opmlContent || typeof opmlContent !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'OPML content is required' 
      });
    }

    const result = await opmlGeneratorService.parseOPML(opmlContent);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('OPML parse error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;

