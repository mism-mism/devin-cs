import { IncomingWebhook } from '@slack/webhook';
import { NotificationRepository, NotificationData } from '../../domain/repositories/NotificationRepository';
import { AiService } from '../../application/ports/AiService';

export class SlackNotificationAdapter implements NotificationRepository {
  private webhook: IncomingWebhook;
  private aiService: AiService;

  constructor(webhookUrl: string, aiService: AiService) {
    this.webhook = new IncomingWebhook(webhookUrl);
    this.aiService = aiService;
  }

  async sendNotification(data: NotificationData): Promise<void> {
    try {
      const { userId, message, customer, orders, replyToken } = data;

      // Generate AI suggestion based on customer data and message
      let aiSuggestion = '';
      try {
        aiSuggestion = await this.aiService.generateSuggestion(customer, orders, message);
      } catch (error) {
        console.error('Error generating AI suggestion:', error);
        aiSuggestion = '※ AI提案の生成に失敗しました';
      }

      // Format recent orders
      const recentOrdersText = orders.length > 0
        ? orders.slice(0, 3).map(order => {
            return `• 注文番号: ${order.id} | 日付: ${order.orderDate} | 状態: ${order.status} | 金額: ¥${order.totalAmount.toLocaleString()}`;
          }).join('\n')
        : '最近の注文はありません';

      // Create Slack message
      const slackMessage = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🔔 新しいLINEメッセージが届きました',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*顧客名:*\n${customer.name}`
              },
              {
                type: 'mrkdwn',
                text: `*会員レベル:*\n${customer.membershipLevel}`
              }
            ]
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*顧客ID:*\n${customer.id}`
              },
              {
                type: 'mrkdwn',
                text: `*最終購入日:*\n${customer.lastPurchaseDate}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*メッセージ:*\n${message}`
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*最近の注文:*\n${recentOrdersText}`
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*AI提案:*\n${aiSuggestion}`
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '対応する',
                  emoji: true
                },
                value: JSON.stringify({ replyToken, userId }),
                action_id: 'handle_customer'
              }
            ]
          }
        ]
      };

      // Send message to Slack
      await this.webhook.send(slackMessage);
      console.log('Slack notification sent successfully');
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      throw new Error('Failed to send Slack notification');
    }
  }
}