import { Router } from 'express';
import { webSubClient } from '../services/websubClient';
import { URL } from 'url';
import { validateUrlInput } from '../utils/urlValidator';

const router = Router();

// Discover hub
router.post('/websub-test', async (req, res) => {
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

    const { action } = req.body;
    const url = urlValidation.url!;

    if (action === 'discover') {
      const discovery = await webSubClient.discoverHub(url);
      
      return res.json({
        success: discovery.found,
        data: discovery,
        // Include helpful message even when hub is not found (not an error state)
        message: discovery.found 
          ? 'WebSub hub discovered successfully' 
          : 'This feed does not support WebSub. This is normal - WebSub is an optional feature.'
      });
    }

    if (action === 'subscribe') {
      const { hub, topic, callback, leaseSeconds } = req.body;
      
      if (!hub || !topic || !callback) {
        return res.status(400).json({
          success: false,
          error: 'Hub, topic, and callback are required for subscription'
        });
      }

      const subscription = await webSubClient.subscribe(hub, topic, callback, leaseSeconds);
      
      return res.json({
        success: subscription.verified,
        data: subscription
      });
    }

    if (action === 'get-subscription') {
      const subscription = webSubClient.getSubscription(url);
      
      return res.json({
        success: !!subscription,
        data: subscription
      });
    }

    // Default: discover hub
    const discovery = await webSubClient.discoverHub(url);
    
    return res.json({
      success: discovery.found,
      data: discovery
    });
  } catch (error) {
    console.error('WebSub test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// WebSub verification endpoint (for hub to verify subscription)
router.get('/websub/verify', (req, res) => {
  const mode = req.query['hub.mode'];
  const topic = req.query['hub.topic'];
  const challenge = req.query['hub.challenge'];
  const verify = req.query['hub.verify_token'];

  if (mode === 'subscribe' && challenge) {
    // Verify subscription
    res.status(200).send(challenge);
  } else if (mode === 'unsubscribe' && challenge) {
    // Verify unsubscribe
    res.status(200).send(challenge);
  } else {
    res.status(400).json({ error: 'Invalid verification request' });
  }
});

// WebSub notification endpoint (for hub to send content updates)
router.post('/websub/notify', async (req, res) => {
  try {
    const contentType = req.headers['content-type'] || '';
    
    // Acknowledge notification
    res.status(204).send();

    // Note: In a real implementation, you'd process the notification here
    // and notify WebSocket clients
    console.log('WebSub notification received:', {
      contentType,
      topic: req.query['hub.topic'],
    });
  } catch (error) {
    console.error('WebSub notification error:', error);
    res.status(500).json({ error: 'Failed to process notification' });
  }
});

export default router;