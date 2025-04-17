import { Message } from '../entities/Message';
import { MessageRepository } from '../repositories/MessageRepository';

export class MessageService {
  constructor(private messageRepository: MessageRepository) {}

  async sendMessage(replyToken: string, text: string): Promise<void> {
    return this.messageRepository.sendMessage(replyToken, text);
  }
}