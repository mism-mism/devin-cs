import { Client, WebhookEvent, MessageEvent, TextMessage } from '@line/bot-sdk';
import { getMockCustomerData } from '../mockMcpService';
import { sendSlackNotification } from '../slackService';
import { sendLineReply, handleLineEvent } from '../lineService';

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

jest.mock('../../config/lineConfig', () => ({
  lineConfig: {
    channelAccessToken: 'mock-token',
    channelSecret: 'mock-secret',
  },
}));

jest.mock('../mockMcpService', () => ({
  getMockCustomerData: jest.fn(),
}));

jest.mock('../slackService', () => ({
  sendSlackNotification: jest.fn(),
}));

describe('lineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendLineReply', () => {
    it('should send a reply message successfully', async () => {
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

    it('should throw an error when reply fails', async () => {
      // Arrange
      const replyToken = 'test-reply-token';
      const message = 'Test message';
      mockReplyMessage.mockRejectedValueOnce(new Error('API error'));

      // Act & Assert
      await expect(sendLineReply(replyToken, message)).rejects.toThrow('Failed to send LINE reply');
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: message,
      });
    });
  });

  describe('handleLineEvent', () => {
    it('should handle text message events', async () => {
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

    it('should handle error when userId is undefined', async () => {
      // Arrange
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
      await handleLineEvent(event);

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
      await handleLineEvent(event);

      // Assert
      expect(getMockCustomerData).toHaveBeenCalledWith(userId);
      expect(sendSlackNotification).not.toHaveBeenCalled();
      expect(mockReplyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text: 'メッセージの処理中にエラーが発生しました。しばらくしてからもう一度お試しください。',
      });
    });
  });
});
