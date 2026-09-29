import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { router as apiRouter } from './routes/api.routes.js';
import { getDb } from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);
app.use('/', apiRouter); // Mount Hindsight official REST endpoint handlers at root level as well

// Root status
app.get('/', (req, res) => {
  res.json({
    name: 'MEMORA Backend',
    tagline: 'Different minds. One memory.',
    status: 'running',
    docs: 'https://hindsight.vectorize.io/'
  });
});

async function startServer() {
  try {
    await getDb();
    app.listen(config.port, () => {
      console.log(`
=====================================================
  MEMORA BACKEND STARTED
  Port: ${config.port}
  Hindsight Memory Bank: project:${config.defaultProjectId}
  Hindsight API: ${config.hindsight.apiUrl}
  Providers:
    • Groq: ${config.providers.groq.configured ? 'Connected' : 'Fallback Engine Active'}
    • Google (Gemini): ${config.providers.google.configured ? 'Connected' : 'Fallback Engine Active'}
    • OpenAI (GPT): ${config.providers.openai.configured ? 'Connected' : 'Fallback Engine Active'}
=====================================================
      `);
    });
  } catch (err) {
    console.error('Failed to start MEMORA backend:', err);
    process.exit(1);
  }
}

startServer();
