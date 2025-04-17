import express from 'express';
import { CustomerSupportService } from '../../application/services/CustomerSupportService';

export class SlackController {
  private router = express.Router();

  constructor(private customerSupportService: CustomerSupportService) {
    // Handle Slack interactive messages
    this.router.post('/interactions', this.handleInteractions.bind(this));
  }

  getRouter() {
    return this.router;
  }

  private async handleInteractions(req: express.Request, res: express.Response) {
    try {
      // Parse the payload from Slack
      const payload = JSON.parse(req.body.payload);
      
      // Handle different types of interactions
      if (payload.type === 'block_actions') {
        // Handle button clicks
        const action = payload.actions[0];
        
        if (action.action_id === 'handle_customer') {
          // Parse the value from the button
          const { replyToken, userId } = JSON.parse(action.value);
          
          // Open a modal to collect the reply message
          await this.openReplyModal(payload.trigger_id, replyToken, userId);
        }
      } else if (payload.type === 'view_submission') {
        // Handle modal submissions
        const { replyToken, userId } = JSON.parse(payload.view.private_metadata);
        const replyMessage = payload.view.state.values.reply_block.reply_action.value;
        
        // Send the reply to the LINE user
        await this.customerSupportService.handleStaffResponse(replyToken, replyMessage);
        
        // Acknowledge the submission
        res.status(200).json({ response_action: 'clear' });
        return;
      }
      
      // Acknowledge the request
      res.status(200).end();
    } catch (error) {
      console.error('Error handling Slack interaction:', error);
      res.status(500).end();
    }
  }

  /**
   * Open a modal in Slack to collect the reply message
   * @param triggerId The trigger ID from Slack
   * @param replyToken The reply token from LINE
   * @param userId The user ID from LINE
   */
  private async openReplyModal(triggerId: string, replyToken: string, userId: string) {
    try {
      // This is a simplified version. In a real implementation, you would use the Slack Web API
      // to open a modal. For now, we'll just log the information.
      console.log('Opening reply modal with:', { triggerId, replyToken, userId });
      
      // In a real implementation, you would do something like:
      /*
      const client = new WebClient(process.env.SLACK_BOT_TOKEN);
      await client.views.open({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          callback_id: 'reply_modal',
          private_metadata: JSON.stringify({ replyToken, userId }),
          title: {
            type: 'plain_text',
            text: 'Reply to Customer'
          },
          submit: {
            type: 'plain_text',
            text: 'Send'
          },
          close: {
            type: 'plain_text',
            text: 'Cancel'
          },
          blocks: [
            {
              type: 'input',
              block_id: 'reply_block',
              label: {
                type: 'plain_text',
                text: 'Your reply'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'reply_action',
                multiline: true
              }
            }
          ]
        }
      });
      */
    } catch (error) {
      console.error('Error opening reply modal:', error);
      throw error;
    }
  }
}