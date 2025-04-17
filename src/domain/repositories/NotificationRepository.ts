import { Customer } from '../entities/Customer';
import { Order } from '../entities/Order';
import { Message } from '../entities/Message';

export interface NotificationData {
  userId: string;
  message: string;
  customer: Customer;
  orders: Order[];
  replyToken: string;
}

export interface NotificationRepository {
  sendNotification(data: NotificationData): Promise<void>;
}