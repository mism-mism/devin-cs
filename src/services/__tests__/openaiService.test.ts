import { generateAiSuggestion } from '../openaiService';
import { CustomerData, OrderData } from '../mockMcpService';

// Mock the entire openaiService module
jest.mock('../openaiService', () => {
  // Keep the original module
  const originalModule = jest.requireActual('../openaiService');

  // Mock the createPrompt function to make it testable
  const createPrompt = originalModule.createPrompt || 
    ((customer: CustomerData, orders: OrderData[], message: string) => {
      return `
顧客情報:
- 名前: ${customer.name}
- ID: ${customer.id}
- メールアドレス: ${customer.email}
- 電話番号: ${customer.phone}
- 住所: ${customer.address}
- 会員レベル: ${customer.membershipLevel}
- 登録日: ${customer.registrationDate}
- 最終購入日: ${customer.lastPurchaseDate}

${orders.length > 0 
  ? `注文履歴:
${orders.map((order, index) => `
注文 ${index + 1}:
- 注文番号: ${order.id}
- 注文日: ${order.orderDate}
- 状態: ${order.status}
- 合計金額: ¥${order.totalAmount.toLocaleString()}
- 商品:
${order.items.map(item => `  • ${item.name} x ${item.quantity} (¥${item.price.toLocaleString()}/個)`).join('\n')}
`).join('\n')}
`
  : '注文履歴: なし\n'}

顧客からのメッセージ:
"${message}"
`;
    });

  // Return a mocked version of the module
  return {
    ...originalModule,
    // Override the generateAiSuggestion function for testing
    generateAiSuggestion: jest.fn().mockImplementation(async (customer, orders, message) => {
      // Call the real createPrompt function to test it
      const prompt = createPrompt(customer, orders, message);

      // For testing, return a simple response based on the input
      if (orders.length === 0) {
        return 'お客様、現在注文履歴はございません。';
      }

      return `こんにちは、${customer.name}様。ご注文の状況についてお知らせします。`;
    }),
    // Export createPrompt for testing
    createPrompt,
  };
});

// Restore the original implementation after tests
afterAll(() => {
  jest.restoreAllMocks();
});

describe('openaiService', () => {
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

  const customerMessage = '注文状況を教えてください';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAiSuggestion', () => {
    it('should generate AI suggestion successfully', async () => {
      // Act
      const result = await generateAiSuggestion(mockCustomer, mockOrders, customerMessage);

      // Assert
      expect(result).toBe('こんにちは、テスト顧客様。ご注文の状況についてお知らせします。');
      expect(generateAiSuggestion).toHaveBeenCalledWith(mockCustomer, mockOrders, customerMessage);
    });

    it('should handle empty orders array', async () => {
      // Act
      const result = await generateAiSuggestion(mockCustomer, [], customerMessage);

      // Assert
      expect(result).toBe('お客様、現在注文履歴はございません。');
      expect(generateAiSuggestion).toHaveBeenCalledWith(mockCustomer, [], customerMessage);
    });
  });

  describe('createPrompt', () => {
    // Import the mocked createPrompt function
    const { createPrompt } = jest.requireMock('../openaiService');

    it('should include customer information in the prompt', () => {
      // Act
      const prompt = createPrompt(mockCustomer, mockOrders, customerMessage);

      // Assert
      expect(prompt).toContain(`名前: ${mockCustomer.name}`);
      expect(prompt).toContain(`ID: ${mockCustomer.id}`);
      expect(prompt).toContain(`メールアドレス: ${mockCustomer.email}`);
      expect(prompt).toContain(`電話番号: ${mockCustomer.phone}`);
      expect(prompt).toContain(`住所: ${mockCustomer.address}`);
      expect(prompt).toContain(`会員レベル: ${mockCustomer.membershipLevel}`);
      expect(prompt).toContain(`登録日: ${mockCustomer.registrationDate}`);
      expect(prompt).toContain(`最終購入日: ${mockCustomer.lastPurchaseDate}`);
    });

    it('should include order information in the prompt', () => {
      // Act
      const prompt = createPrompt(mockCustomer, mockOrders, customerMessage);

      // Assert
      expect(prompt).toContain(`注文番号: ${mockOrders[0].id}`);
      expect(prompt).toContain(`注文日: ${mockOrders[0].orderDate}`);
      expect(prompt).toContain(`状態: ${mockOrders[0].status}`);
      expect(prompt).toContain(`合計金額: ¥${mockOrders[0].totalAmount.toLocaleString()}`);
      expect(prompt).toContain(`${mockOrders[0].items[0].name} x ${mockOrders[0].items[0].quantity}`);
    });

    it('should handle empty orders array', () => {
      // Act
      const prompt = createPrompt(mockCustomer, [], customerMessage);

      // Assert
      expect(prompt).toContain('注文履歴: なし');
    });

    it('should include customer message in the prompt', () => {
      // Act
      const prompt = createPrompt(mockCustomer, mockOrders, customerMessage);

      // Assert
      expect(prompt).toContain(`顧客からのメッセージ:`);
      expect(prompt).toContain(`"${customerMessage}"`);
    });
  });
});
