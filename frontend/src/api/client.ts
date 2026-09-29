import { ChatMessage, HindsightMemory, MemoryEvent, MemoryStats, Project, ReflectResponse, SystemHealth } from '../../../shared/types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  return res.json();
}

export async function fetchConversation(projectId: string, agentId: string): Promise<{ messages: ChatMessage[] }> {
  const res = await fetch(`${API_BASE}/conversations/${projectId}/${agentId}`);
  return res.json();
}

export async function clearConversation(projectId: string, agentId: string): Promise<void> {
  await fetch(`${API_BASE}/conversations/${projectId}/${agentId}`, { method: 'DELETE' });
}

export async function sendChatMessage(projectId: string, agentId: string, message: string): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, agentId, message })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to send message');
  }
  return res.json();
}

export async function askTeamMemory(projectId: string, query: string): Promise<ReflectResponse> {
  const res = await fetch(`${API_BASE}/memory/reflect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, query })
  });
  return res.json();
}

export async function fetchMemoryStats(projectId: string): Promise<MemoryStats> {
  const res = await fetch(`${API_BASE}/memory/stats?projectId=${projectId}`);
  return res.json();
}

export async function fetchMemories(projectId: string, category?: string): Promise<HindsightMemory[]> {
  const url = category && category !== 'all'
    ? `${API_BASE}/memory/explorer?projectId=${projectId}&category=${category}`
    : `${API_BASE}/memory/explorer?projectId=${projectId}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchRecentEvents(projectId: string): Promise<MemoryEvent[]> {
  const res = await fetch(`${API_BASE}/events/history?projectId=${projectId}`);
  return res.json();
}

export async function resetDemoWorkspace(): Promise<void> {
  await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
}
