import { MessageService } from '../MessageService';
import { MessageRepository } from '../../repositories/MessageRepository';

describe('MessageService', () => {
  // Mock MessageRepository
  const mockMessageRepository: jest.Mocked<MessageRepository> = {
    sendMessage: jest.fn()
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message with reply token and text', async () => {
      // Arrange
      mockMessageRepository.sendMessage.mockResolvedValue();
      const messageService = new MessageService(mockMessageRepository);
      const replyToken = 'reply-token-123';
      const text = 'Hello, this is a test message';

      // Act
      await messageService.sendMessage(replyToken, text);

      // Assert
      expect(mockMessageRepository.sendMessage).toHaveBeenCalledWith(replyToken, text);
    });

    it('should propagate errors from the repository', async () => {
      // Arrange
      const error = new Error('Failed to send message');
      mockMessageRepository.sendMessage.mockRejectedValue(error);
      const messageService = new MessageService(mockMessageRepository);
      const replyToken = 'reply-token-123';
      const text = 'Hello, this is a test message';

      // Act & Assert
      await expect(messageService.sendMessage(replyToken, text)).rejects.toThrow(error);
      expect(mockMessageRepository.sendMessage).toHaveBeenCalledWith(replyToken, text);
    });
  });
});