import React from "react";
import { User, Bot } from "lucide-react";
import { Message } from "../types";

interface ChatMessageProps {
  message: Message;
  onActionClick?: (text: string) => void;
  isWidget?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onActionClick,
  isWidget,
}) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`w-full ${isWidget ? "py-4 px-4" : "py-8"} ${!isWidget && !isUser ? "bg-[#212121]" : ""}`}
    >
      <div
        className={`${isWidget ? "" : "max-w-3xl mx-auto px-4 lg:px-0"} flex gap-3`}
      >
        <div
          className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isUser ? "bg-red-600" : "bg-red-600"}`}
        >
          {isUser ? (
            <User size={18} className="text-white" />
          ) : (
            <Bot size={18} className="text-white" />
          )}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          <p className="text-sm font-semibold text-gray-400">
            {isUser ? "You" : "n8n Assistant"}
          </p>
          <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </div>
          {message.actions && message.actions.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              {message.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onActionClick?.(action.value)}
                  className="text-left px-4 py-3 bg-[#2f2f2f] hover:bg-[#3f3f3f] text-red-500 border border-[#3f3f3f] hover:border-red-500/30 rounded-lg text-sm transition-all w-fit"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
