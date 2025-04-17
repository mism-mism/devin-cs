import { OpenAiAdapter } from '../OpenAiAdapter';
import { OpenAIApi } from 'openai';
import { Customer } from '../../../domain/entities/Customer';
import { Order } from '../../../domain/entities/Order';

// Mock OpenAI API
jest.mock('openai', () => {
  return {
    OpenAIApi: jest.fn().mockImplementation(() => {
      return {
        createChatCompletion: jest.fn()
      };
    })
  };
});

describe('OpenAiAdapter', () => {
  // OpenAI config
  const openaiConfig = {
    model: 'gpt-4o',
    maxTokens: 500,
    temperature: 0.7
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

  const message = 'Hello, I have a question about my order';

  // Mock OpenAI instance
  const mockOpenai = new OpenAIApi();

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSuggestion', () => {
    it('should generate a suggestion using OpenAI API', async () => {
      // Arrange
      const aiSuggestion = 'This is an AI-generated suggestion for the customer';
      mockOpenai.createChatCompletion.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: aiSuggestion
              }
            }
          ]
        }
      });

      const openAiAdapter = new OpenAiAdapter(mockOpenai, openaiConfig);

      // Act
      const result = await openAiAdapter.generateSuggestion(sampleCustomer, sampleOrders, message);

      // Assert
      expect(result).toBe(aiSuggestion);
      expect(mockOpenai.createChatCompletion).toHaveBeenCalledWith({
        model: openaiConfig.model,
        messages: [
          {
            role: 'system',
            content: 'あなたは顧客サポートの担当者です。顧客情報と注文履歴を元に、適切な対応を提案してください。'
          },
          {
            role: 'user',
            content: expect.any(String) // The prompt is complex, so we just check it's a string
          }
        ],
        max_tokens: openaiConfig.maxTokens,
        temperature: openaiConfig.temperature,
      });
    });

    it('should return a default message when OpenAI API returns no content', async () => {
      // Arrange
      mockOpenai.createChatCompletion.mockResolvedValue({
        data: {
          choices: [{}] // No message content
        }
      });

      const openAiAdapter = new OpenAiAdapter(mockOpenai, openaiConfig);

      // Act
      const result = await openAiAdapter.generateSuggestion(sampleCustomer, sampleOrders, message);

      // Assert
      expect(result).toBe('提案を生成できませんでした。');
    });

    it('should throw an error when OpenAI API fails', async () => {
      // Arrange
      const error = new Error('OpenAI API error');
      mockOpenai.createChatCompletion.mockRejectedValue(error);

      const openAiAdapter = new OpenAiAdapter(mockOpenai, openaiConfig);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(openAiAdapter.generateSuggestion(sampleCustomer, sampleOrders, message))
        .rejects.toThrow('Failed to generate AI suggestion');
      expect(console.error).toHaveBeenCalledWith('Error generating AI suggestion:', error);
    });

    it('should include customer and order information in the prompt', async () => {
      // Arrange
      mockOpenai.createChatCompletion.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: 'AI suggestion'
              }
            }
          ]
        }
      });

      const openAiAdapter = new OpenAiAdapter(mockOpenai, openaiConfig);

      // Act
      await openAiAdapter.generateSuggestion(sampleCustomer, sampleOrders, message);

      // Assert
      const callArgs = mockOpenai.createChatCompletion.mock.calls[0][0];
      const prompt = callArgs.messages[1].content;
      
      // Check that the prompt includes key customer and order information
      expect(prompt).toContain(sampleCustomer.name);
      expect(prompt).toContain(sampleCustomer.id);
      expect(prompt).toContain(sampleCustomer.membershipLevel);
      expect(prompt).toContain(sampleOrders[0].id);
      expect(prompt).toContain(sampleOrders[0].status);
      expect(prompt).toContain(sampleOrders[0].items[0].name);
      expect(prompt).toContain(message);
    });
  });
});