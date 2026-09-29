import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SharedMemoryStrip } from './components/SharedMemoryStrip';
import { AgentPanel } from './components/AgentPanel';
import { SharedMemoryActivityPanel } from './components/SharedMemoryActivityPanel';
import { AskTeamMemoryModal } from './components/AskTeamMemoryModal';
import { MemoryExplorer } from './components/MemoryExplorer';
import { ActivityTimeline } from './components/ActivityTimeline';
import { SettingsView } from './components/SettingsView';
import { GuidedDemoModal } from './components/GuidedDemoModal';

import { AgentConfig, ChatMessage, MemoryEvent, MemoryStats, Project, SystemHealth } from '../../shared/types';
import {
  fetchHealth,
  fetchProjects,
  createProject,
  fetchConversation,
  clearConversation,
  sendChatMessage,
  fetchMemoryStats,
  fetchRecentEvents,
  resetDemoWorkspace
} from './api/client';

const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'groq',
    name: 'Groq',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    role: 'System Architect',
    description: 'Ultra-fast system design, architectural decisions, and durability tradeoffs.',
    avatar: 'Q',
    accentColor: '#f97316'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'google',
    model: 'gemini-1.5-pro',
    role: 'Technical Researcher',
    description: 'Empirical investigation, benchmarks, and performance testing.',
    avatar: 'G',
    accentColor: '#2563eb'
  },
  {
    id: 'gpt',
    name: 'GPT',
    provider: 'openai',
    model: 'gpt-4o',
    role: 'Technical Reviewer',
    description: 'Code review, failure analysis, and risk validation.',
    avatar: 'O',
    accentColor: '#10b981'
  }
];

