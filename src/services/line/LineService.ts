import { Client, WebhookEvent, MessageEvent, TextMessage } from '@line/bot-sdk';
import { lineConfig } from '../../config/lineConfig';
import { getMockCustomerData } from '../mockMcpService';
import { sendSlackNotification } from '../slackService';

/**
 * Service for handling LINE messaging functionality
 */
export class LineService {
  private client: Client;

  /**
   * Create a new LineService instance
   * @param config Optional LINE client configuration (uses default from lineConfig if not provided)
   */
  constructor(config = lineConfig) {
    this.client = new Client(config);
  }

  /**
   * Send a reply to a LINE user
   * @param replyToken The reply token from LINE
   * @param message The message to send
   */
  async sendReply(replyToken: string, message: string): Promise<void> {
    try {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: message
      });
      console.log('LINE reply sent successfully');
    } catch (error) {
      console.error('Error sending LINE reply:', error);
      throw new Error('Failed to send LINE reply');
    }
  }

  /**
   * Handle LINE webhook events
   * @param event The webhook event from LINE
   */
  async handleEvent(event: WebhookEvent): Promise<void> {
    try {
      // Handle message events
      if (event.type === 'message' && event.message.type === 'text') {
        await this.handleTextMessage(event as MessageEvent & { message: TextMessage });
      }
    } catch (error) {
      console.error('Error in handleLineEvent:', error);
      throw error;
    }
  }

  /**
   * Handle text messages from LINE
   * @param event The message event from LINE
   */
  private async handleTextMessage(event: MessageEvent & { message: TextMessage }): Promise<void> {
    const { replyToken, source, message } = event;
    const userId = source.userId;
    const text = message.text;

    // If userId is undefined, we can't proceed
    if (!userId) {
      console.error('Error: userId is undefined');
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: 'エラーが発生しました。しばらくしてからもう一度お試しください。'
      });
      return;
    }

    try {
      // Get customer data from mock MCP server
      const customerData = await getMockCustomerData(userId);

      // Send notification to Slack with customer data and message
      await sendSlackNotification({
        userId,
        message: text,
        customerData,
        replyToken
      });

      // Send acknowledgment to user
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: 'ありがとうございます。担当者に通知しました。'
      });
    } catch (error) {
      console.error('Error handling text message:', error);

      // Send error message to user
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: 'メッセージの処理中にエラーが発生しました。しばらくしてからもう一度お試しください。'
      });
    }
  }
}

// Create a default instance for backward compatibility
const defaultLineService = new LineService();

// Export methods from the default instance for backward compatibility
export const sendLineReply = (replyToken: string, message: string): Promise<void> => 
  defaultLineService.sendReply(replyToken, message);

export const handleLineEvent = (event: WebhookEvent): Promise<void> => 
  defaultLineService.handleEvent(event);