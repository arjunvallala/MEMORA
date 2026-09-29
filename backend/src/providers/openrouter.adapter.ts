import { config } from '../config.js';

export class OpenRouterAdapter {
  private apiKey: string;
  public configured: boolean;

  constructor() {
    this.apiKey = config.providers.openrouter.apiKey;
    this.configured = config.providers.openrouter.configured;
  }

  public async generateResponse(
    systemPrompt: string,
    history: { sender: 'user' | 'agent'; content: string }[],
    userMessage: string,
    modelName: string = 'minimax/minimax-m3'
  ): Promise<string> {
    if (!this.configured) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.content
        })),
        { role: 'user', content: userMessage }
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MEMORA Multi-Agent Workspace'
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No content returned from OpenRouter.';
    } catch (err: any) {
      console.error('[OpenRouterAdapter] Call failed:', err.message);
      throw err;
    }
  }
}

export const openRouterAdapter = new OpenRouterAdapter();
