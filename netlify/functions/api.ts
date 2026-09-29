import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import { router as apiRouter } from '../../backend/src/routes/api.routes.js';
import { getDb } from '../../backend/src/db.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);
app.use('/', apiRouter);

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await getDb();
    initialized = true;
  }
}

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  await ensureInit();
  return serverlessHandler(event, context);
};
