import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Settings as SettingsIcon,
  Send,
  Trash2,
  MessageSquare,
  Menu,
  X,
  AlertCircle,
  // Added Bot to imports to fix "Cannot find name 'Bot'" errors
  Bot,
  Layout,
  MessageCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ChatSession, Message, N8nConfig, Action } from "./types";
import ChatInterface from "./components/ChatInterface";
import MockWebsite from "./components/MockWebsite";
import SettingsModal from "./components/SettingsModal";
import { sendMessageToN8n } from "./services/n8nService";

const App: React.FC = () => {
  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWidgetMode, setIsWidgetMode] = useState(true);
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [config, setConfig] = useState<N8nConfig>(() => {
    const saved = localStorage.getItem("n8n-config");
    return saved
      ? JSON.parse(saved)
      : {
          webhookUrl:
            "https://n8n.srv1068628.hstgr.cloud/webhook/02f872dd-4bfb-484d-bc18-2a81f28fe05c",
          payloadKey: "chatInput",
          responseKey: "output",
        };
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Widget Toggle Effect
  useEffect(() => {
    if (isWidgetMode) {
      // If we have sessions, open it. If not, start closed.
      setIsWidgetOpen(sessions.length > 0);
    }
  }, [isWidgetMode]); // Dependency mainly on mode switch

  const handleOpenWidget = () => {
    setIsWidgetOpen(true);
    if (sessions.length === 0) {
      startNewChat();
    }
  };

  // Persistence
  useEffect(() => {
    const savedSessions = localStorage.getItem("chat-sessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chat-sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("n8n-config", JSON.stringify(config));
  }, [config]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const createWelcomeMessage = (): Message => ({
    id: `welcome-${Date.now()}`,
    role: "assistant",
    content:
      "Bem vindo ao assistente da MUITO SEGURO\n\nEm que posso ser util?:",
    timestamp: Date.now(),
    actions: [
      {
        label: "1) Simulação (Vida / Auto / Saúde / Poupanças / Empresas)",
        value: "Quero realizar uma simulação",
      },
      {
        label: "2) Estado de um pedido",
        value: "Quero saber o estado de um pedido",
      },
      {
        label: "3) Participar sinistro",
        value: "Quero participar um sinistro",
      },
    ],
  });

  const startNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [createWelcomeMessage()],
      createdAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
    setError(null);
    if (isWidgetMode) {
      setIsWidgetOpen(true);
    }
  }, [isWidgetMode]);

  const handleSendMessage = async (
    e?: React.FormEvent,
    overrideText?: string,
  ) => {
    if (e) e.preventDefault();

    const text = overrideText || inputValue.trim();
    if (!text || isLoading) return;

    if (!config.webhookUrl) {
      setError("Please configure your n8n Webhook URL first.");
      setIsSettingsOpen(true);
      return;
    }

    if (!overrideText) {
      setInputValue("");
    }
    setError(null);

    // Ensure session exists
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
        messages: [createWelcomeMessage()], // Add welcome message to auto-created session too, though it will appear before the user msg
        createdAt: Date.now(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      activeSessionId = newSession.id;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...s.messages, userMsg],
              title:
                s.title === "New Chat"
                  ? text.slice(0, 30) + (text.length > 30 ? "..." : "")
                  : s.title,
            }
          : s,
      ),
    );

    setIsLoading(true);

    try {
      const response = await sendMessageToN8n(config, text, activeSessionId);
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, assistantMsg] }
            : s,
        ),
      );
    } catch (err: any) {
      setError(err.message || "An error occurred while connecting to n8n");
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `❌ Error: ${err.message || "Could not reach n8n. Please check your webhook URL and configuration."}`,
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      if (isWidgetMode) {
        setIsWidgetOpen(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#0d0d0d] overflow-hidden">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 bg-[#171717] border-r border-[#2f2f2f] transform transition-all duration-200 ease-in-out z-50 flex flex-col 
          ${isSidebarCollapsed ? "w-0 lg:w-0 overflow-hidden" : "w-64"} 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Fixed closing tag mismatch below */}
          <button
            onClick={startNewChat}
            className="flex items-center gap-3 w-full px-4 py-3 bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white rounded-lg transition-colors border border-[#3f3f3f] mb-4"
          >
            <Plus size={18} />
            <span className="font-medium text-sm">New Chat</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSessionId(s.id);
                  setIsSidebarOpen(false);
                }}
                className={`group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all ${
                  currentSessionId === s.id
                    ? "bg-[#2f2f2f] text-white"
                    : "text-gray-400 hover:bg-[#212121] hover:text-gray-200"
                }`}
              >
                <MessageSquare size={16} className="shrink-0" />
                <span className="text-sm truncate flex-1">{s.title}</span>
                <button
                  onClick={(e) => deleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-10">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                  No Recent Chats
                </p>
                <div className="w-12 h-12 bg-[#212121] rounded-full flex items-center justify-center mx-auto text-gray-600">
                  <MessageSquare size={20} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-[#2f2f2f] space-y-2">
            <button
              onClick={() => setIsWidgetMode(!isWidgetMode)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all ${
                isWidgetMode
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#212121]"
              }`}
            >
              {isWidgetMode ? <Layout size={18} /> : <Eye size={18} />}
              <span className="text-sm">
                {isWidgetMode ? "Widget Mode" : "Full Chat Mode"}
              </span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-[#212121] rounded-lg transition-all"
            >
              <SettingsIcon size={18} />
              <span className="text-sm">Settings</span>
            </button>
            <div className="px-3 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                U
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-gray-300 truncate">
                  Muito Seguro Chatbot
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  Bundlr Productions
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden bg-[#0d0d0d]">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden lg:flex absolute top-4 left-4 z-20 p-2 rounded-lg bg-[#171717] border border-[#2f2f2f] text-gray-400 hover:text-white hover:border-gray-500 transition-all ${isSidebarCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronRight size={20} />
        </button>
        {!isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="hidden lg:flex absolute bottom-4 left-0 z-20 p-1 bg-[#171717] border-y border-r border-[#2f2f2f] text-gray-400 hover:text-white rounded-r items-center justify-center h-10 w-6"
            style={{ left: "0" }}
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {isWidgetMode ? (
          <div className="relative w-full h-full">
            <MockWebsite />
            {/* Widget Container */}
            <div
              className={`fixed bottom-6 right-6 z-30 transition-all duration-300 ease-in-out flex flex-col
              ${isWidgetOpen ? "w-[380px] h-[600px] opacity-100 translate-y-0" : "w-14 h-14 opacity-100 translate-y-0 overflow-hidden rounded-full"}
            `}
            >
              {isWidgetOpen ? (
                <ChatInterface
                  currentSession={currentSession}
                  isLoading={isLoading}
                  error={error}
                  setError={setError}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onSendMessage={handleSendMessage}
                  onConfigureClick={() => setIsSettingsOpen(true)}
                  config={config}
                  isWidgetMode={true}
                  onCloseWidget={() => setIsWidgetOpen(false)}
                />
              ) : (
                <button
                  onClick={handleOpenWidget}
                  className="w-full h-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors"
                >
                  <MessageCircle size={28} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="h-14 flex items-center justify-between px-4 lg:px-6 bg-[#0d0d0d] border-b border-[#2f2f2f] shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-400 hover:text-white"
                >
                  <Menu size={20} />
                </button>
                {isSidebarCollapsed && (
                  <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="hidden lg:flex p-2 text-gray-400 hover:text-white items-center gap-2"
                  >
                    <Menu size={20} />
                  </button>
                )}
                <h1 className="text-sm font-medium text-gray-200 truncate max-w-[200px] sm:max-w-md">
                  {currentSession?.title || "n8n Chat Interface"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <SettingsIcon size={18} />
                </button>
              </div>
            </header>

            <ChatInterface
              currentSession={currentSession}
              isLoading={isLoading}
              error={error}
              setError={setError}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSendMessage={handleSendMessage}
              onConfigureClick={() => setIsSettingsOpen(true)}
              config={config}
              isWidgetMode={false}
            />
          </>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={setConfig}
      />
    </div>
  );
};

export default App;
