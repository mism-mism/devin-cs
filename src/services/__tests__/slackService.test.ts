import { slackWebhook } from '../../config/slackConfig';
import { sendSlackNotification } from '../slackService';
import { generateAiSuggestion } from '../openaiService';
import { CustomerData, OrderData } from '../mockMcpService';

// Mock dependencies
jest.mock('../../config/slackConfig', () => ({
  slackWebhook: {
    send: jest.fn(),
  },
}));

jest.mock('../openaiService', () => ({
  generateAiSuggestion: jest.fn(),
}));

describe('slackService', () => {
  // Sample test data
  const mockCustomer: CustomerData = {
    id: 'CUST-123456',
    name: 'テスト顧客',
    email: 'test@example.com',
    phone: '090-1234-5678',
    address: '東京都渋谷区代々木1-2-3',
    membershipLevel: 'Gold',
    registrationDate: '2022-01-01',
    lastPurchaseDate: '2023-01-01',
  };
  
  const mockOrders: OrderData[] = [
    {
      id: 'ORDER-123456',
      customerId: 'CUST-123456',
      orderDate: '2023-01-01',
      status: '完了',
      items: [
        {
          id: 'ITEM-123456',
          name: '商品A',
          price: 1000,
          quantity: 2,
        },
      ],
      totalAmount: 2000,
    },
  ];
  
  const mockUserId = 'test-user-123';
  const mockMessage = '注文状況を教えてください';
  const mockReplyToken = 'test-reply-token';
  
  const mockNotificationData = {
    userId: mockUserId,
    message: mockMessage,
    customerData: {
      customer: mockCustomer,
      orders: mockOrders,
    },
    replyToken: mockReplyToken,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('sendSlackNotification', () => {
    it('should send notification to Slack with AI suggestion', async () => {
      // Arrange
      const mockAiSuggestion = 'こんにちは、テスト顧客様。ご注文の状況についてお知らせします。';
      (generateAiSuggestion as jest.Mock).mockResolvedValueOnce(mockAiSuggestion);
      
      // Act
      await sendSlackNotification(mockNotificationData);
      
      // Assert
      expect(generateAiSuggestion).toHaveBeenCalledWith(mockCustomer, mockOrders, mockMessage);
      expect(slackWebhook.send).toHaveBeenCalledTimes(1);
      
      // Verify the Slack message structure
      const slackMessage = (slackWebhook.send as jest.Mock).mock.calls[0][0];
      expect(slackMessage).toHaveProperty('blocks');
      expect(slackMessage.blocks).toBeInstanceOf(Array);
      
      // Check header
      expect(slackMessage.blocks[0]).toEqual({
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔔 新しいLINEメッセージが届きました',
          emoji: true,
        },
      });
      
      // Check customer info
      const customerInfoBlock = slackMessage.blocks.find(
        (block: any) => block.type === 'section' && block.fields && 
        block.fields.some((field: any) => field.text.includes('顧客名'))
      );
      expect(customerInfoBlock).toBeDefined();
      expect(customerInfoBlock.fields[0].text).toContain(mockCustomer.name);
      
      // Check message
      const messageBlock = slackMessage.blocks.find(
        (block: any) => block.type === 'section' && block.text && 
        block.text.text.includes('メッセージ')
      );
      expect(messageBlock).toBeDefined();
      expect(messageBlock.text.text).toContain(mockMessage);
      
      // Check AI suggestion
      const aiSuggestionBlock = slackMessage.blocks.find(
        (block: any) => block.type === 'section' && block.text && 
        block.text.text.includes('AI提案')
      );
      expect(aiSuggestionBlock).toBeDefined();
      expect(aiSuggestionBlock.text.text).toContain(mockAiSuggestion);
      
      // Check action button
      const actionBlock = slackMessage.blocks.find(
        (block: any) => block.type === 'actions'
      );
      expect(actionBlock).toBeDefined();
      expect(actionBlock.elements[0].text.text).toBe('対応する');
      expect(JSON.parse(actionBlock.elements[0].value)).toEqual({
        replyToken: mockReplyToken,
        userId: mockUserId,
      });
    });
    
    it('should handle error when AI suggestion generation fails', async () => {
      // Arrange
      (generateAiSuggestion as jest.Mock).mockRejectedValueOnce(new Error('AI API error'));
      
      // Act
      await sendSlackNotification(mockNotificationData);
      
      // Assert
      expect(generateAiSuggestion).toHaveBeenCalledWith(mockCustomer, mockOrders, mockMessage);
      expect(slackWebhook.send).toHaveBeenCalledTimes(1);
      
      // Verify the Slack message structure
      const slackMessage = (slackWebhook.send as jest.Mock).mock.calls[0][0];
      
      // Check AI suggestion error message
      const aiSuggestionBlock = slackMessage.blocks.find(
        (block: any) => block.type === 'section' && block.text && 
        block.text.text.includes('AI提案')
      );
      expect(aiSuggestionBlock).toBeDefined();
      expect(aiSuggestionBlock.text.text).toContain('※ AI提案の生成に失敗しました');
    });
    
    it('should format recent orders correctly', async () => {
      // Arrange
      const mockAiSuggestion = 'テスト回答';
      (generateAiSuggestion as jest.Mock).mockResolvedValueOnce(mockAiSuggestion);
      
      // Create multiple orders
      const multipleOrders = [
        ...mockOrders,
        {
          id: 'ORDER-234567',
          customerId: 'CUST-123456',
          orderDate: '2023-01-15',
          status: '配送中',
          items: [{ id: 'ITEM-234567', name: '商品B', price: 2000, quantity: 1 }],
          totalAmount: 2000,
        },
        {
          id: 'ORDER-345678',
          customerId: 'CUST-123456',
          orderDate: '2023-01-20',
          status: '処理中',
          items: [{ id: 'ITEM-345678', name: '商品C', price: 3000, quantity: 1 }],
          totalAmount: 3000,
        },
        {
          id: 'ORDER-456789',
          customerId: 'CUST-123456',
          orderDate: '2023-01-25',
          status: 'キャンセル',
          items: [{ id: 'ITEM-456789', name: '商品D', price: 4000, quantity: 1 }],
          totalAmount: 4000,
        },
      ];
      
      const notificationDataWithMultipleOrders = {
        ...mockNotificationData,
        customerData: {
          customer: mockCustomer,
          orders: multipleOrders,
        },
      };
      
      // Act
      await sendSlackNotification(notificationDataWithMultipleOrders);
      
      // Assert
      const slackMessage = (slackWebhook.send as jest.Mock).mock.calls[0][0];
      
      // Check recent orders block
      const ordersBlock = slackMessage.blocks.find(
        (block: any) => block.type === 'section' && block.text && 
        block.text.text.includes('最近の注文')
      );
      expect(ordersBlock).toBeDefined();
      
      // Should only show the first 3 orders
      const ordersText = ordersBlock.text.text;
      expect(ordersText).toContain('ORDER-456789');
      expect(ordersText).toContain('ORDER-345678');
      expect(ordersText).toContain('ORDER-234567');
      // The 4th order should not be included in the text
      expect(ordersText.split('注文番号').length - 1).toBe(3);
    });
    
    it('should handle empty orders array', async () => {
      // Arrange
      const mockAiSuggestion = 'テスト回答';
      (generateAiSuggestion as jest.Mock).mockResolvedValueOnce(mockAiSuggestion);
      
      const notificationDataWithNoOrders = {
        ...mockNotificationData,
        customerData: {
          customer: mockCustomer,
          orders: [],
        },
      };
      
      // Act
      await sendSlackNotification(notificationDataWithNoOrders);
      
      // Assert
      const slackMessage = (slackWebhook.send as jest.Mock).mock.calls[0][0];
      
      // Check recent orders block
      const ordersBlock = slackMessage.blocks.find(
        (block: any) => block.type === 'section' && block.text && 
        block.text.text.includes('最近の注文')
      );
      expect(ordersBlock).toBeDefined();
      expect(ordersBlock.text.text).toContain('最近の注文はありません');
    });
    
    it('should throw an error when Slack webhook send fails', async () => {
      // Arrange
      const mockAiSuggestion = 'テスト回答';
      (generateAiSuggestion as jest.Mock).mockResolvedValueOnce(mockAiSuggestion);
      (slackWebhook.send as jest.Mock).mockRejectedValueOnce(new Error('Slack API error'));
      
      // Act & Assert
      await expect(sendSlackNotification(mockNotificationData))
        .rejects.toThrow('Failed to send Slack notification');
    });
  });
});