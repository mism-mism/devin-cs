import express from 'express';
import request from 'supertest';
import { generateMockCustomerData, generateMockOrderData } from '../../services/mockMcpService';
import { mockMcpRouter } from '../mockMcpController';

// Mock dependencies
jest.mock('../../services/mockMcpService', () => ({
  generateMockCustomerData: jest.fn(),
  generateMockOrderData: jest.fn(),
}));

describe('mockMcpController', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/mock-mcp', mockMcpRouter);
  });

  describe('GET /mock-mcp/customer/:userId', () => {
    it('should return customer data for a valid userId', async () => {
      // Arrange
      const userId = 'test-user-123';
      const mockCustomerData = {
        id: 'CUST-123456',
        name: '顧客 123',
        email: 'customer123@example.com',
        phone: '090-1234-5678',
        address: '東京都渋谷区代々木1-2-3',
        membershipLevel: 'Gold',
        registrationDate: '2022-01-01',
        lastPurchaseDate: '2023-01-01',
      };

      (generateMockCustomerData as jest.Mock).mockReturnValueOnce(mockCustomerData);

      // Act
      const response = await request(app)
        .get(`/mock-mcp/customer/${userId}`)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomerData);
      expect(generateMockCustomerData).toHaveBeenCalledWith(userId);
    });

    it('should return 500 when an error occurs', async () => {
      // Arrange
      const userId = 'test-user-123';
      (generateMockCustomerData as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      // Act
      const response = await request(app)
        .get(`/mock-mcp/customer/${userId}`)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to get customer data' });
      expect(generateMockCustomerData).toHaveBeenCalledWith(userId);
    });
  });

  describe('GET /mock-mcp/orders/:userId', () => {
    it('should return order data for a valid userId', async () => {
      // Arrange
      const userId = 'test-user-123';
      const mockOrderData = [
        {
          id: 'ORDER-123456',
          customerId: 'CUST-123456',
          orderDate: '2023-01-15',
          status: '配送中',
          items: [
            {
              id: 'ITEM-123456',
              name: '商品A',
              price: 1500,
              quantity: 2,
            },
          ],
          totalAmount: 3000,
        },
      ];

      (generateMockOrderData as jest.Mock).mockReturnValueOnce(mockOrderData);

      // Act
      const response = await request(app)
        .get(`/mock-mcp/orders/${userId}`)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrderData);
      expect(generateMockOrderData).toHaveBeenCalledWith(userId);
    });

    it('should return 500 when an error occurs', async () => {
      // Arrange
      const userId = 'test-user-123';
      (generateMockOrderData as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      // Act
      const response = await request(app)
        .get(`/mock-mcp/orders/${userId}`)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to get order data' });
      expect(generateMockOrderData).toHaveBeenCalledWith(userId);
    });
  });

  describe('GET /mock-mcp/health', () => {
    it('should return health status', async () => {
      // Act
      const response = await request(app)
        .get('/mock-mcp/health')
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});