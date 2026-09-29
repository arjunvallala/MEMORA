import React, { useState } from 'react';
import { Brain, X, Sparkles, Database, Layers, CheckCircle2 } from 'lucide-react';
import { ReflectResponse } from '../../../shared/types';
import { askTeamMemory } from '../api/client';

interface AskTeamMemoryModalProps {
  projectId: string;
  bankId: string;
  onClose: () => void;
}

export const AskTeamMemoryModal: React.FC<AskTeamMemoryModalProps> = ({ projectId, bankId, onClose }) => {
  const [query, setQuery] = useState('What has the team learned about the architecture so far?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReflectResponse | null>(null);

  const handleReflect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const res = await askTeamMemory(projectId, query.trim());
      setResult(res);
    } catch (err: any) {
      alert('Reflect failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-paper-50 border border-paper-300 rounded-lg p-6 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-paper-300 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-purple-100 text-purple-800 rounded">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-ink-900 leading-none">ASK TEAM MEMORY</h3>
              <p className="text-xs text-ink-500 mt-0.5">
                Hindsight REFLECT operation — synthesizes reasoning across memories retained by Claude, Gemini, and GPT.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-ink-400 hover:text-ink-900 hover:bg-paper-200 rounded transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Query Form */}
        <form onSubmit={handleReflect} className="space-y-3 mb-4">
          <div>
            <label className="block text-xs uppercase font-bold text-ink-700 mb-1">
              Ask a question across shared team memory:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. What database and caching decisions were made?"
                className="flex-1 bg-paper-100 border border-paper-300 rounded px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-1 focus:ring-purple-700 font-medium"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" />
                    <span>Reflecting...</span>
                  </>
                ) : (
                  <>
                    <Brain size={16} />
                    <span>Synthesize</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick preset questions */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="text-ink-400 self-center">Presets:</span>
            {[
              'What database should we use for transactional data?',
              'What caching approach should we avoid?',
              'What architectural decisions have been retained so far?'
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuery(preset)}
                className="px-2 py-0.5 bg-paper-200 hover:bg-paper-300 border border-paper-300 rounded text-ink-700"
              >
                {preset}
              </button>
            ))}
          </div>
        </form>

        {/* Reflection Output Result */}
        {result && (
          <div className="flex-1 overflow-y-auto space-y-4 bg-paper-100/80 p-4 border border-paper-300 rounded-md">
            
            {/* Synthesized Answer */}
            <div>
              <div className="flex items-center space-x-2 mb-1.5 text-xs font-bold uppercase tracking-wider text-purple-900">
                <Sparkles size={14} className="text-purple-700" />
                <span>HINDSIGHT REFLECT SYNTHESIS</span>
              </div>
              <div className="p-3.5 bg-white border border-purple-200 rounded text-sm text-ink-900 leading-relaxed font-normal whitespace-pre-wrap">
                {result.answer}
              </div>
            </div>

            {/* Supporting Memories Citations */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">
                Supporting Memories ({result.supportingMemories.length} retrieved from bank {bankId}):
              </h4>
              <div className="space-y-2">
                {result.supportingMemories.map((mem) => (
                  <div key={mem.id} className="p-2.5 bg-paper-50 border border-paper-300 rounded text-xs">
                    <div className="flex items-center justify-between font-bold text-ink-900 mb-0.5">
                      <span className="uppercase font-mono text-purple-800">Source: {mem.sourceAgent.toUpperCase()}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-paper-200 rounded text-ink-600">
                        Category: {mem.category}
                      </span>
                    </div>
                    <p className="text-ink-800 italic font-medium">"{mem.content}"</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
