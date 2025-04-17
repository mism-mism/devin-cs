import { Customer } from '../../domain/entities/Customer';
import { Order } from '../../domain/entities/Order';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { OrderItem } from '../../domain/entities/OrderItem';

export class MockCustomerRepository implements CustomerRepository {
  async getCustomerById(userId: string): Promise<Customer> {
    return this.generateMockCustomerData(userId);
  }

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    // Extract userId from customerId (assuming format CUST-XXXXXX)
    const userId = customerId.replace('CUST-', '');
    return this.generateMockOrderData(userId);
  }

  private generateMockCustomerData(userId: string): Customer {
    // Generate deterministic data based on userId
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const membershipLevels = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const membershipLevel = membershipLevels[hash % membershipLevels.length];
    
    // Generate a date in the past (1-365 days ago)
    const getRandomPastDate = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() - (hash % days));
      return date.toISOString().split('T')[0];
    };
    
    return {
      id: `CUST-${hash.toString().padStart(6, '0')}`,
      name: `顧客 ${hash % 1000}`,
      email: `customer${hash % 1000}@example.com`,
      phone: `090-${Math.floor(1000 + hash % 9000)}-${Math.floor(1000 + (hash * 2) % 9000)}`,
      address: `東京都渋谷区代々木${hash % 10}-${hash % 100}-${hash % 1000}`,
      membershipLevel,
      registrationDate: getRandomPastDate(365),
      lastPurchaseDate: getRandomPastDate(30)
    };
  }

  private generateMockOrderData(userId: string): Order[] {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const customerData = this.generateMockCustomerData(userId);
    
    // Generate 1-5 orders
    const orderCount = (hash % 5) + 1;
    const orders: Order[] = [];
    
    const statuses = ['配送中', '処理中', '完了', 'キャンセル'];
    const productNames = ['商品A', '商品B', '商品C', '商品D', '商品E'];
    
    for (let i = 0; i < orderCount; i++) {
      const itemCount = (hash % 3) + 1;
      const items: OrderItem[] = [];
      let totalAmount = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const price = 1000 + ((hash + j) % 10) * 500;
        const quantity = ((hash + j) % 3) + 1;
        totalAmount += price * quantity;
        
        items.push({
          id: `ITEM-${(hash + j).toString().padStart(6, '0')}`,
          name: productNames[(hash + j) % productNames.length],
          price,
          quantity
        });
      }
      
      // Generate a date in the past (1-30 days ago)
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - ((hash + i) % 30));
      
      orders.push({
        id: `ORDER-${(hash + i).toString().padStart(6, '0')}`,
        customerId: customerData.id,
        orderDate: orderDate.toISOString().split('T')[0],
        status: statuses[(hash + i) % statuses.length],
        items,
        totalAmount
      });
    }
    
    return orders;
  }
}