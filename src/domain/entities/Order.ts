import { OrderItem } from './OrderItem';

export interface Order {
  id: string;
  customerId: string;
  orderDate: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
}