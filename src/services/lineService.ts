import { Client, WebhookEvent, MessageEvent, TextMessage } from '@line/bot-sdk';
import { lineConfig } from '../config/lineConfig';
import { getMockCustomerData } from './mockMcpService';
import { sendSlackNotification } from './slackService';

// Initialize LINE client
const lineClient = new Client(lineConfig);

/**
 * Send a reply to a LINE user
 * @param replyToken The reply token from LINE
 * @param message The message to send
 */
export async function sendLineReply(replyToken: string, message: string): Promise<void> {
  try {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: message
    });
    console.log('LINE reply sent successfully');
  } catch (error) {
    console.error('Error sending LINE reply:', error);
    throw new Error('Failed to send LINE reply');
  }
}

/**
 * Handle LINE webhook events
 * @param event The webhook event from LINE
 */
export async function handleLineEvent(event: WebhookEvent): Promise<void> {
  try {
    // Handle message events
    if (event.type === 'message' && event.message.type === 'text') {
      await handleTextMessage(event);
    }
  } catch (error) {
    console.error('Error in handleLineEvent:', error);
    throw error;
  }
}

/**
 * Handle text messages from LINE
 * @param event The message event from LINE
 */
async function handleTextMessage(event: MessageEvent & { message: TextMessage }): Promise<void> {
  const { replyToken, source, message } = event;
  const userId = source.userId;
  const text = message.text;

  try {
    // Get customer data from mock MCP server
    const customerData = await getMockCustomerData(userId);

    // Send notification to Slack with customer data and message
    await sendSlackNotification({
      userId,
      message: text,
      customerData,
      replyToken
    });

    // Send acknowledgment to user
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: 'ありがとうございます。担当者に通知しました。'
    });
  } catch (error) {
    console.error('Error handling text message:', error);

    // Send error message to user
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: 'メッセージの処理中にエラーが発生しました。しばらくしてからもう一度お試しください。'
    });
  }
}
