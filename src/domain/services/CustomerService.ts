import { Customer } from '../entities/Customer';
import { Order } from '../entities/Order';
import { CustomerRepository } from '../repositories/CustomerRepository';

export class CustomerService {
  constructor(private customerRepository: CustomerRepository) {}

  async getCustomerById(userId: string): Promise<Customer> {
    return this.customerRepository.getCustomerById(userId);
  }

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    return this.customerRepository.getOrdersByCustomerId(customerId);
  }

  async getCustomerWithOrders(userId: string): Promise<{ customer: Customer; orders: Order[] }> {
    const customer = await this.getCustomerById(userId);
    const orders = await this.getOrdersByCustomerId(customer.id);
    return { customer, orders };
  }
}