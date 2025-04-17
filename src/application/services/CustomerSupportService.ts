import { Customer } from '../../domain/entities/Customer';
import { Order } from '../../domain/entities/Order';
import { CustomerService } from '../../domain/services/CustomerService';
import { MessageService } from '../../domain/services/MessageService';
import { NotificationService } from '../../domain/services/NotificationService';
import { AiService } from '../ports/AiService';

export class CustomerSupportService {
  constructor(
    private customerService: CustomerService,
    private messageService: MessageService,
    private notificationService: NotificationService,
    private aiService: AiService
  ) {}

  async handleCustomerInquiry(userId: string, message: string, replyToken: string): Promise<void> {
    try {
      // Get customer data
      const { customer, orders } = await this.customerService.getCustomerWithOrders(userId);

      // Send notification to staff with customer data and message
      await this.notificationService.sendNotification(
        userId,
        message,
        customer,
        orders,
        replyToken
      );

      // Send acknowledgment to user
      await this.messageService.sendMessage(
        replyToken,
        'ありがとうございます。担当者に通知しました。'
      );
    } catch (error) {
      console.error('Error handling customer inquiry:', error);
      
      // Send error message to user
      await this.messageService.sendMessage(
        replyToken,
        'メッセージの処理中にエラーが発生しました。しばらくしてからもう一度お試しください。'
      );
    }
  }

  async handleStaffResponse(replyToken: string, responseMessage: string): Promise<void> {
    try {
      // Send the staff's response to the customer
      await this.messageService.sendMessage(replyToken, responseMessage);
    } catch (error) {
      console.error('Error handling staff response:', error);
      throw new Error('Failed to send response to customer');
    }
  }
}