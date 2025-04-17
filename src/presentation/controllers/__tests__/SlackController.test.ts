import { SlackController } from '../SlackController';
import { CustomerSupportService } from '../../../application/services/CustomerSupportService';
import express from 'express';

// Mock express
jest.mock('express', () => {
  const mockRouter = {
    post: jest.fn()
  };
  return {
    Router: jest.fn(() => mockRouter)
  };
});

describe('SlackController', () => {
  // Mock CustomerSupportService
  const mockCustomerSupportService: jest.Mocked<CustomerSupportService> = {
    handleCustomerInquiry: jest.fn(),
    handleStaffResponse: jest.fn()
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set up the router with routes', () => {
      // Act
      const slackController = new SlackController(mockCustomerSupportService);
      const router = express.Router();

      // Assert
      expect(express.Router).toHaveBeenCalled();
      expect(router.post).toHaveBeenCalledWith('/interactions', expect.any(Function));
    });
  });

  describe('getRouter', () => {
    it('should return the router', () => {
      // Arrange
      const slackController = new SlackController(mockCustomerSupportService);
      const router = express.Router();

      // Act
      const result = slackController.getRouter();

      // Assert
      expect(result).toBe(router);
    });
  });

  describe('handleInteractions', () => {
    it('should handle block_actions interactions', async () => {
      // Arrange
      const slackController = new SlackController(mockCustomerSupportService);
      
      // Mock request and response
      const req = {
        body: {
          payload: JSON.stringify({
            type: 'block_actions',
            trigger_id: 'trigger-123',
            actions: [
              {
                action_id: 'handle_customer',
                value: JSON.stringify({
                  replyToken: 'reply-token-123',
                  userId: 'user123'
                })
              }
            ]
          })
        }
      } as unknown as express.Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        end: jest.fn()
      } as unknown as express.Response;

      // Mock openReplyModal method
      const openReplyModalSpy = jest.spyOn(slackController as any, 'openReplyModal').mockResolvedValue(undefined);

      // Act
      await (slackController as any).handleInteractions(req, res);

      // Assert
      expect(openReplyModalSpy).toHaveBeenCalledWith(
        'trigger-123',
        'reply-token-123',
        'user123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle view_submission interactions', async () => {
      // Arrange
      const slackController = new SlackController(mockCustomerSupportService);
      mockCustomerSupportService.handleStaffResponse.mockResolvedValue();
      
      // Mock request and response
      const req = {
        body: {
          payload: JSON.stringify({
            type: 'view_submission',
            view: {
              private_metadata: JSON.stringify({
                replyToken: 'reply-token-123',
                userId: 'user123'
              }),
              state: {
                values: {
                  reply_block: {
                    reply_action: {
                      value: 'Thank you for your inquiry. We will process your order soon.'
                    }
                  }
                }
              }
            }
          })
        }
      } as unknown as express.Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as express.Response;

      // Act
      await (slackController as any).handleInteractions(req, res);

      // Assert
      expect(mockCustomerSupportService.handleStaffResponse).toHaveBeenCalledWith(
        'reply-token-123',
        'Thank you for your inquiry. We will process your order soon.'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ response_action: 'clear' });
    });

    it('should handle other interaction types', async () => {
      // Arrange
      const slackController = new SlackController(mockCustomerSupportService);
      
      // Mock request and response
      const req = {
        body: {
          payload: JSON.stringify({
            type: 'other_type'
          })
        }
      } as unknown as express.Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        end: jest.fn()
      } as unknown as express.Response;

      // Act
      await (slackController as any).handleInteractions(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Arrange
      const slackController = new SlackController(mockCustomerSupportService);
      
      // Mock request and response
      const req = {
        body: {
          payload: 'invalid-json'
        }
      } as unknown as express.Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        end: jest.fn()
      } as unknown as express.Response;

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act
      await (slackController as any).handleInteractions(req, res);

      // Assert
      expect(console.error).toHaveBeenCalledWith('Error handling Slack interaction:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('openReplyModal', () => {
    it('should log modal information', async () => {
      // Arrange
      const slackController = new SlackController(mockCustomerSupportService);
      
      // Spy on console.log
      jest.spyOn(console, 'log').mockImplementation();

      // Act
      await (slackController as any).openReplyModal('trigger-123', 'reply-token-123', 'user123');

      // Assert
      expect(console.log).toHaveBeenCalledWith('Opening reply modal with:', {
        triggerId: 'trigger-123',
        replyToken: 'reply-token-123',
        userId: 'user123'
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const slackController = new SlackController(mockCustomerSupportService);
      
      // Mock console.log to throw an error
      const error = new Error('Test error');
      jest.spyOn(console, 'log').mockImplementation(() => {
        throw error;
      });

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect((slackController as any).openReplyModal('trigger-123', 'reply-token-123', 'user123'))
        .rejects.toThrow(error);
      expect(console.error).toHaveBeenCalledWith('Error opening reply modal:', error);
    });
  });
});