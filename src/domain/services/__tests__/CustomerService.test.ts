import { CustomerService } from '../CustomerService';
import { CustomerRepository } from '../../repositories/CustomerRepository';
import { Customer } from '../../entities/Customer';
import { Order } from '../../entities/Order';

describe('CustomerService', () => {
  // Mock CustomerRepository
  const mockCustomerRepository: jest.Mocked<CustomerRepository> = {
    getCustomerById: jest.fn(),
    getOrdersByCustomerId: jest.fn()
  };

  // Sample data
  const sampleCustomer: Customer = {
    id: 'CUST-123456',
    name: '顧客 123',
    email: 'customer123@example.com',
    phone: '090-1234-5678',
    address: '東京都渋谷区代々木1-2-3',
    membershipLevel: 'Gold',
    registrationDate: '2023-01-01',
    lastPurchaseDate: '2023-04-01'
  };

  const sampleOrders: Order[] = [
    {
      id: 'ORDER-123456',
      customerId: 'CUST-123456',
      orderDate: '2023-04-01',
      status: '完了',
      items: [
        {
          id: 'ITEM-123456',
          name: '商品A',
          price: 1500,
          quantity: 2
        }
      ],
      totalAmount: 3000
    }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getCustomerById', () => {
    it('should return a customer by ID', async () => {
      // Arrange
      mockCustomerRepository.getCustomerById.mockResolvedValue(sampleCustomer);
      const customerService = new CustomerService(mockCustomerRepository);

      // Act
      const result = await customerService.getCustomerById('user123');

      // Assert
      expect(result).toEqual(sampleCustomer);
      expect(mockCustomerRepository.getCustomerById).toHaveBeenCalledWith('user123');
    });
  });

  describe('getOrdersByCustomerId', () => {
    it('should return orders by customer ID', async () => {
      // Arrange
      mockCustomerRepository.getOrdersByCustomerId.mockResolvedValue(sampleOrders);
      const customerService = new CustomerService(mockCustomerRepository);

      // Act
      const result = await customerService.getOrdersByCustomerId('CUST-123456');

      // Assert
      expect(result).toEqual(sampleOrders);
      expect(mockCustomerRepository.getOrdersByCustomerId).toHaveBeenCalledWith('CUST-123456');
    });
  });

  describe('getCustomerWithOrders', () => {
    it('should return customer and orders', async () => {
      // Arrange
      mockCustomerRepository.getCustomerById.mockResolvedValue(sampleCustomer);
      mockCustomerRepository.getOrdersByCustomerId.mockResolvedValue(sampleOrders);
      const customerService = new CustomerService(mockCustomerRepository);

      // Act
      const result = await customerService.getCustomerWithOrders('user123');

      // Assert
      expect(result).toEqual({
        customer: sampleCustomer,
        orders: sampleOrders
      });
      expect(mockCustomerRepository.getCustomerById).toHaveBeenCalledWith('user123');
      expect(mockCustomerRepository.getOrdersByCustomerId).toHaveBeenCalledWith('CUST-123456');
    });
  });
});