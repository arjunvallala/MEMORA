import { hindsightService } from '../services/hindsight.service.js';
import { getDb } from '../db.js';
import { config } from '../config.js';

async function resetDemo() {
  const projectId = config.defaultProjectId;
  const bankId = `project:${projectId}`;

  console.log(`[DEMO RESET] Clearing Hindsight bank ${bankId}...`);
  await hindsightService.clearBank(bankId);

  const db = await getDb();
  await db.run('DELETE FROM conversations WHERE projectId = ?', [projectId]);
  await db.run('DELETE FROM messages');
  await db.run('DELETE FROM hindsight_events WHERE projectId = ?', [projectId]);

  console.log(`✅ Demo workspace '${projectId}' reset successfully.`);
}

resetDemo().catch(console.error);
