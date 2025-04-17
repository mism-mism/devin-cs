import { NotificationService } from '../NotificationService';
import { NotificationRepository, NotificationData } from '../../repositories/NotificationRepository';
import { Customer } from '../../entities/Customer';
import { Order } from '../../entities/Order';

describe('NotificationService', () => {
  // Mock NotificationRepository
  const mockNotificationRepository: jest.Mocked<NotificationRepository> = {
    sendNotification: jest.fn()
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

  describe('sendNotification', () => {
    it('should send a notification with user data', async () => {
      // Arrange
      mockNotificationRepository.sendNotification.mockResolvedValue();
      const notificationService = new NotificationService(mockNotificationRepository);
      const userId = 'user123';
      const message = 'Hello, this is a test message';
      const replyToken = 'reply-token-123';

      // Expected notification data
      const expectedNotificationData: NotificationData = {
        userId,
        message,
        customer: sampleCustomer,
        orders: sampleOrders,
        replyToken
      };

      // Act
      await notificationService.sendNotification(
        userId,
        message,
        sampleCustomer,
        sampleOrders,
        replyToken
      );

      // Assert
      expect(mockNotificationRepository.sendNotification).toHaveBeenCalledWith(expectedNotificationData);
    });

    it('should propagate errors from the repository', async () => {
      // Arrange
      const error = new Error('Failed to send notification');
      mockNotificationRepository.sendNotification.mockRejectedValue(error);
      const notificationService = new NotificationService(mockNotificationRepository);
      const userId = 'user123';
      const message = 'Hello, this is a test message';
      const replyToken = 'reply-token-123';

      // Act & Assert
      await expect(
        notificationService.sendNotification(
          userId,
          message,
          sampleCustomer,
          sampleOrders,
          replyToken
        )
      ).rejects.toThrow(error);
      
      // Verify the repository was called with the correct data
      expect(mockNotificationRepository.sendNotification).toHaveBeenCalled();
    });
  });
});