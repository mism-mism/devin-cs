import { SlackNotificationAdapter } from '../SlackNotificationAdapter';
import { IncomingWebhook } from '@slack/webhook';
import { AiService } from '../../../application/ports/AiService';
import { Customer } from '../../../domain/entities/Customer';
import { Order } from '../../../domain/entities/Order';
import { NotificationData } from '../../../domain/repositories/NotificationRepository';

// Mock Slack Webhook
jest.mock('@slack/webhook', () => {
  return {
    IncomingWebhook: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn()
      };
    })
  };
});

describe('SlackNotificationAdapter', () => {
  // Mock AiService
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

  const notificationData: NotificationData = {
    userId: 'user123',
    message: 'Hello, I have a question about my order',
    customer: sampleCustomer,
    orders: sampleOrders,
    replyToken: 'reply-token-123'
  };

  // Webhook URL
  const webhookUrl = 'https://hooks.slack.com/services/test/webhook';

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send a notification to Slack with AI suggestion', async () => {
      // Arrange
      const aiSuggestion = 'This is an AI-generated suggestion for the customer';
      mockAiService.generateSuggestion.mockResolvedValue(aiSuggestion);
      
      const mockWebhook = new IncomingWebhook(webhookUrl);
      mockWebhook.send.mockResolvedValue({});
      
      const slackNotificationAdapter = new SlackNotificationAdapter(webhookUrl, mockAiService);

      // Act
      await slackNotificationAdapter.sendNotification(notificationData);

      // Assert
      expect(mockAiService.generateSuggestion).toHaveBeenCalledWith(
        sampleCustomer,
        sampleOrders,
        notificationData.message
      );
      expect(mockWebhook.send).toHaveBeenCalledWith(expect.objectContaining({
        blocks: expect.arrayContaining([
          expect.objectContaining({
            type: 'header',
            text: expect.objectContaining({
              text: '🔔 新しいLINEメッセージが届きました'
            })
          }),
          expect.objectContaining({
            type: 'section',
            text: expect.objectContaining({
              text: expect.stringContaining(aiSuggestion)
            })
          })
        ])
      }));
    });

    it('should handle AI suggestion generation failure', async () => {
      // Arrange
      const error = new Error('Failed to generate AI suggestion');
      mockAiService.generateSuggestion.mockRejectedValue(error);
      
      const mockWebhook = new IncomingWebhook(webhookUrl);
      mockWebhook.send.mockResolvedValue({});
      
      const slackNotificationAdapter = new SlackNotificationAdapter(webhookUrl, mockAiService);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act
      await slackNotificationAdapter.sendNotification(notificationData);

      // Assert
      expect(mockAiService.generateSuggestion).toHaveBeenCalledWith(
        sampleCustomer,
        sampleOrders,
        notificationData.message
      );
      expect(console.error).toHaveBeenCalledWith('Error generating AI suggestion:', error);
      expect(mockWebhook.send).toHaveBeenCalledWith(expect.objectContaining({
        blocks: expect.arrayContaining([
          expect.objectContaining({
            type: 'section',
            text: expect.objectContaining({
              text: expect.stringContaining('※ AI提案の生成に失敗しました')
            })
          })
        ])
      }));
    });

    it('should throw an error when Slack webhook fails', async () => {
      // Arrange
      mockAiService.generateSuggestion.mockResolvedValue('AI suggestion');
      
      const mockWebhook = new IncomingWebhook(webhookUrl);
      const error = new Error('Slack webhook error');
      mockWebhook.send.mockRejectedValue(error);
      
      const slackNotificationAdapter = new SlackNotificationAdapter(webhookUrl, mockAiService);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(slackNotificationAdapter.sendNotification(notificationData))
        .rejects.toThrow('Failed to send Slack notification');
      expect(console.error).toHaveBeenCalledWith('Error sending Slack notification:', error);
    });

    it('should include customer and order information in the Slack message', async () => {
      // Arrange
      mockAiService.generateSuggestion.mockResolvedValue('AI suggestion');
      
      const mockWebhook = new IncomingWebhook(webhookUrl);
      mockWebhook.send.mockResolvedValue({});
      
      const slackNotificationAdapter = new SlackNotificationAdapter(webhookUrl, mockAiService);

      // Act
      await slackNotificationAdapter.sendNotification(notificationData);

      // Assert
      const callArgs = mockWebhook.send.mock.calls[0][0];
      
      // Check that the Slack message includes key customer and order information
      const blocksText = JSON.stringify(callArgs.blocks);
      expect(blocksText).toContain(sampleCustomer.name);
      expect(blocksText).toContain(sampleCustomer.membershipLevel);
      expect(blocksText).toContain(sampleCustomer.id);
      expect(blocksText).toContain(sampleCustomer.lastPurchaseDate);
      expect(blocksText).toContain(notificationData.message);
      expect(blocksText).toContain(sampleOrders[0].id);
      
      // Check that the button contains the correct reply token and user ID
      const actionsBlock = callArgs.blocks.find(block => block.type === 'actions');
      const buttonValue = JSON.parse(actionsBlock.elements[0].value);
      expect(buttonValue).toEqual({
        replyToken: notificationData.replyToken,
        userId: notificationData.userId
      });
    });
  });
});