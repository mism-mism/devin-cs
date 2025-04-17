import { MockCustomerRepository } from '../MockCustomerRepository';
import { Customer } from '../../../domain/entities/Customer';
import { Order } from '../../../domain/entities/Order';

describe('MockCustomerRepository', () => {
  let mockCustomerRepository: MockCustomerRepository;

  beforeEach(() => {
    mockCustomerRepository = new MockCustomerRepository();
  });

  describe('getCustomerById', () => {
    it('should return a customer with the expected structure', async () => {
      // Act
      const customer = await mockCustomerRepository.getCustomerById('user123');

      // Assert
      expect(customer).toBeDefined();
      expect(customer.id).toMatch(/^CUST-\d{6}$/);
      expect(customer.name).toMatch(/^顧客 \d+$/);
      expect(customer.email).toMatch(/^customer\d+@example\.com$/);
      expect(customer.phone).toMatch(/^090-\d{4}-\d{4}$/);
      expect(customer.address).toMatch(/^東京都渋谷区代々木\d+-\d+-\d+$/);
      expect(['Bronze', 'Silver', 'Gold', 'Platinum']).toContain(customer.membershipLevel);
      expect(customer.registrationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(customer.lastPurchaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return consistent data for the same user ID', async () => {
      // Act
      const customer1 = await mockCustomerRepository.getCustomerById('user123');
      const customer2 = await mockCustomerRepository.getCustomerById('user123');

      // Assert
      expect(customer1).toEqual(customer2);
    });

    it('should return different data for different user IDs', async () => {
      // Act
      const customer1 = await mockCustomerRepository.getCustomerById('user123');
      const customer2 = await mockCustomerRepository.getCustomerById('user456');

      // Assert
      expect(customer1).not.toEqual(customer2);
    });
  });

  describe('getOrdersByCustomerId', () => {
    it('should return orders with the expected structure', async () => {
      // Arrange
      const customer = await mockCustomerRepository.getCustomerById('user123');

      // Act
      const orders = await mockCustomerRepository.getOrdersByCustomerId(customer.id);

      // Assert
      expect(orders).toBeDefined();
      expect(orders.length).toBeGreaterThan(0);
      expect(orders.length).toBeLessThanOrEqual(5);

      const order = orders[0];
      expect(order.id).toMatch(/^ORDER-\d{6}$/);
      expect(order.customerId).toBe(customer.id);
      expect(order.orderDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['配送中', '処理中', '完了', 'キャンセル']).toContain(order.status);
      expect(order.items).toBeDefined();
      expect(order.items.length).toBeGreaterThan(0);
      expect(order.totalAmount).toBeGreaterThan(0);

      const item = order.items[0];
      expect(item.id).toMatch(/^ITEM-\d{6}$/);
      expect(item.name).toMatch(/^商品[A-E]$/);
      expect(item.price).toBeGreaterThan(0);
      expect(item.quantity).toBeGreaterThan(0);
    });

    it('should return consistent data for the same customer ID', async () => {
      // Arrange
      const customer = await mockCustomerRepository.getCustomerById('user123');

      // Act
      const orders1 = await mockCustomerRepository.getOrdersByCustomerId(customer.id);
      const orders2 = await mockCustomerRepository.getOrdersByCustomerId(customer.id);

      // Assert
      expect(orders1).toEqual(orders2);
    });

    it('should return different data for different customer IDs', async () => {
      // Arrange
      const customer1 = await mockCustomerRepository.getCustomerById('user123');
      const customer2 = await mockCustomerRepository.getCustomerById('user456');

      // Act
      const orders1 = await mockCustomerRepository.getOrdersByCustomerId(customer1.id);
      const orders2 = await mockCustomerRepository.getOrdersByCustomerId(customer2.id);

      // Assert
      expect(orders1).not.toEqual(orders2);
    });

    it('should generate orders with correct total amount', async () => {
      // Arrange
      const customer = await mockCustomerRepository.getCustomerById('user123');

      // Act
      const orders = await mockCustomerRepository.getOrdersByCustomerId(customer.id);

      // Assert
      for (const order of orders) {
        const calculatedTotal = order.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        expect(order.totalAmount).toBe(calculatedTotal);
      }
    });
  });
});