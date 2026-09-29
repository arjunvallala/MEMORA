import { Router, Request, Response } from 'express';
import { hindsightService } from '../services/hindsight.service.js';
import { eventService } from '../services/event.service.js';
import { agentRuntime } from '../agents/agent.runtime.js';
import { config } from '../config.js';
import { getDb } from '../db.js';
import { AgentId } from '../../../shared/types.js';

export const router = Router();

/**
 * Health Check API
 */
router.get('/health', async (req: Request, res: Response) => {
  const hindsightOk = await hindsightService.isHealthy();
  
  res.json({
    status: hindsightOk ? 'healthy' : 'degraded',
    hindsightConnected: hindsightOk,
    hindsightUrl: config.hindsight.apiUrl,
    bankId: `project:${config.defaultProjectId}`,
    providers: {
      openrouter: config.providers.openrouter.configured,
      groq: config.providers.groq.configured,
      google: config.providers.google.configured,
      openai: config.providers.openai.configured
    }
  });
});

/**
 * SSE Real-Time Event Stream
 */
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  eventService.addClient(res);

  // Send initial ping event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
});

/**
 * Get Recent Memory Events
 */
router.get('/events/history', async (req: Request, res: Response) => {
  try {
    const projectId = (req.query.projectId as string) || config.defaultProjectId;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const events = await eventService.getRecentEvents(projectId, limit);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Process Chat Message for Agent
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { projectId = config.defaultProjectId, agentId, message } = req.body;

    if (!agentId || !message) {
      return res.status(400).json({ error: 'Missing agentId or message' });
    }

    const response = await agentRuntime.processMessage(projectId, agentId as AgentId, message);
    res.json(response);
  } catch (err: any) {
    console.error('[API /chat] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to process chat message' });
  }
});

/**
 * Get Isolated Agent Conversation History
 */
