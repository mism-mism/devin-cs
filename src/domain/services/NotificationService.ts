import { Customer } from '../entities/Customer';
import { Order } from '../entities/Order';
import { NotificationRepository, NotificationData } from '../repositories/NotificationRepository';

export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  async sendNotification(
    userId: string,
    message: string,
    customer: Customer,
    orders: Order[],
    replyToken: string
  ): Promise<void> {
    const notificationData: NotificationData = {
      userId,
      message,
      customer,
      orders,
      replyToken
    };
    
    return this.notificationRepository.sendNotification(notificationData);
  }
}