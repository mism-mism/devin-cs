import { CustomerSupportService } from '../CustomerSupportService';
import { CustomerService } from '../../../domain/services/CustomerService';
import { MessageService } from '../../../domain/services/MessageService';
import { NotificationService } from '../../../domain/services/NotificationService';
import { AiService } from '../../ports/AiService';
import { Customer } from '../../../domain/entities/Customer';
import { Order } from '../../../domain/entities/Order';

describe('CustomerSupportService', () => {
  // Mock dependencies
  const mockCustomerService: jest.Mocked<CustomerService> = {
    getCustomerById: jest.fn(),
    getOrdersByCustomerId: jest.fn(),
    getCustomerWithOrders: jest.fn()
  };

  const mockMessageService: jest.Mocked<MessageService> = {
    sendMessage: jest.fn()
  };

  const mockNotificationService: jest.Mocked<NotificationService> = {
    sendNotification: jest.fn()
  };

  const mockAiService: jest.Mocked<AiService> = {
    generateSuggestion: jest.fn()
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

  describe('handleCustomerInquiry', () => {
    it('should process customer inquiry successfully', async () => {
      // Arrange
      mockCustomerService.getCustomerWithOrders.mockResolvedValue({
        customer: sampleCustomer,
        orders: sampleOrders
      });
      mockNotificationService.sendNotification.mockResolvedValue();
      mockMessageService.sendMessage.mockResolvedValue();

      const customerSupportService = new CustomerSupportService(
        mockCustomerService,
        mockMessageService,
        mockNotificationService,
        mockAiService
      );

      const userId = 'user123';
      const message = 'Hello, I have a question about my order';
      const replyToken = 'reply-token-123';

      // Act
      await customerSupportService.handleCustomerInquiry(userId, message, replyToken);

      // Assert
      expect(mockCustomerService.getCustomerWithOrders).toHaveBeenCalledWith(userId);
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        userId,
        message,
        sampleCustomer,
        sampleOrders,
        replyToken
      );
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(
        replyToken,
        'ありがとうございます。担当者に通知しました。'
      );
    });

    it('should handle errors during customer inquiry processing', async () => {
      // Arrange
      const error = new Error('Failed to get customer data');
      mockCustomerService.getCustomerWithOrders.mockRejectedValue(error);
      mockMessageService.sendMessage.mockResolvedValue();

      const customerSupportService = new CustomerSupportService(
        mockCustomerService,
        mockMessageService,
        mockNotificationService,
        mockAiService
      );

      const userId = 'user123';
      const message = 'Hello, I have a question about my order';
      const replyToken = 'reply-token-123';

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act
      await customerSupportService.handleCustomerInquiry(userId, message, replyToken);

      // Assert
      expect(mockCustomerService.getCustomerWithOrders).toHaveBeenCalledWith(userId);
      expect(mockNotificationService.sendNotification).not.toHaveBeenCalled();
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(
        replyToken,
        'メッセージの処理中にエラーが発生しました。しばらくしてからもう一度お試しください。'
      );
      expect(console.error).toHaveBeenCalledWith('Error handling customer inquiry:', error);
    });
  });

  describe('handleStaffResponse', () => {
    it('should send staff response to customer', async () => {
      // Arrange
      mockMessageService.sendMessage.mockResolvedValue();

      const customerSupportService = new CustomerSupportService(
        mockCustomerService,
        mockMessageService,
        mockNotificationService,
        mockAiService
      );

      const replyToken = 'reply-token-123';
      const responseMessage = 'Thank you for your inquiry. We will process your order soon.';

      // Act
      await customerSupportService.handleStaffResponse(replyToken, responseMessage);

      // Assert
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(replyToken, responseMessage);
    });

    it('should handle errors when sending staff response', async () => {
      // Arrange
      const error = new Error('Failed to send message');
      mockMessageService.sendMessage.mockRejectedValue(error);

      const customerSupportService = new CustomerSupportService(
        mockCustomerService,
        mockMessageService,
        mockNotificationService,
        mockAiService
      );

      const replyToken = 'reply-token-123';
      const responseMessage = 'Thank you for your inquiry. We will process your order soon.';

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(
        customerSupportService.handleStaffResponse(replyToken, responseMessage)
      ).rejects.toThrow('Failed to send response to customer');
      
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(replyToken, responseMessage);
      expect(console.error).toHaveBeenCalledWith('Error handling staff response:', error);
    });
  });
});