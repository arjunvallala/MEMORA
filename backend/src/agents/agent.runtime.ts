import { AgentId, ChatMessage, HindsightMemory, MemoryCategory, MemoryEvent, ProviderName } from '../../../shared/types.js';
import { hindsightService } from '../services/hindsight.service.js';
import { eventService } from '../services/event.service.js';
import { groqAdapter } from '../providers/groq.adapter.js';
import { googleAdapter } from '../providers/google.adapter.js';
import { openAIAdapter } from '../providers/openai.adapter.js';
import { getDb } from '../db.js';
import crypto from 'crypto';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  provider: ProviderName;
  role: string;
  systemPrompt: string;
}

const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  groq: {
    id: 'groq',
    name: 'Groq',
    provider: 'groq',
    role: 'System Architect',
    systemPrompt: `You are GROQ, the Lead System Architect on the engineering team.
Your focus is system architecture, technology selection, user preferences, consistency tradeoffs, and durable design decisions.
You share a persistent memory bank (Hindsight) with Gemini (Researcher) and GPT (Reviewer).

MEMORY DIRECTIVES:
1. Always consult shared team memory retrieved from Hindsight.
2. When the user establishes or confirms a durable decision, preference, rule, or identity (e.g. name, architectural choice), confirm it explicitly.
3. Keep answers clear, technical, and precise.`
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    provider: 'google',
    role: 'Technical Researcher',
    systemPrompt: `You are GEMINI, the Lead Technical Researcher on the engineering team.
Your focus is empirical investigation, performance benchmarks, technology experiments, and failure analysis.
You share a persistent memory bank (Hindsight) with Groq (Architect) and GPT (Reviewer).

MEMORY DIRECTIVES:
1. Always consult shared team memory retrieved from Hindsight.
2. If you recall a decision, user preference, name, or rule retained by Groq or GPT, reference it directly.
3. When you discover or test a technical lesson or failure, highlight it as a key lesson for Hindsight.`
  },
  gpt: {
    id: 'gpt',
    name: 'GPT',
    provider: 'openai',
    role: 'Technical Reviewer',
    systemPrompt: `You are GPT, the Lead Technical Reviewer on the engineering team.
Your focus is code review, risk validation, failure prevention, and architectural compliance.
You share a persistent memory bank (Hindsight) with Groq (Architect) and Gemini (Researcher).

MEMORY DIRECTIVES:
1. Always consult shared team memory retrieved from Hindsight.
2. If you recall decisions, user preferences, or technical lessons from Groq or Gemini, use them in your answer.
3. Maintain high standards for scalability, risk prevention, and reliability.`
  }
};

