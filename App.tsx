
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Bot
} from 'lucide-react';
import { ChatSession, Message, N8nConfig } from './types';
import ChatMessage from './components/ChatMessage';
import SettingsModal from './components/SettingsModal';
import { sendMessageToN8n } from './services/n8nService';

const App: React.FC = () => {
  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<N8nConfig>(() => {
    const saved = localStorage.getItem('n8n-config');
    return saved ? JSON.parse(saved) : {
      webhookUrl: '',
      payloadKey: 'chatInput',
      responseKey: 'output'
    };
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    const savedSessions = localStorage.getItem('chat-sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('n8n-config', JSON.stringify(config));
  }, [config]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const startNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
    setError(null);
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    if (!config.webhookUrl) {
      setError('Please configure your n8n Webhook URL first.');
      setIsSettingsOpen(true);
      return;
    }

    const text = inputValue.trim();
    setInputValue('');
    setError(null);

    // Ensure session exists
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        messages: [],
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      activeSessionId = newSession.id;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMsg],
            title: s.messages.length === 0 ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : s.title
          } 
        : s
    ));

    setIsLoading(true);

    try {
      const response = await sendMessageToN8n(config, text);
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...s.messages, assistantMsg] } 
          : s
      ));
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to n8n');
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${err.message || 'Could not reach n8n. Please check your webhook URL and configuration.'}`,
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...s.messages, errorMsg] } 
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
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
      <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-[#171717] border-r border-[#2f2f2f] transform transition-transform duration-200 ease-in-out z-50 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); }}
                className={`group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all ${
                  currentSessionId === s.id ? 'bg-[#2f2f2f] text-white' : 'text-gray-400 hover:bg-[#212121] hover:text-gray-200'
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
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">No Recent Chats</p>
                <div className="w-12 h-12 bg-[#212121] rounded-full flex items-center justify-center mx-auto text-gray-600">
                  <MessageSquare size={20} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-[#2f2f2f] space-y-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-[#212121] rounded-lg transition-all"
            >
              <SettingsIcon size={18} />
              <span className="text-sm">Settings</span>
            </button>
            <div className="px-3 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                U
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-gray-300 truncate">Demo User</p>
                <p className="text-[10px] text-gray-500 truncate">n8n Connected</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 bg-[#0d0d0d] border-b border-[#2f2f2f] shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-medium text-gray-200 truncate max-w-[200px] sm:max-w-md">
              {currentSession?.title || 'n8n Chat Interface'}
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

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          {currentSession && currentSession.messages.length > 0 ? (
            <div className="pb-32">
              {currentSession.messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="w-full py-8 bg-[#212121]">
                  <div className="max-w-3xl mx-auto flex gap-4 px-4 lg:px-0">
                    <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center animate-pulse">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-[#2f2f2f] rounded w-1/4 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 bg-[#2f2f2f] rounded w-full animate-pulse" />
                        <div className="h-3 bg-[#2f2f2f] rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-[0_0_40px_rgba(79,70,229,0.15)]">
                <Bot size={40} className="text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">n8n Workflow Interface</h2>
              <p className="text-gray-400 text-center max-w-md mb-8">
                Send messages to your n8n webhook and get instant AI responses. Configure your endpoint in settings to start.
              </p>
              
              {!config.webhookUrl && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <SettingsIcon size={18} />
                  Configure Webhook
                </button>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pt-10 pb-6">
          <div className="max-w-3xl mx-auto px-4">
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-200 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
                <button onClick={() => setError(null)} className="ml-auto p-1 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="relative group">
              <textarea
                rows={1}
                placeholder="Message your n8n workflow..."
                className="w-full bg-[#212121] border border-[#3f3f3f] focus:border-indigo-500/50 rounded-2xl pl-4 pr-14 py-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none shadow-xl transition-all"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
                  inputValue.trim() && !isLoading 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20' 
                    : 'bg-[#2f2f2f] text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send size={20} />
              </button>
            </form>
            <p className="mt-3 text-[10px] text-gray-500 text-center">
              Responses are generated by your connected n8n workflow. Always verify important outputs.
            </p>
          </div>
        </div>
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
