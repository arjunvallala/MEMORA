import React, { useState } from 'react';
import { Brain, Layers, Activity, Settings, Plus, Play, RefreshCw, Cpu, Trash2 } from 'lucide-react';
import { Project, SystemHealth } from '../../../shared/types';

interface HeaderProps {
  activeTab: 'workspace' | 'explorer' | 'activity' | 'settings';
  setActiveTab: (tab: 'workspace' | 'explorer' | 'activity' | 'settings') => void;
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (p: Project) => void;
  onCreateProject: (name: string, desc: string) => void;
  onDeleteProject?: (id: string) => void;
  health: SystemHealth | null;
  onOpenAskTeamMemory: () => void;
  onOpenGuidedDemo: () => void;
  onResetDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  health,
  onOpenAskTeamMemory,
  onOpenGuidedDemo,
  onResetDemo
}) => {
  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onCreateProject(newProjName.trim(), newProjDesc.trim());
    setNewProjName('');
    setNewProjDesc('');
    setShowNewProjModal(false);
  };

  return (
    <header className="bg-paper-50 border-b border-paper-300 px-6 py-3.5 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo & Tagline */}
        <div className="flex items-center space-x-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading text-3xl font-bold tracking-tight text-ink-900">MEMORA</span>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 rounded">
                Hindsight Memory
              </span>
            </div>
            <p className="text-sm font-medium text-ink-500 -mt-1 tracking-wide">
              Different minds. One memory.
            </p>
          </div>

          {/* Project Selector */}
          <div className="hidden md:flex items-center space-x-2 border-l border-paper-300 pl-6">
            <span className="text-xs uppercase font-bold text-ink-500 tracking-wider">Project:</span>
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-paper-100 border border-paper-300 text-ink-900 text-sm font-semibold rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-ink-800"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.bankId})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewProjModal(true)}
              className="p-1 text-ink-500 hover:text-ink-900 hover:bg-paper-200 rounded transition"
              title="New Project"
            >
              <Plus size={16} />
            </button>

            {currentProject && (
              <button
                onClick={() => {
                  if (confirm(`Delete project "${currentProject.name}" and clear its Hindsight memory bank (${currentProject.bankId})?`)) {
                    onDeleteProject?.(currentProject.id);
                  }
                }}
                className="p-1 text-ink-400 hover:text-red-600 hover:bg-paper-200 rounded transition"
                title="Delete Current Project"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="flex items-center space-x-1 bg-paper-200 p-1 rounded-md border border-paper-300">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-sm font-semibold transition ${
              activeTab === 'workspace' ? 'bg-paper-50 text-ink-900 shadow-sm border border-paper-300' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <Layers size={15} />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-sm font-semibold transition ${
              activeTab === 'explorer' ? 'bg-paper-50 text-ink-900 shadow-sm border border-paper-300' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <Brain size={15} />
            <span>Memory Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-sm font-semibold transition ${
              activeTab === 'activity' ? 'bg-paper-50 text-ink-900 shadow-sm border border-paper-300' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <Activity size={15} />
            <span>Activity Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-sm font-semibold transition ${
              activeTab === 'settings' ? 'bg-paper-50 text-ink-900 shadow-sm border border-paper-300' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <Settings size={15} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center space-x-3">
          {/* Ask Team Memory Feature (Hindsight REFLECT) */}
          <button
            onClick={onOpenAskTeamMemory}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold text-sm shadow-sm transition"
          >
            <Brain size={16} />
            <span>Ask Team Memory</span>
          </button>

          {/* Guided Demo Button */}
          <button
            onClick={onOpenGuidedDemo}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-sm shadow-sm transition"
          >
            <Play size={15} />
            <span>Guided Demo</span>
          </button>

          {/* Reset Demo */}
          <button
            onClick={onResetDemo}
            className="p-1.5 text-ink-500 hover:text-red-600 hover:bg-paper-200 rounded transition"
            title="Reset Demo Memory"
          >
            <RefreshCw size={15} />
          </button>

          {/* Health Status Indicator */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-paper-300">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                health?.hindsightConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-ink-700">
              {health?.hindsightConnected ? 'MEMORY CONNECTED' : 'MEMORY OFFLINE'}
            </span>
          </div>
        </div>

      </div>

      {/* New Project Modal */}
      {showNewProjModal && (
        <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-paper-50 border border-paper-300 rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="font-heading text-xl font-bold text-ink-900 mb-2">Create New Project Bank</h3>
            <p className="text-sm text-ink-500 mb-4">
              Each project initializes a dedicated isolated Hindsight memory bank (<code className="bg-paper-200 px-1">project:&lt;id&gt;</code>).
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-ink-700 mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Identity Microservice"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ink-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-ink-700 mb-1">Description</label>
                <textarea
                  placeholder="Brief summary of system goals..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ink-800 h-20"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="px-4 py-1.5 text-sm font-semibold text-ink-700 hover:bg-paper-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-sm font-bold bg-ink-900 text-paper-50 rounded hover:bg-ink-800"
                >
                  Initialize Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
