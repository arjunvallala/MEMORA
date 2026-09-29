import React from 'react';
import { MemoryEvent } from '../../../shared/types';
import { ArrowDownRight, ArrowUpRight, Brain, Activity, Clock, ShieldCheck } from 'lucide-react';

interface SharedMemoryActivityPanelProps {
  events: MemoryEvent[];
}

export const SharedMemoryActivityPanel: React.FC<SharedMemoryActivityPanelProps> = ({ events }) => {
  return (
    <div className="bg-paper-50 border border-paper-300 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-paper-300 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Activity size={18} className="text-purple-700" />
          <h3 className="font-heading text-lg font-bold text-ink-900">Shared Memory Activity Feed</h3>
        </div>
        <span className="text-xs font-mono font-semibold text-ink-500 bg-paper-200 px-2 py-0.5 rounded">
          REAL-TIME HINDSIGHT EVENT STREAM
        </span>
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-ink-400 text-sm font-medium">
          No memory activity recorded yet. Start conversing with agents above.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`p-2.5 rounded border text-xs flex items-start justify-between transition ${
                evt.operation === 'retain'
                  ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                  : evt.operation === 'recall'
                  ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                {/* Operation Icon */}
                <div className="mt-0.5">
                  {evt.operation === 'retain' ? (
                    <ArrowUpRight size={15} className="text-purple-700 font-bold" />
                  ) : evt.operation === 'recall' ? (
                    <ArrowDownRight size={15} className="text-blue-700 font-bold" />
                  ) : (
                    <Brain size={15} className="text-amber-700 font-bold" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 font-bold">
                    <span className="uppercase text-ink-900 font-mono tracking-wider">{evt.agentId}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-white/70 border border-black/10">
                      {evt.operation}
                    </span>
                    {evt.category && (
                      <span className="text-[10px] uppercase font-mono text-ink-500">[{evt.category}]</span>
                    )}
                  </div>
                  <p className="mt-1 font-medium leading-normal text-ink-800">
                    "{evt.memorySnippet}"
                  </p>
                </div>
              </div>

              {/* Timestamp & Score */}
              <div className="text-right text-[10px] text-ink-500 font-mono flex flex-col items-end whitespace-nowrap pl-2">
                <span>{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                {evt.relevanceScore !== undefined && (
                  <span className="text-purple-700 font-bold">Score: {evt.relevanceScore}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
