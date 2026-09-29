import React, { useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Brain, Clock, ShieldCheck, Zap } from 'lucide-react';
import { MemoryEvent } from '../../../shared/types';
import { fetchRecentEvents } from '../api/client';

interface ActivityTimelineProps {
  projectId: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ projectId }) => {
  const [events, setEvents] = useState<MemoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchRecentEvents(projectId);
      setEvents(data);
    } catch (err: any) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [projectId]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-paper-300 pb-4">
        <h2 className="font-heading text-2xl font-bold text-ink-900">ACTIVITY TIMELINE</h2>
        <p className="text-sm text-ink-500">
          Complete audit trail demonstrating the <strong className="text-purple-900">LEARN → MEMORY → REUSE</strong> loop across Claude, Gemini, and GPT.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-ink-400 font-medium">Loading event timeline...</div>
      ) : events.length === 0 ? (
        <div className="py-12 bg-paper-50 border border-paper-300 rounded-lg text-center text-ink-400 text-sm">
          No memory events recorded in activity timeline yet.
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-paper-300 space-y-6">
          {events.map((evt) => (
            <div key={evt.id} className="relative group">
              
              {/* Timeline Bullet */}
              <div
                className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-paper-100 flex items-center justify-center ${
                  evt.operation === 'retain'
                    ? 'bg-purple-600'
                    : evt.operation === 'recall'
                    ? 'bg-blue-600'
                    : 'bg-amber-600'
                }`}
              />

              {/* Event Card */}
              <div className="bg-paper-50 border border-paper-300 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded bg-ink-900 text-paper-50">
                      {evt.agentId}
                    </span>
                    <span className="text-xs uppercase font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                      {evt.operation}
                    </span>
                    {evt.category && (
                      <span className="text-xs uppercase font-mono text-ink-500">[{evt.category}]</span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-ink-500">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <p className="text-sm font-semibold text-ink-900 leading-relaxed">
                  "{evt.memorySnippet}"
                </p>

                <div className="mt-2 text-xs font-mono text-ink-500 flex items-center justify-between pt-2 border-t border-paper-200">
                  <span>Bank: {evt.bankId}</span>
                  {evt.relevanceScore !== undefined && (
                    <span className="text-purple-700 font-bold">TEMPR Score: {evt.relevanceScore}</span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
