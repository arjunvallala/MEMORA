import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dir = path.dirname(config.dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = await open({
    filename: config.dbPath,
    driver: sqlite3.Database
  });

  await initSchema(dbInstance);
  return dbInstance;
}

async function initSchema(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      bankId TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      agentId TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(projectId, agentId)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversationId TEXT NOT NULL,
      agentId TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      recalledMemories TEXT,
      retainedMemory TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY(conversationId) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hindsight_memories (
      id TEXT PRIMARY KEY,
      bankId TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      sourceAgent TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      recalledCount INTEGER DEFAULT 0,
      usedByAgents TEXT DEFAULT '[]',
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS hindsight_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      projectId TEXT NOT NULL,
      bankId TEXT NOT NULL,
      agentId TEXT NOT NULL,
      provider TEXT NOT NULL,
      operation TEXT NOT NULL,
      memorySnippet TEXT NOT NULL,
      fullContent TEXT,
      category TEXT,
      relevanceScore REAL,
      status TEXT NOT NULL
    );
  `);

  // Ensure default project exists
  const existingProject = await db.get('SELECT id FROM projects WHERE id = ?', [config.defaultProjectId]);
  if (!existingProject) {
    await db.run(
      'INSERT INTO projects (id, name, description, bankId, createdAt) VALUES (?, ?, ?, ?, ?)',
      [
        config.defaultProjectId,
        'Payment Platform',
        'Next-generation payment processing platform microservices architecture',
        `project:${config.defaultProjectId}`,
        new Date().toISOString()
      ]
    );
  }
}
