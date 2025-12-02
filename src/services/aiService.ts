import type { CanvasSize, Pixel } from '../types';

// Replicate AI Service for sprite generation using Retro Diffusion models

export type ReplicateModel = 'rd-fast' | 'rd-plus';

export const RD_FAST_STYLES = [
  'default',
  'simple',
  'detailed',
  'retro',
  'game_asset',
  'portrait',
  'texture',
  'ui',
  'item_sheet',
  'character_turnaround',
  '1_bit',
  'low_res',
  'mc_item',
  'mc_texture',
  'no_style',
] as const;

export const RD_PLUS_STYLES = [
  'default',
  'retro',
  'watercolor',
  'textured',
  'cartoon',
  'ui_element',
  'item_sheet',
  'character_turnaround',
  'environment',
  'isometric',
  'isometric_asset',
  'topdown_map',
  'topdown_asset',
  'classic',
  'topdown_item',
  'low_res',
  'mc_item',
  'mc_texture',
  'skill_icon',
] as const;

export type RdFastStyle = typeof RD_FAST_STYLES[number];
export type RdPlusStyle = typeof RD_PLUS_STYLES[number];

export interface AIGenerationRequest {
  prompt: string;
  size: CanvasSize;
  model: ReplicateModel;
  style: string;
  removeBackground?: boolean;
  seed?: number;
}

export interface AIGenerationResponse {
  success: boolean;
  pixels?: Pixel[];
  imageUrl?: string;
  error?: string;
}

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
}

const MODEL_VERSIONS: Record<ReplicateModel, string> = {
  'rd-fast': '067f6cd8a3c5582b4317d462176b75d9cdfae8ae548033220bddd0c19c4a1357',
  'rd-plus': '60eb48db78cbd38cc6473d309a311db08244ed021567a9234970af971bab0d87',
};

// Use proxy in development to avoid CORS issues
const API_BASE = '/api/replicate/v1';

class AIService {
  private apiToken: string = '';

  configure(apiToken: string) {
    this.apiToken = apiToken;
  }

  isConfigured(): boolean {
    return this.apiToken.length > 0;
  }

  async generateSprite(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    if (!this.apiToken) {
      return {
        success: false,
        error: 'API token not configured. Please set your Replicate API token.',
      };
    }

    try {
      console.log('Starting AI generation:', { prompt: request.prompt, model: request.model, style: request.style });

      // Create prediction
      const prediction = await this.createPrediction(request);
      console.log('Prediction created:', prediction);

      if (!prediction) {
        return { success: false, error: 'Failed to create prediction' };
      }

      // Poll for completion
      const result = await this.pollPrediction(prediction.id);

      if (result.status === 'failed') {
        return { success: false, error: result.error || 'Generation failed' };
      }

      if (result.status !== 'succeeded' || !result.output || result.output.length === 0) {
        return { success: false, error: 'No output generated' };
      }

      const imageUrl = result.output[0];

      // Convert image to pixels
      const pixels = await this.imageUrlToPixels(imageUrl, request.size);

      return {
        success: true,
        pixels,
        imageUrl,
      };
    } catch (error) {
      console.error('AI generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  private async createPrediction(request: AIGenerationRequest): Promise<ReplicatePrediction | null> {
    const response = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60',
      },
      body: JSON.stringify({
        version: MODEL_VERSIONS[request.model],
        input: {
          prompt: request.prompt,
          style: request.style,
          width: request.size,
          height: request.size,
          num_images: 1,
          remove_bg: request.removeBackground ?? true,
          seed: request.seed,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', response.status, errorText);
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('API response:', result);
    return result;
  }

  private async pollPrediction(predictionId: string): Promise<ReplicatePrediction> {
    const maxAttempts = 60;
    const pollInterval = 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(
        `${API_BASE}/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check prediction status: ${response.status}`);
      }

      const prediction: ReplicatePrediction = await response.json();

      if (['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
        return prediction;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Generation timed out');
  }

  private async imageUrlToPixels(imageUrl: string, targetSize: CanvasSize): Promise<Pixel[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image scaled to target size
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, targetSize, targetSize);

        // Extract pixel data
        const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
        const pixels: Pixel[] = [];

        for (let y = 0; y < targetSize; y++) {
          for (let x = 0; x < targetSize; x++) {
            const i = (y * targetSize + x) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];

            // Skip fully transparent pixels
            if (a < 10) continue;

            pixels.push({
              x,
              y,
              color: { r, g, b, a },
            });
          }
        }

        resolve(pixels);
      };

      img.onerror = () => {
        reject(new Error('Failed to load generated image'));
      };

      img.src = imageUrl;
    });
  }
}

// Export singleton instance
export const aiService = new AIService();

// Configure with API token
aiService.configure('REMOVED_SECRET');
