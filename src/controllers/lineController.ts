import express from 'express';
import { middleware, WebhookEvent } from '@line/bot-sdk';
import { lineConfig } from '../config/lineConfig';
import { handleLineEvent } from '../services/lineService';

const router = express.Router();

// LINE webhook middleware for validation
router.use(middleware(lineConfig));

// LINE webhook endpoint
router.post('/', async (req, res) => {
  try {
    const events: WebhookEvent[] = req.body.events;
    
    // Process each event
    await Promise.all(
      events.map(async (event) => {
        return handleLineEvent(event);
      })
    );
    
    res.status(200).end();
  } catch (error) {
    console.error('Error handling LINE webhook:', error);
    res.status(500).end();
  }
});

export const lineRouter = router;