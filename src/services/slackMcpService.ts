import { slackApp } from '../config/slackConfig';
import { CustomerData, OrderData } from './mockMcpService';
import { generateAiSuggestion } from './openaiService';
import { sendLineReply } from './lineService';

// Interface for MCP message
export interface McpMessage {
  type: string;
  source: string;
  userId: string;
  message: string;
  customerData: {
    customer: CustomerData;
    orders: OrderData[];
  };
  replyToken: string;
}

/**
 * Initialize Slack MCP client
 */
export async function initializeSlackMcpClient(): Promise<void> {
  try {
    // Register event handlers
    registerSlackEventHandlers();

    // Start the Slack app
    await slackApp.start();
    console.log('Slack MCP client started');
  } catch (error) {
    console.error('Error starting Slack MCP client:', error);
    throw error;
  }
}

/**
 * Register Slack event handlers
 */
function registerSlackEventHandlers(): void {
  // Handle button clicks
  slackApp.action('handle_customer', async ({ ack, body, client }) => {
    try {
      // Acknowledge the action
      await ack();

      // Get the payload from the button
      const payload = JSON.parse(body.actions[0].value);
      const { replyToken, userId } = payload;

      // Open a modal to collect the reply message
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'reply_modal',
          private_metadata: JSON.stringify({ replyToken, userId }),
          title: {
            type: 'plain_text',
            text: 'Reply to Customer'
          },
          submit: {
            type: 'plain_text',
            text: 'Send'
          },
          close: {
            type: 'plain_text',
            text: 'Cancel'
          },
          blocks: [
            {
              type: 'input',
              block_id: 'reply_block',
              label: {
                type: 'plain_text',
                text: 'Your reply'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'reply_action',
                multiline: true
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error handling button click:', error);
    }
  });

  // Handle modal submissions
  slackApp.view('reply_modal', async ({ ack, view, body }) => {
    try {
      // Acknowledge the submission
      await ack();

      // Get the values from the modal
      const { replyToken, userId } = JSON.parse(view.private_metadata);
      const replyMessage = view.state.values.reply_block.reply_action.value;

      // Send the reply to the LINE user
      await sendLineReply(replyToken, replyMessage);

      console.log('Reply sent to LINE user');
    } catch (error) {
      console.error('Error handling modal submission:', error);
    }
  });
}

/**
 * Send MCP message to Slack
 * @param mcpMessage The MCP message
 */
export async function sendSlackMcpMessage(mcpMessage: McpMessage): Promise<void> {
  try {
    const { userId, message, customerData, replyToken } = mcpMessage;
    const { customer, orders } = customerData;

    // Generate AI suggestion based on customer data and message
    let aiSuggestion = '';
    try {
      aiSuggestion = await generateAiSuggestion(customer, orders, message);
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
      channel: process.env.SLACK_CHANNEL_ID || 'general',
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
    await slackApp.client.chat.postMessage(slackMessage);
    console.log('Slack MCP message sent successfully');
  } catch (error) {
    console.error('Error sending Slack MCP message:', error);
    throw new Error('Failed to send Slack MCP message');
  }
}
