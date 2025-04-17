import { Customer } from '../../domain/entities/Customer';
import { Order } from '../../domain/entities/Order';

export interface AiService {
  generateSuggestion(customer: Customer, orders: Order[], message: string): Promise<string>;
}