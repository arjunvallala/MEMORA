import React, { useState, useEffect } from 'react';
import { Search, Brain, Filter, Calendar, Layers, ShieldCheck, Zap, User } from 'lucide-react';
import { HindsightMemory, MemoryCategory } from '../../../shared/types';
import { fetchMemories } from '../api/client';

interface MemoryExplorerProps {
  projectId: string;
  bankId: string;
}

export const MemoryExplorer: React.FC<MemoryExplorerProps> = ({ projectId, bankId }) => {
  const [memories, setMemories] = useState<HindsightMemory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMemory, setActiveMemory] = useState<HindsightMemory | null>(null);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await fetchMemories(projectId, selectedCategory);
      setMemories(data);
    } catch (err: any) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [projectId, selectedCategory]);

  const filteredMemories = memories.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sourceAgent.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Title & Stats Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper-300 pb-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-ink-900">MEMORY EXPLORER</h2>
          <p className="text-sm text-ink-500">
            Query and inspect durable project knowledge stored inside Hindsight bank <code className="font-mono text-purple-900 bg-paper-200 px-1 rounded">{bankId}</code>.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 bg-paper-200 p-1 rounded-md border border-paper-300 text-xs font-bold">
          {['all', 'decision', 'failure', 'lesson', 'requirement', 'preference'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded uppercase tracking-wider transition ${
                selectedCategory === cat
                  ? 'bg-paper-50 text-ink-900 shadow-xs border border-paper-300'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-3 bg-paper-50 p-3 rounded-lg border border-paper-300 shadow-xs">
        <Search size={18} className="text-ink-400 ml-1" />
        <input
          type="text"
          placeholder="Search shared memory by keyword, decision, or agent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-ink-900 focus:outline-none font-medium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-ink-500 hover:text-ink-900">
            Clear
          </button>
        )}
      </div>

      {/* Grid Layout: Memories List & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Memory Items List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-ink-400 font-medium">Loading Hindsight memories...</div>
          ) : filteredMemories.length === 0 ? (
            <div className="py-12 bg-paper-50 border border-paper-300 rounded-lg text-center text-ink-400">
              <Brain size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-sm">No memories found in this bank</p>
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                onClick={() => setActiveMemory(mem)}
                className={`p-4 bg-paper-50 border rounded-lg shadow-xs cursor-pointer transition ${
                  activeMemory?.id === mem.id
                    ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50/20'
                    : 'border-paper-300 hover:border-ink-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded text-white ${
                        mem.sourceAgent === 'groq'
                          ? 'bg-amber-700'
                          : mem.sourceAgent === 'gemini'
                          ? 'bg-blue-700'
                          : 'bg-emerald-700'
                      }`}
                    >
                      {mem.sourceAgent}
                    </span>
                    <span className="text-xs font-mono uppercase text-purple-900 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                      {mem.category}
                    </span>
                  </div>

                  <div className="text-xs text-ink-500 font-mono">
                    {new Date(mem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <p className="text-sm font-semibold text-ink-900 leading-relaxed">
                  "{mem.content}"
                </p>

                <div className="mt-3 flex items-center justify-between text-xs text-ink-500 pt-2 border-t border-paper-200">
                  <span>Recalled: {mem.recalledCount} times</span>
                  <span>Used by: {mem.usedByAgents.length > 0 ? mem.usedByAgents.join(', ').toUpperCase() : 'None yet'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail View Drawer */}
        <div className="bg-paper-50 border border-paper-300 rounded-lg p-5 shadow-sm h-fit">
          <h3 className="font-heading text-lg font-bold text-ink-900 mb-3 border-b border-paper-300 pb-2">
            MEMORY DETAIL
          </h3>

          {activeMemory ? (
            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs uppercase font-bold text-ink-500">Content</label>
                <p className="mt-1 p-3 bg-paper-100 border border-paper-300 rounded text-ink-900 font-semibold leading-relaxed">
                  "{activeMemory.content}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-paper-100 rounded border border-paper-300">
                  <span className="text-ink-500 font-bold block uppercase">Source Agent</span>
                  <span className="font-mono text-ink-900 font-bold uppercase">{activeMemory.sourceAgent}</span>
                </div>

                <div className="p-2.5 bg-paper-100 rounded border border-paper-300">
                  <span className="text-ink-500 font-bold block uppercase">Category</span>
                  <span className="font-mono text-purple-900 font-bold uppercase">{activeMemory.category}</span>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-ink-500 block mb-1">Cross-Agent Attribution Chain</label>
                <div className="space-y-2 p-3 bg-paper-100 rounded border border-paper-300 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    <span>Retained by: <strong className="uppercase">{activeMemory.sourceAgent}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>
                      Recalled by:{' '}
                      <strong>
                        {activeMemory.usedByAgents.length > 0
                          ? activeMemory.usedByAgents.join(', ').toUpperCase()
                          : 'Awaiting cross-agent recall'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-ink-500 font-mono border-t border-paper-300 pt-2">
                Memory ID: <code className="text-ink-900">{activeMemory.id}</code>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-ink-400 text-xs">
              Select a memory on the left to inspect its cross-agent attribution timeline.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
