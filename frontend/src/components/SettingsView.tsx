import React from 'react';
import { Shield, Key, Cpu, Database, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemHealth } from '../../../shared/types';

interface SettingsViewProps {
  health: SystemHealth | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ health }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-paper-300 pb-4">
        <h2 className="font-heading text-2xl font-bold text-ink-900">SETTINGS & ARCHITECTURE</h2>
        <p className="text-sm text-ink-500">
          Environment configuration, provider connectivity, and security parameters for MEMORA.
        </p>
      </div>

      {/* Security Statement Banner */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start space-x-3 text-purple-950 text-sm">
        <Shield size={20} className="text-purple-700 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-purple-900">Zero Secret Leakage Guarantee</h4>
          <p className="mt-0.5 leading-relaxed text-xs">
            API keys are maintained strictly inside server environment variables (<code className="font-mono bg-purple-100 px-1 py-0.5 rounded">.env</code>) and are NEVER exposed to browser clients, React source code, or standard API responses.
          </p>
        </div>
      </div>

      {/* Provider Status Grid */}
      <div className="bg-paper-50 border border-paper-300 rounded-lg p-5 shadow-xs space-y-4">
        <h3 className="font-heading text-lg font-bold text-ink-900 flex items-center space-x-2 border-b border-paper-300 pb-2">
          <Cpu size={18} className="text-ink-700" />
          <span>LLM Provider Status</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* OpenRouter */}
          <div className="p-4 bg-paper-100 border border-paper-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-900">OpenRouter</span>
              {health?.providers && (health.providers as any).openrouter ? (
                <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  <CheckCircle2 size={12} />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  <AlertCircle size={12} />
                  <span>Not Active</span>
                </span>
              )}
            </div>
            <p className="text-xs text-ink-500 font-mono">Env: OPENROUTER_API_KEY</p>
            <p className="text-xs text-ink-700">Model: minimax/minimax-m3</p>
          </div>

          {/* Groq */}
          <div className="p-4 bg-paper-100 border border-paper-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-900">Groq (Llama-3.1)</span>
              {health?.providers.groq ? (
                <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  <CheckCircle2 size={12} />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  <AlertCircle size={12} />
                  <span>Fallback Active</span>
                </span>
              )}
            </div>
            <p className="text-xs text-ink-500 font-mono">Env: GROQ_API_KEY</p>
            <p className="text-xs text-ink-700">Role: Architect (Agent 1)</p>
          </div>

          {/* Google Gemini */}
          <div className="p-4 bg-paper-100 border border-paper-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-900">Google Gemini</span>
              {health?.providers.google ? (
                <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  <CheckCircle2 size={12} />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  <AlertCircle size={12} />
                  <span>Fallback Active</span>
                </span>
              )}
            </div>
            <p className="text-xs text-ink-500 font-mono">Env: GOOGLE_API_KEY</p>
            <p className="text-xs text-ink-700">Role: Researcher (Agent 2)</p>
          </div>

          {/* OpenAI GPT */}
          <div className="p-4 bg-paper-100 border border-paper-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-900">OpenAI GPT</span>
              {health?.providers.openai ? (
                <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  <CheckCircle2 size={12} />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  <AlertCircle size={12} />
                  <span>OpenRouter Fallback</span>
                </span>
              )}
            </div>
            <p className="text-xs text-ink-500 font-mono">Env: OPENAI_API_KEY</p>
            <p className="text-xs text-ink-700">Role: Reviewer (Agent 3)</p>
          </div>

        </div>
      </div>

      {/* Hindsight Service Settings */}
      <div className="bg-paper-50 border border-paper-300 rounded-lg p-5 shadow-xs space-y-3">
        <h3 className="font-heading text-lg font-bold text-ink-900 flex items-center space-x-2 border-b border-paper-300 pb-2">
          <Database size={18} className="text-purple-700" />
          <span>Hindsight Persistent Memory Layer</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-paper-100 rounded border border-paper-300 space-y-1">
            <span className="text-ink-500 font-bold uppercase block">API Base URL</span>
            <span className="text-purple-900 font-bold">{health?.hindsightUrl || 'http://localhost:4000/v1/default'}</span>
          </div>

          <div className="p-3 bg-paper-100 rounded border border-paper-300 space-y-1">
            <span className="text-ink-500 font-bold uppercase block">Active Bank ID</span>
            <span className="text-purple-900 font-bold">{health?.bankId || 'project:payment-platform'}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
