import React from 'react';
import { MemoryStats } from '../../../shared/types';
import { Database, ShieldCheck, Zap, BookOpen, Users } from 'lucide-react';

interface SharedMemoryStripProps {
  stats: MemoryStats | null;
  bankId: string;
  lastEventSummary?: string;
}

export const SharedMemoryStrip: React.FC<SharedMemoryStripProps> = ({ stats, bankId, lastEventSummary }) => {
  return (
    <div className="bg-paper-50 border-b border-paper-300 px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Bank Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-ink-900">
            <Database size={16} className="text-purple-700" />
            <span className="font-heading text-sm font-bold uppercase tracking-wider">Hindsight Shared Bank:</span>
            <code className="text-xs bg-paper-200 px-2 py-0.5 rounded border border-paper-300 font-mono text-purple-900">
              {bankId}
            </code>
          </div>
        </div>

        {/* Center: Stat Badges */}
        <div className="flex items-center space-x-6 text-sm font-semibold">
          <div className="flex items-center space-x-1.5 text-ink-800">
            <BookOpen size={15} className="text-ink-500" />
            <span>{stats?.totalMemories || 0}</span>
            <span className="text-ink-500 text-xs font-normal">Memories</span>
          </div>

          <div className="flex items-center space-x-1.5 text-ink-800">
            <ShieldCheck size={15} className="text-amber-600" />
            <span>{stats?.decisionsCount || 0}</span>
            <span className="text-ink-500 text-xs font-normal">Decisions</span>
          </div>

          <div className="flex items-center space-x-1.5 text-ink-800">
            <Zap size={15} className="text-emerald-600" />
            <span>{stats?.lessonsCount || 0}</span>
            <span className="text-ink-500 text-xs font-normal">Lessons</span>
          </div>

          <div className="flex items-center space-x-1.5 text-ink-800">
            <Users size={15} className="text-blue-600" />
            <span>3</span>
            <span className="text-ink-500 text-xs font-normal">Independent Agents</span>
          </div>
        </div>

        {/* Right: Live Activity Ticker */}
        <div className="flex items-center space-x-2 text-xs font-medium text-ink-700 bg-paper-200/80 px-3 py-1 rounded border border-paper-300">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
          <span className="truncate max-w-xs font-mono">
            {lastEventSummary || 'Hindsight TEMPR retrieval active'}
          </span>
        </div>

      </div>
    </div>
  );
};
