import express from 'express';
import request from 'supertest';
import { middleware, WebhookEvent } from '@line/bot-sdk';
import { handleLineEvent } from '../../services/lineService';
import { lineRouter } from '../lineController';

// Mock dependencies
jest.mock('@line/bot-sdk', () => ({
  middleware: jest.fn(() => (req: any, res: any, next: any) => next()),
  WebhookEvent: jest.fn(),
}));

jest.mock('../../services/lineService', () => ({
  handleLineEvent: jest.fn(),
}));

jest.mock('../../config/lineConfig', () => ({
  lineConfig: {
    channelAccessToken: 'mock-token',
    channelSecret: 'mock-secret',
  },
}));

describe('lineController', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/webhook', lineRouter);
  });

  describe('POST /webhook', () => {
    it('should process LINE webhook events successfully', async () => {
      // Arrange
      const mockEvent: WebhookEvent = {
        type: 'message',
        message: {
          type: 'text',
          id: 'message-id',
          text: 'Hello, world!',
          quoteToken: 'mock-quote-token',
        },
        replyToken: 'test-reply-token',
        source: {
          type: 'user',
          userId: 'test-user-id',
        },
        timestamp: 123456789,
        mode: 'active',
        webhookEventId: 'webhook-event-id',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      const requestBody = {
        events: [mockEvent],
      };

      (handleLineEvent as jest.Mock).mockResolvedValueOnce(undefined);

      // Act
      const response = await request(app)
        .post('/webhook')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(handleLineEvent).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle multiple events', async () => {
      // Arrange
      const mockEvent1: WebhookEvent = {
        type: 'message',
        message: {
          type: 'text',
          id: 'message-id-1',
          text: 'Hello, world!',
          quoteToken: 'mock-quote-token-1',
        },
        replyToken: 'test-reply-token-1',
        source: {
          type: 'user',
          userId: 'test-user-id-1',
        },
        timestamp: 123456789,
        mode: 'active',
        webhookEventId: 'webhook-event-id-1',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      const mockEvent2: WebhookEvent = {
        type: 'message',
        message: {
          type: 'text',
          id: 'message-id-2',
          text: 'Second message',
          quoteToken: 'mock-quote-token-2',
        },
        replyToken: 'test-reply-token-2',
        source: {
          type: 'user',
          userId: 'test-user-id-2',
        },
        timestamp: 123456790,
        mode: 'active',
        webhookEventId: 'webhook-event-id-2',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      const requestBody = {
        events: [mockEvent1, mockEvent2],
      };

      (handleLineEvent as jest.Mock).mockResolvedValue(undefined);

      // Act
      const response = await request(app)
        .post('/webhook')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(handleLineEvent).toHaveBeenCalledTimes(2);
      expect(handleLineEvent).toHaveBeenCalledWith(mockEvent1);
      expect(handleLineEvent).toHaveBeenCalledWith(mockEvent2);
    });

    it('should return 500 when an error occurs', async () => {
      // Arrange
      const mockEvent: WebhookEvent = {
        type: 'message',
        message: {
          type: 'text',
          id: 'message-id',
          text: 'Hello, world!',
          quoteToken: 'mock-quote-token',
        },
        replyToken: 'test-reply-token',
        source: {
          type: 'user',
          userId: 'test-user-id',
        },
        timestamp: 123456789,
        mode: 'active',
        webhookEventId: 'webhook-event-id',
        deliveryContext: {
          isRedelivery: false,
        },
      };

      const requestBody = {
        events: [mockEvent],
      };

      (handleLineEvent as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      // Act
      const response = await request(app)
        .post('/webhook')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      // Assert
      expect(response.status).toBe(500);
      expect(handleLineEvent).toHaveBeenCalledWith(mockEvent);
    });
  });
});