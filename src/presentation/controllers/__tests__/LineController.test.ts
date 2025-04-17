import { LineController } from '../LineController';
import { CustomerSupportService } from '../../../application/services/CustomerSupportService';
import express from 'express';
import { middleware, WebhookEvent } from '@line/bot-sdk';

// Mock express
jest.mock('express', () => {
  const mockRouter = {
    use: jest.fn(),
    post: jest.fn()
  };
  return {
    Router: jest.fn(() => mockRouter)
  };
});

// Mock @line/bot-sdk
jest.mock('@line/bot-sdk', () => {
  return {
    middleware: jest.fn(),
    WebhookEvent: jest.fn(),
    MessageEvent: jest.fn(),
    TextMessage: jest.fn()
  };
});

describe('LineController', () => {
  // Mock CustomerSupportService
  const mockCustomerSupportService: jest.Mocked<CustomerSupportService> = {
    handleCustomerInquiry: jest.fn(),
    handleStaffResponse: jest.fn()
  };

  // LINE config
  const lineConfig = {
    channelAccessToken: 'test-token',
    channelSecret: 'test-secret'
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set up the router with middleware and routes', () => {
      // Act
      const lineController = new LineController(mockCustomerSupportService, lineConfig);
      const router = express.Router();

      // Assert
      expect(express.Router).toHaveBeenCalled();
      expect(middleware).toHaveBeenCalledWith(lineConfig);
      expect(router.use).toHaveBeenCalled();
      expect(router.post).toHaveBeenCalledWith('/', expect.any(Function));
    });
  });

  describe('getRouter', () => {
    it('should return the router', () => {
      // Arrange
      const lineController = new LineController(mockCustomerSupportService, lineConfig);
      const router = express.Router();

      // Act
      const result = lineController.getRouter();

      // Assert
      expect(result).toBe(router);
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook events and return 200', async () => {
      // Arrange
      const lineController = new LineController(mockCustomerSupportService, lineConfig);
      
      // Mock request and response
      const req = {
        body: {
          events: [
            {
              type: 'message',
              message: {
                type: 'text',
                text: 'Hello'
              },
              replyToken: 'reply-token-123',
              source: {
                userId: 'user123'
              }
            }
          ]
        }
      } as unknown as express.Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        end: jest.fn()
      } as unknown as express.Response;

      // Mock handleEvent method
      const handleEventSpy = jest.spyOn(lineController as any, 'handleEvent').mockResolvedValue(undefined);

      // Act
      await (lineController as any).handleWebhook(req, res);

      // Assert
      expect(handleEventSpy).toHaveBeenCalledWith(req.body.events[0]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle errors and return 500', async () => {
      // Arrange
      const lineController = new LineController(mockCustomerSupportService, lineConfig);
      
      // Mock request and response
      const req = {
        body: {
          events: [
            {
              type: 'message',
              message: {
                type: 'text',
                text: 'Hello'
              }
            }
          ]
        }
      } as unknown as express.Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        end: jest.fn()
      } as unknown as express.Response;

      // Mock handleEvent method to throw an error
      const error = new Error('Test error');
      const handleEventSpy = jest.spyOn(lineController as any, 'handleEvent').mockRejectedValue(error);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act
      await (lineController as any).handleWebhook(req, res);

      // Assert
      expect(handleEventSpy).toHaveBeenCalledWith(req.body.events[0]);
      expect(console.error).toHaveBeenCalledWith('Error handling LINE webhook:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('handleEvent', () => {
    it('should handle text message events', async () => {
      // Arrange
      const lineController = new LineController(mockCustomerSupportService, lineConfig);
      
      // Mock event
      const event = {
        type: 'message',
        message: {
          type: 'text',
          text: 'Hello'
        },
        replyToken: 'reply-token-123',
        source: {
          userId: 'user123'
        }
      };

      // Mock handleTextMessage method
      const handleTextMessageSpy = jest.spyOn(lineController as any, 'handleTextMessage').mockResolvedValue(undefined);

      // Act
      await (lineController as any).handleEvent(event);

      // Assert
      expect(handleTextMessageSpy).toHaveBeenCalledWith(event);
    });

    it('should ignore non-text message events', async () => {
      // Arrange
      const lineController = new LineController(mockCustomerSupportService, lineConfig);
      
      // Mock event
      const event = {
        type: 'message',
        message: {
          type: 'image'
        }
      };

      // Mock handleTextMessage method
      const handleTextMessageSpy = jest.spyOn(lineController as any, 'handleTextMessage');

      // Act
      await (lineController as any).handleEvent(event);

      // Assert
      expect(handleTextMessageSpy).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Arrange
      const lineController = new LineController(mockCustomerSupportService, lineConfig);
      
      // Mock event
      const event = {
        type: 'message',
        message: {
          type: 'text',
          text: 'Hello'
        }
      };

      // Mock handleTextMessage method to throw an error
      const error = new Error('Test error');
      const handleTextMessageSpy = jest.spyOn(lineController as any, 'handleTextMessage').mockRejectedValue(error);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect((lineController as any).handleEvent(event)).rejects.toThrow(error);
      expect(handleTextMessageSpy).toHaveBeenCalledWith(event);
      expect(console.error).toHaveBeenCalledWith('Error in handleEvent:', error);
    });
  });

  describe('handleTextMessage', () => {
    it('should delegate to CustomerSupportService', async () => {
      // Arrange
      const lineController = new LineController(mockCustomerSupportService, lineConfig);
      mockCustomerSupportService.handleCustomerInquiry.mockResolvedValue();
      
      // Mock event
      const event = {
        replyToken: 'reply-token-123',
        source: {
          userId: 'user123'
        },
        message: {
          text: 'Hello'
        }
      };

      // Act
      await (lineController as any).handleTextMessage(event);

      // Assert
      expect(mockCustomerSupportService.handleCustomerInquiry).toHaveBeenCalledWith(
        'user123',
        'Hello',
        'reply-token-123'
      );
    });

    it('should handle missing userId', async () => {
      // Arrange
      const lineController = new LineController(mockCustomerSupportService, lineConfig);
      
      // Mock event with missing userId
      const event = {
        replyToken: 'reply-token-123',
        source: {},
        message: {
          text: 'Hello'
        }
      };

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act
      await (lineController as any).handleTextMessage(event);

      // Assert
      expect(console.error).toHaveBeenCalledWith('Error: userId is undefined');
      expect(mockCustomerSupportService.handleCustomerInquiry).not.toHaveBeenCalled();
    });
  });
});