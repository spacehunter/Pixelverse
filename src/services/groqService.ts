// Groq AI Service for generating prompt suggestions
// Uses Groq's fast LLM inference for quick idea and detail generation

const GROQ_API_BASE = '/api/groq/openai/v1';

// Using Llama 3 8B for fast, cheap inference
const MODEL = 'llama-3.1-8b-instant';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface GeneratedDetail {
  label: string;
  text: string;
}

class GroqService {
  private apiKey: string = '';

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Generate new quick ideas for pixel art sprites
   */
  async generateIdeas(style?: string): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    const styleContext = style && style !== 'default'
      ? `for a ${style.replace(/_/g, ' ')} style game`
      : 'for pixel art games';

    const messages: GroqMessage[] = [
      {
        role: 'system',
        content: `You are a creative pixel art game designer. Generate short, concise sprite ideas.
Each idea should be 2-4 words maximum. Focus on game-ready concepts like characters, items, creatures, and objects.
Return ONLY a JSON array of strings, no other text. Example: ["fire wizard", "gold coin", "slime monster"]`
      },
      {
        role: 'user',
        content: `Generate 6 unique and creative pixel art sprite ideas ${styleContext}.
Make them varied: include a mix of characters, creatures, items, and objects.
Return only the JSON array.`
      }
    ];

    const response = await this.chat(messages);

    try {
      // Parse the JSON array from the response
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 6).map(idea => String(idea).toLowerCase());
      }
    } catch (e) {
      console.error('Failed to parse Groq ideas response:', response, e);
    }

    // Fallback: try to extract ideas from text
    const fallbackIdeas = response
      .split(/[,\n]/)
      .map(s => s.replace(/["\[\]0-9.]/g, '').trim().toLowerCase())
      .filter(s => s.length > 2 && s.length < 30)
      .slice(0, 6);

    return fallbackIdeas.length > 0 ? fallbackIdeas : ['pixel character', 'magic item', 'cute monster'];
  }

  /**
   * Generate detail modifiers based on the given ideas
   */
  async generateDetails(ideas: string[]): Promise<GeneratedDetail[]> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    const ideasList = ideas.slice(0, 6).join(', ');

    const messages: GroqMessage[] = [
      {
        role: 'system',
        content: `You are a pixel art prompt engineer. Generate descriptive modifiers that enhance sprite prompts.
Each modifier should have a short label (1-2 words) and descriptive text (2-5 words) that can be appended to a prompt.
Return ONLY a JSON array of objects with "label" and "text" fields.
Example: [{"label": "Glowing", "text": "with magical glow"}, {"label": "Battle-worn", "text": "with battle damage"}]`
      },
      {
        role: 'user',
        content: `Based on these pixel art sprite ideas: ${ideasList}

Generate 8 creative and varied detail modifiers that would work well with these types of sprites.
Include modifiers for: visual effects, poses, emotions, materials, and styles.
Return only the JSON array.`
      }
    ];

    const response = await this.chat(messages);

    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((d: GeneratedDetail) => d.label && d.text)
          .slice(0, 8)
          .map((d: GeneratedDetail) => ({
            label: String(d.label),
            text: String(d.text)
          }));
      }
    } catch (e) {
      console.error('Failed to parse Groq details response:', response, e);
    }

    // Fallback details
    return [
      { label: 'Glowing', text: 'with magical glow' },
      { label: 'Detailed', text: 'highly detailed' },
      { label: 'Animated', text: 'in dynamic pose' },
    ];
  }

  /**
   * Generate both ideas and details in sequence
   */
  async generateIdeasAndDetails(style?: string): Promise<{
    ideas: string[];
    details: GeneratedDetail[];
  }> {
    // First, generate ideas
    const ideas = await this.generateIdeas(style);

    // Then, generate details based on those ideas
    const details = await this.generateDetails(ideas);

    return { ideas, details };
  }

  private async chat(messages: GroqMessage[]): Promise<string> {
    const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API request failed (${response.status}): ${errorText}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

// Export singleton instance
export const groqService = new GroqService();

// Configure with API key from environment variable
const apiKey = import.meta.env.VITE_GROQ_API_KEY;
if (apiKey) {
  groqService.configure(apiKey);
}
