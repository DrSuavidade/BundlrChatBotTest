
import React from 'react';
import { User, Bot } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`w-full py-8 ${isUser ? 'bg-transparent' : 'bg-[#212121]'}`}>
      <div className="max-w-3xl mx-auto flex gap-4 px-4 lg:px-0">
        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          <p className="text-sm font-semibold text-gray-400">
            {isUser ? 'You' : 'n8n Assistant'}
          </p>
          <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
