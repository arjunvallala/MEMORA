import { Response } from 'express';
import { MemoryEvent } from '../../../shared/types.js';
import { getDb } from '../db.js';
import crypto from 'crypto';

class EventService {
  private clients: Set<Response> = new Set();

  public addClient(res: Response) {
    this.clients.add(res);
    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  public async emitEvent(eventData: Omit<MemoryEvent, 'id' | 'timestamp'>): Promise<MemoryEvent> {
    const fullEvent: MemoryEvent = {
      ...eventData,
      id: `evt_${crypto.randomBytes(8).toString('hex')}`,
      timestamp: new Date().toISOString()
    };

    // Persist event in DB
    try {
      const db = await getDb();
      await db.run(
        `INSERT INTO hindsight_events 
         (id, timestamp, projectId, bankId, agentId, provider, operation, memorySnippet, fullContent, category, relevanceScore, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fullEvent.id,
          fullEvent.timestamp,
          fullEvent.projectId,
          fullEvent.bankId,
          fullEvent.agentId,
          fullEvent.provider,
          fullEvent.operation,
          fullEvent.memorySnippet,
          fullEvent.fullContent || null,
          fullEvent.category || null,
          fullEvent.relevanceScore || null,
          fullEvent.status
        ]
      );
    } catch (err) {
      console.error('[EventService] Failed to persist event:', err);
    }

    // Broadcast event via SSE
    const payload = `data: ${JSON.stringify(fullEvent)}\n\n`;
    for (const client of this.clients) {
      client.write(payload);
    }

    console.log(`[EVENT] ${fullEvent.agentId.toUpperCase()} -> ${fullEvent.operation.toUpperCase()} -> "${fullEvent.memorySnippet.substring(0, 50)}..."`);
    return fullEvent;
  }

  public async getRecentEvents(projectId: string, limit: number = 50): Promise<MemoryEvent[]> {
    const db = await getDb();
    const rows = await db.all(
      'SELECT * FROM hindsight_events WHERE projectId = ? ORDER BY timestamp DESC LIMIT ?',
      [projectId, limit]
    );

    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      projectId: r.projectId,
      bankId: r.bankId,
      agentId: r.agentId,
      provider: r.provider,
      operation: r.operation,
      memorySnippet: r.memorySnippet,
      fullContent: r.fullContent,
      category: r.category,
      relevanceScore: r.relevanceScore,
      status: r.status
    }));
  }
}

export const eventService = new EventService();
