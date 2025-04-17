import { lineConfig } from '../../config/lineConfig';
import { openaiConfig, openaiConfiguration } from '../../config/openaiConfig';
import { slackWebhook } from '../../config/slackConfig';

export const config = {
  line: lineConfig,
  openai: {
    configuration: openaiConfiguration,
    config: openaiConfig
  },
  slack: {
    webhookUrl: slackWebhook.url
  }
};