import { Client } from '@line/bot-sdk';
import { MessageRepository } from '../../domain/repositories/MessageRepository';

export class LineMessageAdapter implements MessageRepository {
  private client: Client;

  constructor(config: { channelAccessToken: string; channelSecret: string }) {
    this.client = new Client(config);
  }

  async sendMessage(replyToken: string, text: string): Promise<void> {
    try {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text
      });
      console.log('LINE reply sent successfully');
    } catch (error) {
      console.error('Error sending LINE reply:', error);
      throw new Error('Failed to send LINE reply');
    }
  }
}