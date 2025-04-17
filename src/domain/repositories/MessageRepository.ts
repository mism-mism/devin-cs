import { Message } from '../entities/Message';

export interface MessageRepository {
  sendMessage(replyToken: string, text: string): Promise<void>;
}