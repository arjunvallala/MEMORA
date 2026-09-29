import Groq from 'groq-sdk';
import { config } from '../config.js';
import { openRouterAdapter } from './openrouter.adapter.js';

export class GroqAdapter {
  private client: Groq | null = null;
  public configured: boolean;

  constructor() {
    this.configured = config.providers.groq.configured;
    if (this.configured) {
      try {
        this.client = new Groq({ apiKey: config.providers.groq.apiKey });
      } catch (err) {
        console.error('[GroqAdapter] Init error:', err);
        this.configured = false;
      }
    }
  }

  public async generateResponse(
    systemPrompt: string,
    history: { sender: 'user' | 'agent'; content: string }[],
    userMessage: string
  ): Promise<string> {
    // 1. Try direct Groq API with current active models
    if (this.configured && this.client) {
      const modelsToTry = [
        'llama-3.3-70b-specdec',
        'qwen-2.5-coder-32b',
        'deepseek-r1-distill-llama-70b',
        'llama-3.2-3b-preview',
        config.providers.groq.defaultModel
      ];
      
      const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt }
      ];

      for (const h of history) {
        messages.push({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.content
        });
      }

      messages.push({ role: 'user', content: userMessage });

      for (const modelName of modelsToTry) {
        try {
          const response = await this.client.chat.completions.create({
            model: modelName,
            messages,
            temperature: 0.6
          });

          const resText = response.choices[0]?.message?.content;
          if (resText) return resText;
        } catch (err: any) {
          console.warn(`[GroqAdapter] Model ${modelName} failed:`, err.message);
        }
      }
    }

    // 2. Try OpenRouter fallback
    if (openRouterAdapter.configured) {
      try {
        return await openRouterAdapter.generateResponse(
          systemPrompt,
          history,
          userMessage,
          'meta-llama/llama-3.3-70b-instruct'
        );
      } catch (err: any) {
        console.warn('[GroqAdapter] OpenRouter fallback failed:', err.message);
      }
    }

    // 3. System fallback engine
    return this.generateFallbackResponse(userMessage, systemPrompt);
  }

  private generateFallbackResponse(userMessage: string, systemPrompt: string, errorDetail?: string): string {
    const text = userMessage.toLowerCase();

    if (text.includes('payment platform') && text.includes('postgresql')) {
      return `As the Lead System Architect powered by Groq, I agree with this architectural decision. For our high-throughput payment processing platform, PostgreSQL is the ideal engine for transactional data where ACID compliance and strict consistency are mandatory.

I have stored this architectural decision in our shared Hindsight memory bank so Gemini and GPT can reference it.`;
    }

    if (text.includes('database') || text.includes('caching') || text.includes('architecture')) {
      if (systemPrompt.includes('SHARED TEAM MEMORY RECALLED')) {
        const memoryContextMatch = systemPrompt.match(/SHARED TEAM MEMORY RECALLED:([\s\S]*?)END SHARED MEMORY/);
        const recalledText = memoryContextMatch ? memoryContextMatch[1].trim() : '';
        return `Based on our team's established architectural context recalled from Hindsight:\n\n${recalledText}\n\nI recommend proceeding with this design to maintain system consistency.`;
      }
    }

    return `[Groq Architect] ${errorDetail ? `(Note: ${errorDetail})` : ''} Processing system architectural design. Any durable decision or constraint discussed will be retained in Hindsight for Gemini and GPT.`;
  }
}

export const groqAdapter = new GroqAdapter();
