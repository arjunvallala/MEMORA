export type AgentId = 'groq' | 'gemini' | 'gpt';

export type ProviderName = 'groq' | 'google' | 'openai';

export type MemoryCategory = 'decision' | 'lesson' | 'requirement' | 'failure' | 'preference' | 'convention';

export type MemoryOperation = 'retain' | 'recall' | 'reflect';

export interface AgentConfig {
  id: AgentId;
  name: string;
  provider: ProviderName;
  model: string;
  role: string;
  description: string;
  avatar: string;
  accentColor: string;
}

export interface HindsightMemory {
  id: string;
  bankId: string;
  content: string;
  category: MemoryCategory;
  sourceAgent: AgentId;
  createdAt: string;
  updatedAt: string;
  score?: number;
  recalledCount: number;
  usedByAgents: AgentId[];
  metadata?: Record<string, any>;
}

export interface MemoryEvent {
  id: string;
  timestamp: string;
  projectId: string;
  bankId: string;
  agentId: AgentId;
  provider: ProviderName;
  operation: MemoryOperation;
  memorySnippet: string;
  fullContent?: string;
  category?: MemoryCategory;
  relevanceScore?: number;
  status: 'success' | 'failed' | 'pending';
}

export interface ChatMessage {
  id: string;
  agentId: AgentId;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  recalledMemories?: HindsightMemory[];
  retainedMemory?: HindsightMemory;
  thinkingState?: 'idle' | 'searching_memory' | 'recalled' | 'generating' | 'retaining';
}

export interface Conversation {
  id: string;
  projectId: string;
  agentId: AgentId;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  bankId: string;
  createdAt: string;
}

export interface ReflectResponse {
  query: string;
  answer: string;
  reflection: string;
  supportingMemories: HindsightMemory[];
  timestamp: string;
}

export interface MemoryStats {
  totalMemories: number;
  activeAgents: number;
  decisionsCount: number;
  lessonsCount: number;
  otherCount: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'offline';
  hindsightConnected: boolean;
  hindsightUrl: string;
  bankId: string;
  providers: {
    groq: boolean;
    google: boolean;
    openai: boolean;
  };
}
