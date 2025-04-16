import { Configuration } from 'openai';

// OpenAI API configuration
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
};

// Initialize OpenAI configuration
export const openaiConfiguration = new Configuration({
  apiKey: openaiConfig.apiKey,
});

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY must be set in environment variables');
}