export class AgentRuntime {
  /**
   * Process a message for a specific agent
   */
  public async processMessage(
    projectId: string,
    agentId: AgentId,
    userMessageText: string
  ): Promise<ChatMessage> {
    const bankId = `project:${projectId}`;
    const agentDef = AGENT_DEFINITIONS[agentId];

    if (!agentDef) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    // 1. Fetch isolated conversation history from DB
    const db = await getDb();
    const convId = await this.getOrCreateConversationId(db, projectId, agentId);
    
    const historyRows = await db.all(
      'SELECT sender, content FROM messages WHERE conversationId = ? ORDER BY timestamp ASC',
      [convId]
    );

    const history = historyRows.map((r) => ({
      sender: r.sender as 'user' | 'agent',
      content: r.content
    }));

    // Save user message in DB
    const userMsgId = `msg_${crypto.randomBytes(8).toString('hex')}`;
    const userMsgTime = new Date().toISOString();
    await db.run(
      'INSERT INTO messages (id, conversationId, agentId, sender, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [userMsgId, convId, agentId, 'user', userMessageText, userMsgTime]
    );

    // 2. Step 1: RECALL memories from shared Hindsight bank
    let recalledMemories: HindsightMemory[] = [];
    try {
      recalledMemories = await hindsightService.recall(bankId, userMessageText, agentId);
      
      if (recalledMemories.length > 0) {
        await eventService.emitEvent({
          projectId,
          bankId,
          agentId,
          provider: agentDef.provider,
          operation: 'recall',
          memorySnippet: recalledMemories[0].content,
          fullContent: JSON.stringify(recalledMemories),
          category: recalledMemories[0].category,
          relevanceScore: recalledMemories[0].score || 0.85,
          status: 'success'
        });
      }
    } catch (err: any) {
      console.error('[AgentRuntime] Recall failed:', err.message);
      await eventService.emitEvent({
        projectId,
        bankId,
        agentId,
        provider: agentDef.provider,
        operation: 'recall',
        memorySnippet: 'Hindsight recall error',
        status: 'failed'
      });
    }

    // 3. Construct System Prompt with Hindsight Context
    let augmentedSystemPrompt = agentDef.systemPrompt;
    if (recalledMemories.length > 0) {
      augmentedSystemPrompt += `\n\n--- SHARED TEAM MEMORY RECALLED VIA HINDSIGHT ---\n`;
      for (const mem of recalledMemories) {
        augmentedSystemPrompt += `[Memory Category: ${mem.category.toUpperCase()} | Source Agent: ${mem.sourceAgent.toUpperCase()}]\n"${mem.content}"\n`;
      }
      augmentedSystemPrompt += `--- END SHARED MEMORY ---\nUse the above recalled memory to inform your answer if relevant.`;
    }

    // 4. Call provider adapter
    let responseText = '';
    if (agentId === 'groq') {
      responseText = await groqAdapter.generateResponse(augmentedSystemPrompt, history, userMessageText);
    } else if (agentId === 'gemini') {
      responseText = await googleAdapter.generateResponse(augmentedSystemPrompt, history, userMessageText);
    } else if (agentId === 'gpt') {
      responseText = await openAIAdapter.generateResponse(augmentedSystemPrompt, history, userMessageText);
    }

    // 5. Evaluate response for RETAIN operation (selective durable knowledge extraction)
    let retainedMemory: HindsightMemory | undefined = undefined;
    const durableFact = this.extractDurableKnowledge(userMessageText, responseText, agentId);

    if (durableFact) {
      try {
        retainedMemory = await hindsightService.retain(
          bankId,
          durableFact.content,
          agentId,
          durableFact.category
        );

        await eventService.emitEvent({
          projectId,
          bankId,
          agentId,
          provider: agentDef.provider,
          operation: 'retain',
          memorySnippet: retainedMemory.content,
          fullContent: retainedMemory.content,
          category: retainedMemory.category,
          relevanceScore: 1.0,
          status: 'success'
        });
      } catch (err: any) {
        console.error('[AgentRuntime] Retain failed:', err.message);
      }
    }

    // 6. Save agent response message in DB
    const agentMsgId = `msg_${crypto.randomBytes(8).toString('hex')}`;
    const agentMsgTime = new Date().toISOString();
    
    await db.run(
      `INSERT INTO messages 
       (id, conversationId, agentId, sender, content, recalledMemories, retainedMemory, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agentMsgId,
        convId,
        agentId,
        'agent',
        responseText,
        JSON.stringify(recalledMemories),
        retainedMemory ? JSON.stringify(retainedMemory) : null,
        agentMsgTime
      ]
    );

    // Update conversation timestamp
    await db.run('UPDATE conversations SET updatedAt = ? WHERE id = ?', [agentMsgTime, convId]);

    const chatMessage: ChatMessage = {
      id: agentMsgId,
      agentId,
      sender: 'agent',
      content: responseText,
      timestamp: agentMsgTime,
      recalledMemories: recalledMemories.length > 0 ? recalledMemories : undefined,
      retainedMemory
    };

    return chatMessage;
  }

  private extractDurableKnowledge(
    userText: string,
    agentResponse: string,
    agentId: AgentId
  ): { content: string; category: MemoryCategory } | null {
    const userLower = userText.toLowerCase();
    const respLower = agentResponse.toLowerCase();

    // 1. User identity / name / preference extraction
    if (
      userLower.includes('my name is') ||
      userLower.includes('name is') ||
      userLower.includes('i am ') ||
      userLower.includes('address me') ||
      userLower.includes('call me')
    ) {
      return {
        content: userText.trim(),
        category: 'preference'
      };
    }

    // 2. Explicit "remember" or rule instruction
    if (userLower.includes('remember')) {
      return {
        content: userText.trim(),
        category: userLower.includes('decide') || userLower.includes('select') ? 'decision' : 'lesson'
      };
    }

    // 3. Architectural decisions
    if (
      userLower.includes('decided') ||
      userLower.includes('selected') ||
      userLower.includes('chose') ||
      userLower.includes('use postgresql') ||
      userLower.includes('architecture')
    ) {
      return {
        content: userText.trim(),
        category: 'decision'
      };
    }

    // 4. Technical failures, warnings, or constraints
    if (
      userLower.includes('avoid') ||
      userLower.includes('failed') ||
      userLower.includes('timeout') ||
      userLower.includes('issue') ||
      userLower.includes('redis')
    ) {
      return {
        content: userText.trim(),
        category: 'failure'
      };
    }

    // 5. Dynamic fallback: if response claims Hindsight memory was updated
    if (
      respLower.includes('hindsight') ||
      respLower.includes('updated our shared memory') ||
      respLower.includes('saved to memory') ||
      respLower.includes('stored this')
    ) {
      return {
        content: userText.trim(),
        category: 'lesson'
      };
    }

    return null;
  }

  private async getOrCreateConversationId(db: any, projectId: string, agentId: AgentId): Promise<string> {
    const existing = await db.get(
      'SELECT id FROM conversations WHERE projectId = ? AND agentId = ?',
      [projectId, agentId]
    );

    if (existing) return existing.id;

    const newId = `conv_${projectId}_${agentId}`;
    await db.run(
      'INSERT INTO conversations (id, projectId, agentId, updatedAt) VALUES (?, ?, ?, ?)',
      [newId, projectId, agentId, new Date().toISOString()]
    );
    return newId;
  }
}

export const agentRuntime = new AgentRuntime();
