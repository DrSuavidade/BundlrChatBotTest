
export type Role = 'user' | 'assistant';

export interface Action {
  label: string;
  value: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  actions?: Action[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface N8nConfig {
  webhookUrl: string;
  payloadKey: string;
  responseKey: string;
}
