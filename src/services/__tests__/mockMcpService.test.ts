import axios from 'axios';
import { generateMockCustomerData, generateMockOrderData, getMockCustomerData } from '../mockMcpService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('mockMcpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMockCustomerData', () => {
    it('should generate deterministic customer data based on userId', () => {
      // Arrange
      const userId = 'test-user-123';
      
      // Act
      const result = generateMockCustomerData(userId);
      
      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
        phone: expect.any(String),
        address: expect.any(String),
        membershipLevel: expect.any(String),
        registrationDate: expect.any(String),
        lastPurchaseDate: expect.any(String)
      }));
      
      // Verify deterministic behavior
      const secondResult = generateMockCustomerData(userId);
      expect(result).toEqual(secondResult);
      
      // Different userId should produce different data
      const differentResult = generateMockCustomerData('different-user');
      expect(result).not.toEqual(differentResult);
    });
    
    it('should generate valid membership level', () => {
      // Arrange
      const userId = 'test-user-123';
      
      // Act
      const result = generateMockCustomerData(userId);
      
      // Assert
      expect(['Bronze', 'Silver', 'Gold', 'Platinum']).toContain(result.membershipLevel);
    });
    
    it('should generate valid dates', () => {
      // Arrange
      const userId = 'test-user-123';
      
      // Act
      const result = generateMockCustomerData(userId);
      
      // Assert
      // Check date format (YYYY-MM-DD)
      expect(result.registrationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.lastPurchaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Registration date should be in the past
      const registrationDate = new Date(result.registrationDate);
      expect(registrationDate).toBeBefore(new Date());
      
      // Last purchase date should be in the past
      const lastPurchaseDate = new Date(result.lastPurchaseDate);
      expect(lastPurchaseDate).toBeBefore(new Date());
    });
  });
  
  describe('generateMockOrderData', () => {
    it('should generate order data based on userId', () => {
      // Arrange
      const userId = 'test-user-123';
      
      // Act
      const result = generateMockOrderData(userId);
      
      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5); // 1-5 orders
      
      // Check order structure
      result.forEach(order => {
        expect(order).toEqual(expect.objectContaining({
          id: expect.any(String),
          customerId: expect.any(String),
          orderDate: expect.any(String),
          status: expect.any(String),
          items: expect.any(Array),
          totalAmount: expect.any(Number)
        }));
        
        // Check items
        expect(order.items.length).toBeGreaterThan(0);
        order.items.forEach(item => {
          expect(item).toEqual(expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            price: expect.any(Number),
            quantity: expect.any(Number)
          }));
        });
      });
    });
    
    it('should generate deterministic order data', () => {
      // Arrange
      const userId = 'test-user-123';
      
      // Act
      const result1 = generateMockOrderData(userId);
      const result2 = generateMockOrderData(userId);
      
      // Assert
      expect(result1).toEqual(result2);
      
      // Different userId should produce different data
      const differentResult = generateMockOrderData('different-user');
      expect(result1).not.toEqual(differentResult);
    });
    
    it('should generate valid order statuses', () => {
      // Arrange
      const userId = 'test-user-123';
      
      // Act
      const result = generateMockOrderData(userId);
      
      // Assert
      const validStatuses = ['配送中', '処理中', '完了', 'キャンセル'];
      result.forEach(order => {
        expect(validStatuses).toContain(order.status);
      });
    });
  });
  
  describe('getMockCustomerData', () => {
    it('should return mock data directly in development environment', async () => {
      // Arrange
      const userId = 'test-user-123';
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Act
      const result = await getMockCustomerData(userId);
      
      // Assert
      expect(result).toEqual({
        customer: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String)
        }),
        orders: expect.any(Array)
      });
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should call mock server API in production environment', async () => {
      // Arrange
      const userId = 'test-user-123';
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockCustomer = { id: 'CUST-123', name: 'Test Customer' };
      const mockOrders = [{ id: 'ORDER-123', customerId: 'CUST-123' }];
      
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/customer/')) {
          return Promise.resolve({ data: mockCustomer });
        } else if (url.includes('/orders/')) {
          return Promise.resolve({ data: mockOrders });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      // Act
      const result = await getMockCustomerData(userId);
      
      // Assert
      expect(result).toEqual({
        customer: mockCustomer,
        orders: mockOrders
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should throw an error when API call fails', async () => {
      // Arrange
      const userId = 'test-user-123';
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      mockedAxios.get.mockRejectedValue(new Error('API error'));
      
      // Act & Assert
      await expect(getMockCustomerData(userId)).rejects.toThrow('Failed to get customer data');
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});

// Add custom matcher for date comparison
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeBefore(date: Date): R;
    }
  }
}

expect.extend({
  toBeBefore(received: Date, argument: Date) {
    const pass = received < argument;
    if (pass) {
      return {
        message: () => `expected ${received} not to be before ${argument}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be before ${argument}`,
        pass: false,
      };
    }
  },
});