import { LineMessageAdapter } from '../LineMessageAdapter';
import { Client } from '@line/bot-sdk';

// Mock the LINE SDK Client
jest.mock('@line/bot-sdk', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        replyMessage: jest.fn()
      };
    })
  };
});

describe('LineMessageAdapter', () => {
  // LINE config
  const lineConfig = {
    channelAccessToken: 'test-token',
    channelSecret: 'test-secret'
  };

  // Test parameters
  const replyToken = 'reply-token-123';
  const text = 'Hello, this is a test message';

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message using the LINE client', async () => {
      // Arrange
      const lineMessageAdapter = new LineMessageAdapter(lineConfig);
      const mockClient = new Client(lineConfig);
      mockClient.replyMessage.mockResolvedValue({});

      // Act
      await lineMessageAdapter.sendMessage(replyToken, text);

      // Assert
      expect(mockClient.replyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text
      });
    });

    it('should throw an error when LINE client fails', async () => {
      // Arrange
      const lineMessageAdapter = new LineMessageAdapter(lineConfig);
      const mockClient = new Client(lineConfig);
      const error = new Error('LINE API error');
      mockClient.replyMessage.mockRejectedValue(error);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(lineMessageAdapter.sendMessage(replyToken, text)).rejects.toThrow('Failed to send LINE reply');
      expect(mockClient.replyMessage).toHaveBeenCalledWith(replyToken, {
        type: 'text',
        text
      });
      expect(console.error).toHaveBeenCalledWith('Error sending LINE reply:', error);
    });
  });
});