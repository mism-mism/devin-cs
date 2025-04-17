import { slackApp } from '../../config/slackConfig';
import { CustomerData, OrderData } from '../mockMcpService';
import { generateAiSuggestion } from '../openaiService';
import { sendLineReply } from '../lineService';
import { initializeSlackMcpClient, sendSlackMcpMessage, McpMessage } from '../slackMcpService';

// Mock dependencies
jest.mock('../../config/slackConfig', () => ({
  slackApp: {
    start: jest.fn(),
    action: jest.fn(),
    view: jest.fn(),
    client: {
      chat: {
        postMessage: jest.fn(),
      },
      views: {
        open: jest.fn(),
      },
    },
  },
}));

jest.mock('../openaiService', () => ({
  generateAiSuggestion: jest.fn(),
}));

jest.mock('../lineService', () => ({
  sendLineReply: jest.fn(),
}));

// Mock environment variables
process.env.SLACK_CHANNEL_ID = 'test-channel';

describe('slackMcpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeSlackMcpClient', () => {
    it('should initialize the Slack MCP client successfully', async () => {
      // Arrange
      (slackApp.start as jest.Mock).mockResolvedValueOnce(undefined);

      // Act
      await initializeSlackMcpClient();

      // Assert
      expect(slackApp.action).toHaveBeenCalledWith('handle_customer', expect.any(Function));
      expect(slackApp.view).toHaveBeenCalledWith('reply_modal', expect.any(Function));
      expect(slackApp.start).toHaveBeenCalled();
    });

    it('should throw an error when Slack app fails to start', async () => {
      // Arrange
      const error = new Error('Failed to start Slack app');
      (slackApp.start as jest.Mock).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(initializeSlackMcpClient()).rejects.toThrow(error);
      expect(slackApp.action).toHaveBeenCalledWith('handle_customer', expect.any(Function));
      expect(slackApp.view).toHaveBeenCalledWith('reply_modal', expect.any(Function));
      expect(slackApp.start).toHaveBeenCalled();
    });
  });

  describe('sendSlackMcpMessage', () => {
    it('should send a Slack MCP message successfully', async () => {
      // Arrange
      const mockCustomer: CustomerData = {
        id: 'CUST-123456',
        name: '顧客 123',
        email: 'customer123@example.com',
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

      const mcpMessage: McpMessage = {
        type: 'text',
        source: 'line',
        userId: 'user-123',
        message: 'こんにちは',
        customerData: {
          customer: mockCustomer,
          orders: mockOrders,
        },
        replyToken: 'reply-token-123',
      };

      const aiSuggestion = 'こんにちは、顧客様。いつもご利用ありがとうございます。';
      (generateAiSuggestion as jest.Mock).mockResolvedValueOnce(aiSuggestion);
      (slackApp.client.chat.postMessage as jest.Mock).mockResolvedValueOnce({});

      // Act
      await sendSlackMcpMessage(mcpMessage);

      // Assert
      expect(generateAiSuggestion).toHaveBeenCalledWith(mockCustomer, mockOrders, 'こんにちは');
      expect(slackApp.client.chat.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        channel: 'test-channel',
        blocks: expect.arrayContaining([
          expect.objectContaining({
            type: 'header',
            text: expect.objectContaining({
              text: '🔔 新しいLINEメッセージが届きました',
            }),
          }),
          expect.objectContaining({
            type: 'section',
            text: expect.objectContaining({
              text: expect.stringContaining(aiSuggestion),
            }),
          }),
        ]),
      }));
    });

    it('should handle error when AI suggestion generation fails', async () => {
      // Arrange
      const mockCustomer: CustomerData = {
        id: 'CUST-123456',
        name: '顧客 123',
        email: 'customer123@example.com',
        phone: '090-1234-5678',
        address: '東京都渋谷区代々木1-2-3',
        membershipLevel: 'Gold',
        registrationDate: '2022-01-01',
        lastPurchaseDate: '2023-01-01',
      };

      const mockOrders: OrderData[] = [];

      const mcpMessage: McpMessage = {
        type: 'text',
        source: 'line',
        userId: 'user-123',
        message: 'こんにちは',
        customerData: {
          customer: mockCustomer,
          orders: mockOrders,
        },
        replyToken: 'reply-token-123',
      };

      (generateAiSuggestion as jest.Mock).mockRejectedValueOnce(new Error('AI API error'));
      (slackApp.client.chat.postMessage as jest.Mock).mockResolvedValueOnce({});

      // Act
      await sendSlackMcpMessage(mcpMessage);

      // Assert
      expect(generateAiSuggestion).toHaveBeenCalledWith(mockCustomer, mockOrders, 'こんにちは');
      expect(slackApp.client.chat.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        channel: 'test-channel',
        blocks: expect.arrayContaining([
          expect.objectContaining({
            type: 'section',
            text: expect.objectContaining({
              text: expect.stringContaining('※ AI提案の生成に失敗しました'),
            }),
          }),
        ]),
      }));
    });

    it('should throw an error when Slack message sending fails', async () => {
      // Arrange
      const mockCustomer: CustomerData = {
        id: 'CUST-123456',
        name: '顧客 123',
        email: 'customer123@example.com',
        phone: '090-1234-5678',
        address: '東京都渋谷区代々木1-2-3',
        membershipLevel: 'Gold',
        registrationDate: '2022-01-01',
        lastPurchaseDate: '2023-01-01',
      };

      const mockOrders: OrderData[] = [];

      const mcpMessage: McpMessage = {
        type: 'text',
        source: 'line',
        userId: 'user-123',
        message: 'こんにちは',
        customerData: {
          customer: mockCustomer,
          orders: mockOrders,
        },
        replyToken: 'reply-token-123',
      };

      const aiSuggestion = 'こんにちは、顧客様。いつもご利用ありがとうございます。';
      (generateAiSuggestion as jest.Mock).mockResolvedValueOnce(aiSuggestion);
      (slackApp.client.chat.postMessage as jest.Mock).mockRejectedValueOnce(new Error('Slack API error'));

      // Act & Assert
      await expect(sendSlackMcpMessage(mcpMessage)).rejects.toThrow('Failed to send Slack MCP message');
      expect(generateAiSuggestion).toHaveBeenCalledWith(mockCustomer, mockOrders, 'こんにちは');
      expect(slackApp.client.chat.postMessage).toHaveBeenCalled();
    });
  });

  // Test Slack event handlers
  describe('Slack event handlers', () => {
    // Mock the event handlers directly
    let actionHandler: Function;
    let viewHandler: Function;

    beforeEach(() => {
      // Mock the action and view handlers
      actionHandler = jest.fn(async ({ ack, body, client }) => {
        await ack();
        const payload = JSON.parse((body as any).actions[0].value);
        await client.views.open({
          trigger_id: (body as any).trigger_id,
          view: {
            type: 'modal',
            callback_id: 'reply_modal',
            private_metadata: JSON.stringify(payload),
            title: { type: 'plain_text', text: 'Reply to Customer' },
            submit: { type: 'plain_text', text: 'Send' },
            close: { type: 'plain_text', text: 'Cancel' },
            blocks: [
              {
                type: 'input',
                block_id: 'reply_block',
                label: { type: 'plain_text', text: 'Your reply' },
                element: {
                  type: 'plain_text_input',
                  action_id: 'reply_action',
                  multiline: true
                }
              }
            ]
          }
        });
      });

      viewHandler = jest.fn(async ({ ack, view }) => {
        await ack();
        const { replyToken, userId } = JSON.parse(view.private_metadata);
        const replyMessage = view.state.values.reply_block.reply_action.value;
        if (replyMessage) {
          await sendLineReply(replyToken, replyMessage);
        }
      });

      // Register the mocked handlers
      (slackApp.action as jest.Mock).mockImplementation((actionId, handler) => {
        if (actionId === 'handle_customer') {
          actionHandler = handler;
        }
        return slackApp;
      });

      (slackApp.view as jest.Mock).mockImplementation((viewId, handler) => {
        if (viewId === 'reply_modal') {
          viewHandler = handler;
        }
        return slackApp;
      });

      // Call initializeSlackMcpClient to register the handlers
      initializeSlackMcpClient();
    });

    it('should handle button click and open modal', async () => {
      // Mock event data
      const mockEvent = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: {
          trigger_id: 'trigger-123',
          actions: [
            {
              value: JSON.stringify({
                replyToken: 'reply-token-123',
                userId: 'user-123',
              }),
            },
          ],
        },
        client: {
          views: {
            open: jest.fn().mockResolvedValueOnce({}),
          },
        },
      };

      // Act
      await actionHandler(mockEvent);

      // Assert
      expect(mockEvent.ack).toHaveBeenCalled();
      expect(mockEvent.client.views.open).toHaveBeenCalledWith(expect.objectContaining({
        trigger_id: 'trigger-123',
        view: expect.objectContaining({
          callback_id: 'reply_modal',
          private_metadata: expect.any(String),
        }),
      }));
    });

    it('should handle modal submission and send LINE reply', async () => {
      // Mock event data
      const mockEvent = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: JSON.stringify({
            replyToken: 'reply-token-123',
            userId: 'user-123',
          }),
          state: {
            values: {
              reply_block: {
                reply_action: {
                  value: 'こんにちは、ありがとうございます。',
                },
              },
            },
          },
        },
        body: {},
      };

      (sendLineReply as jest.Mock).mockResolvedValueOnce({});

      // Act
      await viewHandler(mockEvent);

      // Assert
      expect(mockEvent.ack).toHaveBeenCalled();
      expect(sendLineReply).toHaveBeenCalledWith(
        'reply-token-123',
        'こんにちは、ありがとうございます。'
      );
    });

    it('should handle error when reply message is undefined', async () => {
      // Mock event data
      const mockEvent = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: JSON.stringify({
            replyToken: 'reply-token-123',
            userId: 'user-123',
          }),
          state: {
            values: {
              reply_block: {
                reply_action: {
                  value: undefined,
                },
              },
            },
          },
        },
        body: {},
      };

      // Act
      await viewHandler(mockEvent);

      // Assert
      expect(mockEvent.ack).toHaveBeenCalled();
      expect(sendLineReply).not.toHaveBeenCalled();
    });
  });
});
