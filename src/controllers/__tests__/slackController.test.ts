import express from 'express';
import request from 'supertest';
import { sendLineReply } from '../../services/lineService';
import { slackRouter } from '../slackController';

// Mock dependencies
jest.mock('../../services/lineService', () => ({
  sendLineReply: jest.fn(),
}));

describe('slackController', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use('/slack', slackRouter);
  });

  describe('POST /slack/interactions', () => {
    it('should handle block_actions interaction for handle_customer action', async () => {
      // Arrange
      const replyToken = 'test-reply-token';
      const userId = 'test-user-id';
      const triggerId = 'test-trigger-id';
      
      const payload = {
        type: 'block_actions',
        trigger_id: triggerId,
        actions: [
          {
            action_id: 'handle_customer',
            value: JSON.stringify({ replyToken, userId }),
          },
        ],
      };

      // Act
      const response = await request(app)
        .post('/slack/interactions')
        .send(`payload=${encodeURIComponent(JSON.stringify(payload))}`)
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Assert
      expect(response.status).toBe(200);
      // We can't directly test the openReplyModal function since it's not exported,
      // but we can check that the request was processed successfully
    });

    it('should handle view_submission interaction', async () => {
      // Arrange
      const replyToken = 'test-reply-token';
      const userId = 'test-user-id';
      const replyMessage = 'This is a test reply message';
      
      const payload = {
        type: 'view_submission',
        view: {
          private_metadata: JSON.stringify({ replyToken, userId }),
          state: {
            values: {
              reply_block: {
                reply_action: {
                  value: replyMessage,
                },
              },
            },
          },
        },
      };

      (sendLineReply as jest.Mock).mockResolvedValueOnce(undefined);

      // Act
      const response = await request(app)
        .post('/slack/interactions')
        .send(`payload=${encodeURIComponent(JSON.stringify(payload))}`)
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ response_action: 'clear' });
      expect(sendLineReply).toHaveBeenCalledWith(replyToken, replyMessage);
    });

    it('should handle unknown action_id gracefully', async () => {
      // Arrange
      const payload = {
        type: 'block_actions',
        trigger_id: 'test-trigger-id',
        actions: [
          {
            action_id: 'unknown_action',
            value: 'some-value',
          },
        ],
      };

      // Act
      const response = await request(app)
        .post('/slack/interactions')
        .send(`payload=${encodeURIComponent(JSON.stringify(payload))}`)
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Assert
      expect(response.status).toBe(200);
    });

    it('should handle unknown interaction type gracefully', async () => {
      // Arrange
      const payload = {
        type: 'unknown_type',
      };

      // Act
      const response = await request(app)
        .post('/slack/interactions')
        .send(`payload=${encodeURIComponent(JSON.stringify(payload))}`)
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Assert
      expect(response.status).toBe(200);
    });

    it('should return 500 when an error occurs', async () => {
      // Arrange
      const replyToken = 'test-reply-token';
      const userId = 'test-user-id';
      const replyMessage = 'This is a test reply message';
      
      const payload = {
        type: 'view_submission',
        view: {
          private_metadata: JSON.stringify({ replyToken, userId }),
          state: {
            values: {
              reply_block: {
                reply_action: {
                  value: replyMessage,
                },
              },
            },
          },
        },
      };

      (sendLineReply as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      // Act
      const response = await request(app)
        .post('/slack/interactions')
        .send(`payload=${encodeURIComponent(JSON.stringify(payload))}`)
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Assert
      expect(response.status).toBe(500);
    });

    it('should return 500 when payload is invalid JSON', async () => {
      // Act
      const response = await request(app)
        .post('/slack/interactions')
        .send('payload=invalid-json')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Assert
      expect(response.status).toBe(500);
    });
  });
});