export function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'explorer' | 'activity' | 'settings'>('workspace');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [events, setEvents] = useState<MemoryEvent[]>([]);

  // Agent Chat Histories
  const [groqMessages, setGroqMessages] = useState<ChatMessage[]>([]);
  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>([]);
  const [gptMessages, setGptMessages] = useState<ChatMessage[]>([]);

  // Processing States
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({
    groq: false,
    gemini: false,
    gpt: false
  });

  // Modals
  const [showAskTeamModal, setShowAskTeamModal] = useState<boolean>(false);
  const [showGuidedDemoModal, setShowGuidedDemoModal] = useState<boolean>(false);

  // Initialize System Data
  const initSystem = async () => {
    try {
      const h = await fetchHealth();
      setHealth(h);

      const projs = await fetchProjects();
      setProjects(projs);

      const activeProj = projs.find((p) => p.id === 'payment-platform') || projs[0] || null;
      setCurrentProject(activeProj);

      if (activeProj) {
        loadProjectData(activeProj.id);
      }
    } catch (err) {
      console.error('System initialization error:', err);
    }
  };

  const loadProjectData = async (projectId: string) => {
    try {
      const st = await fetchMemoryStats(projectId);
      setStats(st);

      const evts = await fetchRecentEvents(projectId);
      setEvents(evts);

      // Load isolated agent conversations
      const gqConv = await fetchConversation(projectId, 'groq');
      setGroqMessages(gqConv.messages || []);

      const gConv = await fetchConversation(projectId, 'gemini');
      setGeminiMessages(gConv.messages || []);

      const oConv = await fetchConversation(projectId, 'gpt');
      setGptMessages(oConv.messages || []);
    } catch (err) {
      console.error('Failed to load project data:', err);
    }
  };

  useEffect(() => {
    initSystem();
  }, []);

  // Real-Time SSE Event Listener
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.id) {
          setEvents((prev) => [parsed, ...prev]);
          if (currentProject) {
            fetchMemoryStats(currentProject.id).then(setStats);
          }
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [currentProject]);

  const handleSelectProject = (proj: Project) => {
    setCurrentProject(proj);
    loadProjectData(proj.id);
  };

  const handleCreateProject = async (name: string, description: string) => {
    try {
      const created = await createProject(name, description);
      setProjects((prev) => [created, ...prev]);
      handleSelectProject(created);
    } catch (err: any) {
      alert('Failed to create project: ' + err.message);
    }
  };

  const handleSendMessage = async (agentId: string, text: string) => {
    if (!currentProject) return;

    // Optimistically push user message
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      agentId: agentId as any,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    if (agentId === 'groq') setGroqMessages((prev) => [...prev, tempUserMsg]);
    if (agentId === 'gemini') setGeminiMessages((prev) => [...prev, tempUserMsg]);
    if (agentId === 'gpt') setGptMessages((prev) => [...prev, tempUserMsg]);

    setIsProcessing((prev) => ({ ...prev, [agentId]: true }));

    try {
      const responseMsg = await sendChatMessage(currentProject.id, agentId, text);

      if (agentId === 'groq') setGroqMessages((prev) => [...prev, responseMsg]);
      if (agentId === 'gemini') setGeminiMessages((prev) => [...prev, responseMsg]);
      if (agentId === 'gpt') setGptMessages((prev) => [...prev, responseMsg]);

      // Refresh memory stats & events
      const st = await fetchMemoryStats(currentProject.id);
      setStats(st);
      const evts = await fetchRecentEvents(currentProject.id);
      setEvents(evts);
    } catch (err: any) {
      alert(`Error processing request for ${agentId}: ${err.message}`);
    } finally {
      setIsProcessing((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const handleClearChat = async (agentId: string) => {
    if (!currentProject) return;
    await clearConversation(currentProject.id, agentId);
    if (agentId === 'groq') setGroqMessages([]);
    if (agentId === 'gemini') setGeminiMessages([]);
    if (agentId === 'gpt') setGptMessages([]);
  };

  const handleResetDemo = async () => {
    if (confirm('Reset shared project memory bank and all chat conversations?')) {
      await resetDemoWorkspace();
      if (currentProject) {
        loadProjectData(currentProject.id);
      }
    }
  };

  const lastEventSummary = events.length > 0
    ? `${events[0].agentId.toUpperCase()} ${events[0].operation.toUpperCase()}: "${events[0].memorySnippet.substring(0, 40)}..."`
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-paper-100 font-body text-ink-900">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        currentProject={currentProject}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        health={health}
        onOpenAskTeamMemory={() => setShowAskTeamModal(true)}
        onOpenGuidedDemo={() => setShowGuidedDemoModal(true)}
        onResetDemo={handleResetDemo}
      />

      {/* Shared Hindsight Memory Strip */}
      <SharedMemoryStrip
        stats={stats}
        bankId={currentProject?.bankId || `project:payment-platform`}
        lastEventSummary={lastEventSummary}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'workspace' && (
          <div className="max-w-[1536px] mx-auto p-6 space-y-6">
            
            {/* Three Side-by-Side Agent Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Agent 1: Groq (Architect) */}
              <AgentPanel
                config={AGENT_CONFIGS[0]}
                messages={groqMessages}
                onSendMessage={(msg) => handleSendMessage('groq', msg)}
                onClear={() => handleClearChat('groq')}
                isProcessing={isProcessing.groq}
                providerConfigured={health?.providers.groq ?? false}
              />

              {/* Agent 2: Gemini (Researcher) */}
              <AgentPanel
                config={AGENT_CONFIGS[1]}
                messages={geminiMessages}
                onSendMessage={(msg) => handleSendMessage('gemini', msg)}
                onClear={() => handleClearChat('gemini')}
                isProcessing={isProcessing.gemini}
                providerConfigured={health?.providers.google ?? false}
              />

              {/* Agent 3: GPT (Reviewer) */}
              <AgentPanel
                config={AGENT_CONFIGS[2]}
                messages={gptMessages}
                onSendMessage={(msg) => handleSendMessage('gpt', msg)}
                onClear={() => handleClearChat('gpt')}
                isProcessing={isProcessing.gpt}
                providerConfigured={health?.providers.openai ?? false}
              />

            </div>

            {/* Live Shared Memory Activity Feed */}
            <SharedMemoryActivityPanel events={events} />

          </div>
        )}

        {activeTab === 'explorer' && (
          <MemoryExplorer
            projectId={currentProject?.id || 'payment-platform'}
            bankId={currentProject?.bankId || 'project:payment-platform'}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTimeline projectId={currentProject?.id || 'payment-platform'} />
        )}

        {activeTab === 'settings' && (
          <SettingsView health={health} />
        )}
      </main>

      {/* Modals */}
      {showAskTeamModal && currentProject && (
        <AskTeamMemoryModal
          projectId={currentProject.id}
          bankId={currentProject.bankId}
          onClose={() => setShowAskTeamModal(false)}
        />
      )}

      {showGuidedDemoModal && currentProject && (
        <GuidedDemoModal
          projectId={currentProject.id}
          onClose={() => setShowGuidedDemoModal(false)}
          onRefreshWorkspace={() => loadProjectData(currentProject.id)}
        />
      )}

    </div>
  );
}

export default App;
