import { IncomingWebhook } from '@slack/webhook';
import { App } from '@slack/bolt';

// Slack configuration
export const slackConfig = {
  webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  botToken: process.env.SLACK_BOT_TOKEN || '',
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  appToken: process.env.SLACK_APP_TOKEN || '',
};

// Initialize Slack webhook client
export const slackWebhook = new IncomingWebhook(slackConfig.webhookUrl);

// Initialize Slack Bolt app
export const slackApp = new App({
  token: slackConfig.botToken,
  signingSecret: slackConfig.signingSecret,
  socketMode: true,
  appToken: slackConfig.appToken,
});

// Validate required environment variables
if (!process.env.SLACK_WEBHOOK_URL || !process.env.SLACK_BOT_TOKEN || 
    !process.env.SLACK_SIGNING_SECRET || !process.env.SLACK_APP_TOKEN) {
  console.warn('SLACK_WEBHOOK_URL, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, and SLACK_APP_TOKEN must be set in environment variables');
}
