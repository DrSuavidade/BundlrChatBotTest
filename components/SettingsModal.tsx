
import React, { useState } from 'react';
import { X, Settings, Link2, Key, MessageSquare } from 'lucide-react';
import { N8nConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: N8nConfig;
  onSave: (config: N8nConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<N8nConfig>(config);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#171717] border border-[#2f2f2f] rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2f2f2f]">
          <div className="flex items-center gap-2">
            <Settings className="text-gray-400" size={20} />
            <h2 className="text-xl font-bold text-white">n8n Configuration</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Link2 size={16} /> Webhook URL
              </label>
              <input
                type="url"
                required
                placeholder="https://your-n8n-instance.com/webhook/..."
                className="w-full bg-[#212121] border border-[#3f3f3f] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={localConfig.webhookUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, webhookUrl: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">The URL of your n8n Webhook node.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Key size={16} /> Input Key
                </label>
                <input
                  type="text"
                  placeholder="chatInput"
                  className="w-full bg-[#212121] border border-[#3f3f3f] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={localConfig.payloadKey}
                  onChange={(e) => setLocalConfig({ ...localConfig, payloadKey: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <MessageSquare size={16} /> Response Key
                </label>
                <input
                  type="text"
                  placeholder="output"
                  className="w-full bg-[#212121] border border-[#3f3f3f] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={localConfig.responseKey}
                  onChange={(e) => setLocalConfig({ ...localConfig, responseKey: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Configure which JSON keys to use for sending text and receiving the answer.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#3f3f3f] rounded-lg text-gray-300 hover:bg-[#212121] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 rounded-lg text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
