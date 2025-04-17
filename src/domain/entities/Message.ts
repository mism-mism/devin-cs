export interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
  replyToken: string;
}