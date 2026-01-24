import React, { useRef, useEffect } from "react";
import {
  Send,
  AlertCircle,
  X,
  Bot,
  Settings as SettingsIcon,
} from "lucide-react";
import { Message, ChatSession, N8nConfig } from "../types";
import ChatMessage from "./ChatMessage";

interface ChatInterfaceProps {
  currentSession: ChatSession | undefined;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  inputValue: string;
  setInputValue: (val: string) => void;
  onSendMessage: (e?: React.FormEvent, overrideText?: string) => Promise<void>;
  onConfigureClick: () => void;
  config: N8nConfig;
  isWidgetMode: boolean;
  onCloseWidget?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentSession,
  isLoading,
  error,
  setError,
  inputValue,
  setInputValue,
  onSendMessage,
  onConfigureClick,
  config,
  isWidgetMode,
  onCloseWidget,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom effect
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentSession?.messages, isLoading]);

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${isWidgetMode ? "bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#333]" : ""}`}
    >
      {/* Widget Header */}
      {isWidgetMode && (
        <div className="h-14 flex items-center justify-between px-4 bg-[#252525] border-b border-[#333] shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">
                MUITO SEGURO
              </h3>
              <p className="text-[10px] text-green-400 font-medium">Online</p>
            </div>
          </div>
          <button
            onClick={onCloseWidget}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#0d0d0d] rounded-t-lg"
      >
        {currentSession && currentSession.messages.length > 0 ? (
          <div
            className={`translate-z-0 ${isWidgetMode ? "pb-4 pt-2" : "pb-32"}`}
          >
            {currentSession.messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onActionClick={(text) => onSendMessage(undefined, text)}
                isWidget={isWidgetMode}
              />
            ))}
            {isLoading && (
              <div
                className={`w-full py-6 ${isWidgetMode ? "bg-transparent px-2" : "bg-[#212121]"}`}
              >
                <div
                  className={`${isWidgetMode ? "" : "max-w-3xl mx-auto px-4 lg:px-0"} flex gap-3`}
                >
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center animate-pulse flex-shrink-0 bg-red-600`}
                  >
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="flex-1 space-y-2 mt-1">
                    <div className="h-2 bg-[#2f2f2f] rounded w-1/4 animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-2 bg-[#2f2f2f] rounded w-3/4 animate-pulse" />
                      <div className="h-2 bg-[#2f2f2f] rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div
              className={`bg-red-600/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_40px_rgba(220,38,38,0.15)] ${isWidgetMode ? "w-16 h-16" : "w-20 h-20"}`}
            >
              <Bot size={isWidgetMode ? 32 : 40} className="text-red-500" />
            </div>
            <h2
              className={`${isWidgetMode ? "text-xl" : "text-2xl"} font-bold text-white mb-2 text-center`}
            >
              {isWidgetMode ? "Olá!" : "n8n Workflow Interface"}
            </h2>
            <p className="text-gray-400 text-center max-w-md mb-8 text-sm">
              {isWidgetMode
                ? "Como posso ajudar você hoje?"
                : "Send messages to your n8n workflow and get instant AI responses. Configure your endpoint in settings to start."}
            </p>

            {!config.webhookUrl && (
              <button
                onClick={onConfigureClick}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <SettingsIcon size={18} />
                Configure Webhook
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        className={`shrink-0 ${isWidgetMode ? "p-3 bg-[#1a1a1a] border-t border-[#333]" : "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pt-10 pb-6"}`}
      >
        <div className={isWidgetMode ? "" : "max-w-3xl mx-auto px-4"}>
          {error && (
            <div className="mb-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-200 text-xs">
              <AlertCircle size={14} className="shrink-0" />
              <p className="truncate">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto p-1 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <form
            onSubmit={onSendMessage}
            className="relative group flex items-center"
          >
            <textarea
              rows={1}
              placeholder={
                isWidgetMode
                  ? "Escreva uma mensagem..."
                  : "Message your n8n workflow..."
              }
              className={`w-full bg-[#212121] border border-[#3f3f3f] focus:border-red-500/50 rounded-2xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 resize-none shadow-xl transition-all ${
                isWidgetMode ? "pl-4 pr-10 py-3 text-sm" : "pl-4 pr-14 py-4"
              }`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`absolute rounded-xl transition-all flex items-center justify-center ${
                inputValue.trim() && !isLoading
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20"
                  : "bg-[#2f2f2f] text-gray-600 cursor-not-allowed"
              } ${isWidgetMode ? "right-2 p-1.5" : "right-3 bottom-3 p-2"}`}
            >
              <Send size={isWidgetMode ? 16 : 20} />
            </button>
          </form>
          {!isWidgetMode && (
            <p className="mt-3 text-[10px] text-gray-500 text-center">
              Responses are generated by your connected n8n workflow. Always
              verify important outputs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
