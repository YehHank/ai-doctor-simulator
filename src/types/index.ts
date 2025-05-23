export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  isFeedback?: boolean;
  isError?: boolean;
}