router.get('/conversations/:projectId/:agentId', async (req: Request, res: Response) => {
  try {
    const { projectId, agentId } = req.params;
    const db = await getDb();

    const conv = await db.get(
      'SELECT id FROM conversations WHERE projectId = ? AND agentId = ?',
      [projectId, agentId]
    );

    if (!conv) {
      return res.json({ id: `conv_${projectId}_${agentId}`, projectId, agentId, messages: [] });
    }

    const rows = await db.all(
      'SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC',
      [conv.id]
    );

    const messages = rows.map((r) => ({
      id: r.id,
      agentId: r.agentId,
      sender: r.sender,
      content: r.content,
      recalledMemories: r.recalledMemories ? JSON.parse(r.recalledMemories) : undefined,
      retainedMemory: r.retainedMemory ? JSON.parse(r.retainedMemory) : undefined,
      timestamp: r.timestamp
    }));

    res.json({ id: conv.id, projectId, agentId, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Clear Isolated Agent Conversation
 */
router.delete('/conversations/:projectId/:agentId', async (req: Request, res: Response) => {
  try {
    const { projectId, agentId } = req.params;
    const db = await getDb();

    const conv = await db.get(
      'SELECT id FROM conversations WHERE projectId = ? AND agentId = ?',
      [projectId, agentId]
    );

    if (conv) {
      await db.run('DELETE FROM messages WHERE conversationId = ?', [conv.id]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Hindsight RETAIN Endpoint
 */
router.post('/memory/retain', async (req: Request, res: Response) => {
  try {
    const { projectId = config.defaultProjectId, content, sourceAgent = 'groq', category } = req.body;
    const bankId = `project:${projectId}`;

    const memory = await hindsightService.retain(bankId, content, sourceAgent, category);

    await eventService.emitEvent({
      projectId,
      bankId,
      agentId: sourceAgent,
      provider: sourceAgent === 'groq' ? 'groq' : sourceAgent === 'gemini' ? 'google' : 'openai',
      operation: 'retain',
      memorySnippet: memory.content,
      fullContent: memory.content,
      category: memory.category,
      relevanceScore: 1.0,
      status: 'success'
    });

    res.json(memory);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Hindsight RECALL Endpoint
 */
router.post('/memory/recall', async (req: Request, res: Response) => {
  try {
    const { projectId = config.defaultProjectId, query, requestingAgent } = req.body;
    const bankId = `project:${projectId}`;

    const memories = await hindsightService.recall(bankId, query, requestingAgent);

    if (requestingAgent && memories.length > 0) {
      await eventService.emitEvent({
        projectId,
        bankId,
        agentId: requestingAgent,
        provider: requestingAgent === 'groq' ? 'groq' : requestingAgent === 'gemini' ? 'google' : 'openai',
        operation: 'recall',
        memorySnippet: memories[0].content,
        fullContent: JSON.stringify(memories),
        category: memories[0].category,
        relevanceScore: memories[0].score || 0.85,
        status: 'success'
      });
    }

    res.json({ memories, bankId, query });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Hindsight REFLECT Endpoint ("Ask Team Memory")
 */
router.post('/memory/reflect', async (req: Request, res: Response) => {
  try {
    const { projectId = config.defaultProjectId, query } = req.body;
    const bankId = `project:${projectId}`;

    const reflection = await hindsightService.reflect(bankId, query);

    await eventService.emitEvent({
      projectId,
      bankId,
      agentId: 'groq',
      provider: 'groq',
      operation: 'reflect',
      memorySnippet: `Reflected over ${reflection.supportingMemories.length} team memories`,
      fullContent: reflection.answer,
      relevanceScore: 1.0,
      status: 'success'
    });

    res.json(reflection);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Memory Explorer List Endpoint
 */
router.get('/memory/explorer', async (req: Request, res: Response) => {
  try {
    const projectId = (req.query.projectId as string) || config.defaultProjectId;
    const category = req.query.category as string;
    const bankId = `project:${projectId}`;

    const memories = await hindsightService.getAllMemories(bankId, category);
    res.json(memories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Memory Statistics Endpoint
 */
router.get('/memory/stats', async (req: Request, res: Response) => {
  try {
    const projectId = (req.query.projectId as string) || config.defaultProjectId;
    const bankId = `project:${projectId}`;

    const memories = await hindsightService.getAllMemories(bankId);
    
    const decisionsCount = memories.filter((m) => m.category === 'decision').length;
    const lessonsCount = memories.filter((m) => m.category === 'lesson' || m.category === 'failure').length;
    const otherCount = memories.length - (decisionsCount + lessonsCount);

    res.json({
      totalMemories: memories.length,
      activeAgents: 3,
      decisionsCount,
      lessonsCount,
      otherCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Project List & Create
 */
router.get('/projects', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const projects = await db.all('SELECT * FROM projects ORDER BY createdAt DESC');
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/projects', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const id = name.toLowerCase().replace(/[^\w]/g, '-').replace(/-+/g, '-');
    const bankId = `project:${id}`;
    const now = new Date().toISOString();

    const db = await getDb();
    await db.run(
      'INSERT INTO projects (id, name, description, bankId, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, name, description || '', bankId, now]
    );

    res.json({ id, name, description, bankId, createdAt: now });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Reset Demo Endpoint
 */
router.post('/demo/reset', async (req: Request, res: Response) => {
  try {
    const projectId = config.defaultProjectId;
    const bankId = `project:${projectId}`;

    await hindsightService.clearBank(bankId);

    const db = await getDb();
    await db.run('DELETE FROM conversations WHERE projectId = ?', [projectId]);
    await db.run('DELETE FROM messages');
    await db.run('DELETE FROM hindsight_events WHERE projectId = ?', [projectId]);

    console.log('[DEMO RESET] Workspace reset successfully.');
    res.json({ success: true, message: 'Demo environment reset successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Official Hindsight REST API Route Protocol ---
router.post('/v1/default/banks/:bankId/memories/retain', async (req: Request, res: Response) => {
  const { bankId } = req.params;
  const { content, sourceAgent = 'groq', category } = req.body;
  const memory = await hindsightService.retain(bankId, content, sourceAgent, category);
  res.json({ status: 'success', memory });
});

router.post('/v1/default/banks/:bankId/memories/recall', async (req: Request, res: Response) => {
  const { bankId } = req.params;
  const { query, requestingAgent } = req.body;
  const memories = await hindsightService.recall(bankId, query, requestingAgent);
  res.json({ memories, bank_id: bankId });
});

router.post('/v1/default/banks/:bankId/reflect', async (req: Request, res: Response) => {
  const { bankId } = req.params;
  const { query } = req.body;
  const reflection = await hindsightService.reflect(bankId, query);
  res.json(reflection);
});
