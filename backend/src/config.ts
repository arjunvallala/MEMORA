import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or backend directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  hindsight: {
    apiUrl: process.env.HINDSIGHT_API_URL || 'http://localhost:4000/v1/default',
    apiKey: process.env.HINDSIGHT_API_KEY || 'memora_hindsight_secret_key',
  },

  providers: {
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultModel: 'minimax/minimax-m3',
      configured: Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0)
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY || '',
      defaultModel: 'llama-3.1-70b-versatile',
      configured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0)
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '',
      defaultModel: 'gemini-1.5-flash',
      configured: Boolean((process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) && (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY)!.trim().length > 0)
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: 'gpt-4o',
      configured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0)
    }
  },

  defaultProjectId: process.env.DEFAULT_PROJECT_ID || 'payment-platform',
  dbPath: isServerless ? '/tmp/memora.sqlite' : path.resolve(process.cwd(), 'data/memora.sqlite')
};
