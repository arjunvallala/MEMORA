import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Brain, ArrowDownRight, ArrowUpRight, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { AgentConfig, ChatMessage } from '../../../shared/types';

interface AgentPanelProps {
  config: AgentConfig;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onClear: () => void;
  isProcessing: boolean;
  providerConfigured: boolean;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  config,
  messages,
  onSendMessage,
  onClear,
  isProcessing,
  providerConfigured
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const text = input.trim();
    setInput('');
    await onSendMessage(text);
  };

  return (
    <div className="bg-paper-50 border border-paper-300 rounded-lg shadow-sm flex flex-col h-[680px] overflow-hidden">
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-paper-300 bg-paper-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar Icon */}
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center font-heading text-lg font-bold text-white shadow-xs"
            style={{ backgroundColor: config.accentColor }}
          >
            {config.avatar}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-heading text-lg font-bold text-ink-900 leading-none">{config.name}</h3>
              <span className="text-xs uppercase px-1.5 py-0.5 rounded font-mono font-semibold bg-paper-200 text-ink-700 border border-paper-300">
                {config.provider}
              </span>
            </div>
            <p className="text-xs font-semibold text-ink-500">{config.role}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          {providerConfigured ? (
            <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>CONNECTED</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>FALLBACK ENGINE</span>
            </span>
          )}

          <button
            onClick={onClear}
            className="p-1 text-ink-400 hover:text-red-600 hover:bg-paper-200 rounded transition"
            title="Clear Chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-paper-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink-400">
            <Brain size={32} className="mb-2 opacity-50 stroke-[1.5]" />
            <p className="text-sm font-semibold">No active conversation</p>
            <p className="text-xs text-ink-400 mt-1 max-w-xs">
              Start talking to {config.name}. Durable findings will automatically sync with Hindsight.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Sender Info */}
              <div className="flex items-center space-x-1.5 mb-1 px-1 text-xs text-ink-500 font-semibold">
                <span>{msg.sender === 'user' ? 'YOU' : config.name.toUpperCase()}</span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] rounded-lg px-3.5 py-2.5 text-sm shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-ink-900 text-paper-50 font-medium'
                    : 'bg-paper-100 border border-paper-300 text-ink-900'
                }`}
              >
                {/* Recalled Memory Attribution Banner */}
                {msg.recalledMemories && msg.recalledMemories.length > 0 && (
                  <div className="mb-2.5 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-blue-800">
                      <ArrowDownRight size={13} className="text-blue-600" />
                      <span>HINDSIGHT RECALL ({msg.recalledMemories.length} memories found)</span>
                    </div>
                    {msg.recalledMemories.map((m) => (
                      <div key={m.id} className="pl-3 border-l-2 border-blue-400 py-0.5">
                        <p className="font-semibold text-blue-950">"{m.content}"</p>
                        <p className="text-[10px] text-blue-600 font-mono mt-0.5">
                          Source: {m.sourceAgent.toUpperCase()} | Category: {m.category}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Message Text */}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* Retained Memory Attribution Banner */}
                {msg.retainedMemory && (
                  <div className="mt-2.5 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-purple-800">
                      <ArrowUpRight size={13} className="text-purple-600" />
                      <span>HINDSIGHT RETAIN (Memory Saved to Shared Bank)</span>
                    </div>
                    <div className="pl-3 border-l-2 border-purple-400 py-0.5">
                      <p className="font-semibold text-purple-950">"{msg.retainedMemory.content}"</p>
                      <p className="text-[10px] text-purple-600 font-mono mt-0.5">
                        Category: {msg.retainedMemory.category.toUpperCase()} | Bank: {msg.retainedMemory.bankId}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-xs font-semibold text-ink-500 p-2 bg-paper-100 rounded border border-paper-300 w-fit animate-pulse">
            <Sparkles size={14} className="text-purple-600 animate-spin" />
            <span>Consulting Hindsight & generating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-paper-300 bg-paper-100 flex items-center space-x-2">
        <input
          type="text"
          placeholder={`Ask ${config.name} (${config.role})...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
          className="flex-1 bg-paper-50 border border-paper-300 rounded px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-800 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="p-2 bg-ink-900 text-paper-50 rounded hover:bg-ink-800 disabled:opacity-40 transition"
          title="Send"
        >
          <Send size={15} />
        </button>
      </form>

    </div>
  );
};
