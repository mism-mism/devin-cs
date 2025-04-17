import express from 'express';
import { middleware, WebhookEvent, MessageEvent, TextMessage } from '@line/bot-sdk';
import { CustomerSupportService } from '../../application/services/CustomerSupportService';

export class LineController {
  private router = express.Router();

  constructor(
    private customerSupportService: CustomerSupportService,
    private lineConfig: { channelAccessToken: string; channelSecret: string }
  ) {
    // LINE webhook middleware for validation
    this.router.use(middleware(this.lineConfig));

    // LINE webhook endpoint
    this.router.post('/', this.handleWebhook.bind(this));
  }

  getRouter() {
    return this.router;
  }

  private async handleWebhook(req: express.Request, res: express.Response) {
    try {
      const events: WebhookEvent[] = req.body.events;
      
      // Process each event
      await Promise.all(
        events.map(async (event) => {
          return this.handleEvent(event);
        })
      );
      
      res.status(200).end();
    } catch (error) {
      console.error('Error handling LINE webhook:', error);
      res.status(500).end();
    }
  }

  private async handleEvent(event: WebhookEvent): Promise<void> {
    try {
      // Handle message events
      if (event.type === 'message' && event.message.type === 'text') {
        await this.handleTextMessage(event as MessageEvent & { message: TextMessage });
      }
    } catch (error) {
      console.error('Error in handleEvent:', error);
      throw error;
    }
  }

  private async handleTextMessage(event: MessageEvent & { message: TextMessage }): Promise<void> {
    const { replyToken, source, message } = event;
    const userId = source.userId;
    const text = message.text;

    // If userId is undefined, we can't proceed
    if (!userId) {
      console.error('Error: userId is undefined');
      // This would normally be handled by the MessageService, but we need to handle it here
      // since we can't proceed to the CustomerSupportService without a userId
      return;
    }

    // Delegate to the CustomerSupportService
    await this.customerSupportService.handleCustomerInquiry(userId, text, replyToken);
  }
}