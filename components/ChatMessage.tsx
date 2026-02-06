import React, { useState } from "react";
import { User, Bot } from "lucide-react";
import { Message, Action } from "../types";

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
  const [expandedActionIndex, setExpandedActionIndex] = useState<number | null>(
    null,
  );

  const handleActionClick = (action: Action, index: number) => {
    if (action.subActions && action.subActions.length > 0) {
      // Toggle expanded state for actions with sub-actions
      setExpandedActionIndex(expandedActionIndex === index ? null : index);
    } else {
      // Direct send for actions without sub-actions
      onActionClick?.(action.value);
    }
  };

  const handleSubActionClick = (value: string) => {
    onActionClick?.(value);
    setExpandedActionIndex(null);
  };

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
            {isUser ? "You" : "Assistente Muito Seguro"}
          </p>
          <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </div>
          {message.actions && message.actions.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              {message.actions.map((action, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <button
                    onClick={() => handleActionClick(action, index)}
                    className={`text-left px-4 py-3 bg-[#2f2f2f] hover:bg-[#3f3f3f] text-red-500 border border-[#3f3f3f] hover:border-red-500/30 rounded-lg text-sm transition-all w-fit ${
                      expandedActionIndex === index
                        ? "border-red-500/50 bg-[#3f3f3f]"
                        : ""
                    }`}
                  >
                    {action.label}
                  </button>

                  {/* Sub-actions section */}
                  {expandedActionIndex === index && action.subActions && (
                    <div className="ml-4 pl-4 border-l-2 border-red-500/30 space-y-2">
                      {action.subPrompt && (
                        <p className="text-sm text-gray-300 py-2">
                          {action.subPrompt}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {action.subActions.map((subAction, subIndex) => (
                          <button
                            key={subIndex}
                            onClick={() =>
                              handleSubActionClick(subAction.value)
                            }
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg text-sm transition-all"
                          >
                            {subAction.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
