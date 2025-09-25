export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: DeepSeekMessage[], options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }): Promise<DeepSeekResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'deepseek-chat',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.chat([
        { role: 'user', content: 'Hello' }
      ], { max_tokens: 10 });
      return true;
    } catch (error) {
      return false;
    }
  }
}
