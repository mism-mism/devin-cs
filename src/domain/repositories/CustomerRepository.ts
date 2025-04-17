import { Customer } from '../entities/Customer';
import { Order } from '../entities/Order';

export interface CustomerRepository {
  getCustomerById(userId: string): Promise<Customer>;
  getOrdersByCustomerId(customerId: string): Promise<Order[]>;
}