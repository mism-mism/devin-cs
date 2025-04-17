import { OpenAIApi } from 'openai';
import { AiService } from '../../application/ports/AiService';
import { Customer } from '../../domain/entities/Customer';
import { Order } from '../../domain/entities/Order';

export class OpenAiAdapter implements AiService {
  private openai: OpenAIApi;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(
    openai: OpenAIApi,
    config: { model: string; maxTokens: number; temperature: number }
  ) {
    this.openai = openai;
    this.model = config.model;
    this.maxTokens = config.maxTokens;
    this.temperature = config.temperature;
  }

  async generateSuggestion(
    customer: Customer,
    orders: Order[],
    message: string
  ): Promise<string> {
    try {
      // Create a prompt for the AI
      const prompt = this.createPrompt(customer, orders, message);
      
      // Call OpenAI API
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'あなたは顧客サポートの担当者です。顧客情報と注文履歴を元に、適切な対応を提案してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });
      
      // Extract and return the AI suggestion
      const suggestion = response.data.choices[0]?.message?.content || '提案を生成できませんでした。';
      return suggestion;
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
      throw new Error('Failed to generate AI suggestion');
    }
  }

  private createPrompt(
    customer: Customer,
    orders: Order[],
    message: string
  ): string {
    // Format customer information
    const customerInfo = `
顧客情報:
- 名前: ${customer.name}
- ID: ${customer.id}
- メールアドレス: ${customer.email}
- 電話番号: ${customer.phone}
- 住所: ${customer.address}
- 会員レベル: ${customer.membershipLevel}
- 登録日: ${customer.registrationDate}
- 最終購入日: ${customer.lastPurchaseDate}
`;

    // Format order information
    const orderInfo = orders.length > 0
      ? `
注文履歴:
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
      : '注文履歴: なし\n';

    // Format customer message
    const customerMessage = `
顧客からのメッセージ:
"${message}"
`;

    // Create the full prompt
    const prompt = `
${customerInfo}
${orderInfo}
${customerMessage}

上記の情報を元に、以下の内容を含む対応案を作成してください:
1. 顧客の状況に合わせた適切な挨拶
2. メッセージの内容に対する具体的な回答や提案
3. 顧客の購入履歴や会員レベルに基づいたパーソナライズされた提案
4. 適切な締めの言葉

回答は日本語で、丁寧かつ簡潔に作成してください。
`;

    return prompt;
  }
}