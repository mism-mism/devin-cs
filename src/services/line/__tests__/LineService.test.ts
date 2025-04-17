import { Client, WebhookEvent, MessageEvent, TextMessage } from '@line/bot-sdk';
import { getMockCustomerData } from '../../mockMcpService';
import { sendSlackNotification } from '../../slackService';
import { LineService, sendLineReply, handleLineEvent } from '../LineService';

// Mock dependencies
const mockReplyMessage = jest.fn().mockResolvedValue({});

// Mock the LINE client
jest.mock('@line/bot-sdk', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        replyMessage: jest.fn().mockImplementation((...args) => mockReplyMessage(...args)),
      };
    }),
  };
});

jest.mock('../../../config/lineConfig', () => ({
  lineConfig: {
    channelAccessToken: 'mock-token',
    channelSecret: 'mock-secret',
  },
}));

jest.mock('../../mockMcpService', () => ({
  getMockCustomerData: jest.fn(),
}));

jest.mock('../../slackService', () => ({
  sendSlackNotification: jest.fn(),
}));

describe('LineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with custom configuration', () => {
      // Arrange
      const customConfig = {
        channelAccessToken: 'custom-token',
        channelSecret: 'custom-secret',
      };

      // Act
      new LineService(customConfig);

      // Assert
      expect(Client).toHaveBeenCalledWith(customConfig);
    });

    it('should initialize with default configuration if not provided', () => {
      // Act
      new LineService();

      // Assert
      expect(Client).toHaveBeenCalledWith({
        channelAccessToken: 'mock-token',
        channelSecret: 'mock-secret',
      });
    });
  });

  describe('sendReply', () => {
    it('should send a reply message successfully', async () => {
      // Arrange
      const lineService = new LineService();
      const replyToken = 'test-reply-token';
      const message = 'Test message';

      // Act
      await lineService.sendReply(replyToken, message);

      // Assert
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: message,
      });
    });

    it('should throw an error when reply fails', async () => {
      // Arrange
      const lineService = new LineService();
      const replyToken = 'test-reply-token';
      const message = 'Test message';
      mockReplyMessage.mockRejectedValueOnce(new Error('API error'));

      // Act & Assert
      await expect(lineService.sendReply(replyToken, message)).rejects.toThrow('Failed to send LINE reply');
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: message,
      });
    });
  });

  describe('handleEvent', () => {
    it('should handle text message events', async () => {
      // Arrange
      const lineService = new LineService();
      const userId = 'test-user-id';
      const replyToken = 'test-reply-token';
      const messageText = 'Hello, world!';

      const event: WebhookEvent = {
        type: 'message',
        message: {
          type: 'text',
          id: 'message-id',
          text: messageText,
          quoteToken: 'mock-quote-token',
        },
        replyToken,
        source: {
          type: 'user',
          userId,
        },
        timestamp: 123456789,
        mode: 'active',
        webhookEventId: 'webhook-event-id-1',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      const mockCustomerData = {
        customer: {
          id: 'CUST-123456',
          name: '顧客 123',
          email: 'customer123@example.com',
          phone: '090-1234-5678',
          address: '東京都渋谷区代々木1-2-3',
          membershipLevel: 'Gold',
          registrationDate: '2022-01-01',
          lastPurchaseDate: '2023-01-01',
        },
        orders: [],
      };

      (getMockCustomerData as jest.Mock).mockResolvedValueOnce(mockCustomerData);

      // Act
      await lineService.handleEvent(event);

      // Assert
      expect(getMockCustomerData).toHaveBeenCalledWith(userId);
      expect(sendSlackNotification).toHaveBeenCalledWith({
        userId,
        message: messageText,
        customerData: mockCustomerData,
        replyToken,
      });
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: 'ありがとうございます。担当者に通知しました。',
      });
    });

    it('should not process non-text message events', async () => {
      // Arrange
      const lineService = new LineService();
      const userId = 'test-user-id';
      const replyToken = 'test-reply-token';

      // Create an image message event
      const event: WebhookEvent = {
        type: 'message',
        message: {
          type: 'image',
          id: 'message-id',
          contentProvider: {
            type: 'line'
          },
          quoteToken: 'mock-quote-token',
        },
        replyToken,
        source: {
          type: 'user',
          userId,
        },
        timestamp: 123456789,
        mode: 'active',
        webhookEventId: 'webhook-event-id-5',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      // Act
      await lineService.handleEvent(event);

      // Assert
      expect(getMockCustomerData).not.toHaveBeenCalled();
      expect(sendSlackNotification).not.toHaveBeenCalled();
      expect(mockReplyMessage).not.toHaveBeenCalled();
    });

    it('should handle error when userId is undefined', async () => {
      // Arrange
      const lineService = new LineService();
      const replyToken = 'test-reply-token';
      const messageText = 'Hello, world!';

      const event: WebhookEvent = {
        type: 'message',
        message: {
          type: 'text',
          id: 'message-id',
          text: messageText,
          quoteToken: 'mock-quote-token',
        },
        replyToken,
        source: {
          type: 'user',
          userId: undefined as unknown as string, // TypeScript needs this but the test will treat it as undefined
        },
        timestamp: 123456789,
        mode: 'active',
        webhookEventId: 'webhook-event-id-2',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      // Act
      await lineService.handleEvent(event);

      // Assert
      expect(getMockCustomerData).not.toHaveBeenCalled();
      expect(sendSlackNotification).not.toHaveBeenCalled();
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: 'エラーが発生しました。しばらくしてからもう一度お試しください。',
      });
    });

    it('should handle error when getMockCustomerData fails', async () => {
      // Arrange
      const lineService = new LineService();
      const userId = 'test-user-id';
      const replyToken = 'test-reply-token';
      const messageText = 'Hello, world!';

      const event: WebhookEvent = {
        type: 'message',
        message: {
          type: 'text',
          id: 'message-id',
          text: messageText,
          quoteToken: 'mock-quote-token',
        },
        replyToken,
        source: {
          type: 'user',
          userId,
        },
        timestamp: 123456789,
        mode: 'active',
        webhookEventId: 'webhook-event-id-3',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      (getMockCustomerData as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Act
      await lineService.handleEvent(event);

      // Assert
      expect(getMockCustomerData).toHaveBeenCalledWith(userId);
      expect(sendSlackNotification).not.toHaveBeenCalled();
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: 'メッセージの処理中にエラーが発生しました。しばらくしてからもう一度お試しください。',
      });
    });

    it('should handle error when sendSlackNotification fails', async () => {
      // Arrange
      const lineService = new LineService();
      const userId = 'test-user-id';
      const replyToken = 'test-reply-token';
      const messageText = 'Hello, world!';

      const event: WebhookEvent = {
        type: 'message',
        message: {
          type: 'text',
          id: 'message-id',
          text: messageText,
          quoteToken: 'mock-quote-token',
        },
        replyToken,
        source: {
          type: 'user',
          userId,
        },
        timestamp: 123456789,
        mode: 'active',
        webhookEventId: 'webhook-event-id-6',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      const mockCustomerData = {
        customer: {
          id: 'CUST-123456',
          name: '顧客 123',
          email: 'customer123@example.com',
          phone: '090-1234-5678',
          address: '東京都渋谷区代々木1-2-3',
          membershipLevel: 'Gold',
          registrationDate: '2022-01-01',
          lastPurchaseDate: '2023-01-01',
        },
        orders: [],
      };

      (getMockCustomerData as jest.Mock).mockResolvedValueOnce(mockCustomerData);
      (sendSlackNotification as jest.Mock).mockRejectedValueOnce(new Error('Slack API error'));

      // Act
      await lineService.handleEvent(event);

      // Assert
      expect(getMockCustomerData).toHaveBeenCalledWith(userId);
      expect(sendSlackNotification).toHaveBeenCalledWith({
        userId,
        message: messageText,
        customerData: mockCustomerData,
        replyToken,
      });
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: 'メッセージの処理中にエラーが発生しました。しばらくしてからもう一度お試しください。',
      });
    });
  });

  describe('Backward compatibility functions', () => {
    it('sendLineReply should call LineService.sendReply', async () => {
      // Arrange
      const replyToken = 'test-reply-token';
      const message = 'Test message';

      // Act
      await sendLineReply(replyToken, message);

      // Assert
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: message,
      });
    });

    it('handleLineEvent should call LineService.handleEvent', async () => {
      // Arrange
      const userId = 'test-user-id';
      const replyToken = 'test-reply-token';
      const messageText = 'Hello, world!';

      const event: WebhookEvent = {
        type: 'message',
        message: {
          type: 'text',
          id: 'message-id',
          text: messageText,
          quoteToken: 'mock-quote-token',
        },
        replyToken,
        source: {
          type: 'user',
          userId,
        },
        timestamp: 123456789,
        mode: 'active',
        webhookEventId: 'webhook-event-id-4',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      const mockCustomerData = {
        customer: {
          id: 'CUST-123456',
          name: '顧客 123',
          email: 'customer123@example.com',
          phone: '090-1234-5678',
          address: '東京都渋谷区代々木1-2-3',
          membershipLevel: 'Gold',
          registrationDate: '2022-01-01',
          lastPurchaseDate: '2023-01-01',
        },
        orders: [],
      };

      (getMockCustomerData as jest.Mock).mockResolvedValueOnce(mockCustomerData);

      // Act
      await handleLineEvent(event);

      // Assert
      expect(getMockCustomerData).toHaveBeenCalledWith(userId);
      expect(sendSlackNotification).toHaveBeenCalledWith({
        userId,
        message: messageText,
        customerData: mockCustomerData,
        replyToken,
      });
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: 'ありがとうございます。担当者に通知しました。',
      });
    });
  });
});
