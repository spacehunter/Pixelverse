import type { Color, CanvasSize, AIGenerationRequest, AIGenerationResponse, Pixel } from '../types';

// AI Service for sprite generation
// This is designed to be easily connected to various AI backends

interface AIServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

class AIService {
  private config: AIServiceConfig = {};

  configure(config: AIServiceConfig) {
    this.config = { ...this.config, ...config };
  }

  // Generate a sprite using AI
  async generateSprite(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    // If API key is configured, use external AI service
    if (this.config.apiKey) {
      return this.generateWithExternalAI(request);
    }

    // Otherwise, use built-in procedural generation
    return this.generateProcedural(request);
  }

  // External AI generation (placeholder for OpenAI/Anthropic integration)
  private async generateWithExternalAI(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      // This is where you'd integrate with OpenAI DALL-E, Stability AI, etc.
      // For now, we'll simulate with procedural generation
      console.log('External AI generation requested with prompt:', request.prompt);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      return this.generateProcedural(request);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI generation failed',
      };
    }
  }

  // Built-in procedural generation with intelligent patterns
  private async generateProcedural(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const { prompt, size, colorPalette } = request;
    const promptLower = prompt.toLowerCase();

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    let pixels: Pixel[] = [];

    // Detect sprite type from prompt and generate accordingly
    if (promptLower.includes('tree') || promptLower.includes('plant') || promptLower.includes('forest')) {
      pixels = this.generateTree(size, colorPalette);
    } else if (promptLower.includes('character') || promptLower.includes('player') || promptLower.includes('hero') || promptLower.includes('person')) {
      pixels = this.generateCharacter(size, colorPalette);
    } else if (promptLower.includes('enemy') || promptLower.includes('monster') || promptLower.includes('zombie') || promptLower.includes('slime')) {
      pixels = this.generateEnemy(size, colorPalette);
    } else if (promptLower.includes('cloud') || promptLower.includes('sky')) {
      pixels = this.generateCloud(size, colorPalette);
    } else if (promptLower.includes('heart') || promptLower.includes('health') || promptLower.includes('life')) {
      pixels = this.generateHeart(size, colorPalette);
    } else if (promptLower.includes('coin') || promptLower.includes('gold') || promptLower.includes('treasure')) {
      pixels = this.generateCoin(size, colorPalette);
    } else if (promptLower.includes('sword') || promptLower.includes('weapon')) {
      pixels = this.generateSword(size, colorPalette);
    } else if (promptLower.includes('potion') || promptLower.includes('bottle')) {
      pixels = this.generatePotion(size, colorPalette);
    } else if (promptLower.includes('star')) {
      pixels = this.generateStar(size, colorPalette);
    } else if (promptLower.includes('house') || promptLower.includes('building')) {
      pixels = this.generateHouse(size, colorPalette);
    } else {
      // Default: generate abstract shape based on prompt hash
      pixels = this.generateAbstract(size, colorPalette, prompt);
    }

    return {
      success: true,
      pixels,
    };
  }

  // Helper to get color from palette or default
  private getColor(palette: Color[] | undefined, index: number, fallback: Color): Color {
    if (palette && palette.length > index) {
      return palette[index];
    }
    return fallback;
  }

  // Generate a tree sprite
  private generateTree(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];
    const center = Math.floor(size / 2);

    // Colors
    const leafDark = this.getColor(palette, 0, { r: 34, g: 139, b: 34, a: 255 });
    const leafLight = this.getColor(palette, 1, { r: 50, g: 205, b: 50, a: 255 });
    const trunk = this.getColor(palette, 2, { r: 139, g: 90, b: 43, a: 255 });
    const trunkDark = this.getColor(palette, 3, { r: 101, g: 67, b: 33, a: 255 });

    // Trunk
    const trunkWidth = Math.max(2, Math.floor(size / 8));
    const trunkHeight = Math.floor(size / 3);
    for (let y = size - trunkHeight; y < size; y++) {
      for (let x = center - Math.floor(trunkWidth / 2); x < center + Math.ceil(trunkWidth / 2); x++) {
        const color = x === center - Math.floor(trunkWidth / 2) ? trunkDark : trunk;
        pixels.push({ x, y, color });
      }
    }

    // Leaves (triangular/circular shape)
    const leafStart = Math.floor(size / 6);
    const leafEnd = size - trunkHeight;
    for (let y = leafStart; y < leafEnd; y++) {
      const progress = (y - leafStart) / (leafEnd - leafStart);
      const width = Math.floor(progress * (size * 0.8));
      for (let x = center - Math.floor(width / 2); x <= center + Math.floor(width / 2); x++) {
        if (x >= 0 && x < size) {
          // Add some variation
          const isEdge = x === center - Math.floor(width / 2) || x === center + Math.floor(width / 2);
          const color = (Math.random() > 0.5 || isEdge) ? leafDark : leafLight;
          pixels.push({ x, y, color });
        }
      }
    }

    return pixels;
  }

  // Generate a character sprite
  private generateCharacter(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];
    const center = Math.floor(size / 2);

    // Colors
    const skin = this.getColor(palette, 0, { r: 255, g: 206, b: 180, a: 255 });
    const hair = this.getColor(palette, 1, { r: 101, g: 67, b: 33, a: 255 });
    const shirt = this.getColor(palette, 2, { r: 65, g: 105, b: 225, a: 255 });
    const pants = this.getColor(palette, 3, { r: 25, g: 25, b: 112, a: 255 });
    const eyes = { r: 0, g: 0, b: 0, a: 255 };

    const scale = size / 16; // Base design on 16x16

    // Head
    const headY = Math.floor(2 * scale);
    const headSize = Math.floor(4 * scale);
    for (let y = headY; y < headY + headSize; y++) {
      for (let x = center - Math.floor(headSize / 2); x < center + Math.ceil(headSize / 2); x++) {
        pixels.push({ x, y, color: skin });
      }
    }

    // Hair
    for (let x = center - Math.floor(headSize / 2); x < center + Math.ceil(headSize / 2); x++) {
      pixels.push({ x, y: headY, color: hair });
      if (Math.random() > 0.5) {
        pixels.push({ x, y: headY - 1, color: hair });
      }
    }

    // Eyes
    const eyeY = headY + Math.floor(headSize / 3);
    pixels.push({ x: center - 1, y: eyeY, color: eyes });
    pixels.push({ x: center + 1, y: eyeY, color: eyes });

    // Body
    const bodyY = headY + headSize;
    const bodyHeight = Math.floor(4 * scale);
    const bodyWidth = Math.floor(4 * scale);
    for (let y = bodyY; y < bodyY + bodyHeight; y++) {
      for (let x = center - Math.floor(bodyWidth / 2); x < center + Math.ceil(bodyWidth / 2); x++) {
        pixels.push({ x, y, color: shirt });
      }
    }

    // Arms
    for (let y = bodyY; y < bodyY + Math.floor(bodyHeight * 0.8); y++) {
      pixels.push({ x: center - Math.floor(bodyWidth / 2) - 1, y, color: shirt });
      pixels.push({ x: center + Math.floor(bodyWidth / 2), y, color: shirt });
      // Hands
      if (y === bodyY + Math.floor(bodyHeight * 0.7)) {
        pixels.push({ x: center - Math.floor(bodyWidth / 2) - 1, y: y + 1, color: skin });
        pixels.push({ x: center + Math.floor(bodyWidth / 2), y: y + 1, color: skin });
      }
    }

    // Legs
    const legY = bodyY + bodyHeight;
    const legHeight = Math.floor(4 * scale);
    for (let y = legY; y < Math.min(legY + legHeight, size); y++) {
      pixels.push({ x: center - 1, y, color: pants });
      pixels.push({ x: center, y, color: pants });
      if (size >= 16) {
        pixels.push({ x: center + 1, y, color: pants });
        pixels.push({ x: center - 2, y, color: pants });
      }
    }

    return pixels;
  }

  // Generate an enemy sprite
  private generateEnemy(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];
    const center = Math.floor(size / 2);

    // Colors for slime-like enemy
    const bodyMain = this.getColor(palette, 0, { r: 50, g: 205, b: 50, a: 255 });
    const bodyDark = this.getColor(palette, 1, { r: 34, g: 139, b: 34, a: 255 });
    const bodyLight = this.getColor(palette, 2, { r: 144, g: 238, b: 144, a: 255 });
    const eyes = { r: 255, g: 255, b: 255, a: 255 };
    const pupils = { r: 0, g: 0, b: 0, a: 255 };

    // Blob body
    const radius = Math.floor(size / 3);
    const centerY = Math.floor(size * 0.6);

    for (let y = centerY - radius; y <= centerY + Math.floor(radius * 0.5); y++) {
      const rowRadius = Math.floor(Math.sqrt(Math.pow(radius, 2) - Math.pow(y - centerY, 2)));
      for (let x = center - rowRadius; x <= center + rowRadius; x++) {
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const distFromCenter = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - centerY, 2));
          let color = bodyMain;
          if (distFromCenter > radius * 0.7) {
            color = bodyDark;
          } else if (y < centerY - radius * 0.3) {
            color = bodyLight;
          }
          pixels.push({ x, y, color });
        }
      }
    }

    // Eyes
    const eyeY = centerY - Math.floor(radius * 0.3);
    const eyeSpacing = Math.floor(radius * 0.5);

    // Left eye
    pixels.push({ x: center - eyeSpacing, y: eyeY, color: eyes });
    pixels.push({ x: center - eyeSpacing, y: eyeY + 1, color: pupils });

    // Right eye
    pixels.push({ x: center + eyeSpacing, y: eyeY, color: eyes });
    pixels.push({ x: center + eyeSpacing, y: eyeY + 1, color: pupils });

    return pixels;
  }

  // Generate a cloud sprite
  private generateCloud(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];

    const cloudWhite = this.getColor(palette, 0, { r: 255, g: 255, b: 255, a: 255 });
    const cloudGray = this.getColor(palette, 1, { r: 220, g: 220, b: 220, a: 255 });

    const centerY = Math.floor(size / 2);
    const baseRadius = Math.floor(size / 4);

    // Multiple overlapping circles for cloud effect
    const circles = [
      { cx: Math.floor(size * 0.3), cy: centerY, r: baseRadius },
      { cx: Math.floor(size * 0.5), cy: centerY - Math.floor(baseRadius * 0.3), r: Math.floor(baseRadius * 1.2) },
      { cx: Math.floor(size * 0.7), cy: centerY, r: baseRadius },
    ];

    for (const circle of circles) {
      for (let y = circle.cy - circle.r; y <= circle.cy + circle.r; y++) {
        for (let x = circle.cx - circle.r; x <= circle.cx + circle.r; x++) {
          const dist = Math.sqrt(Math.pow(x - circle.cx, 2) + Math.pow(y - circle.cy, 2));
          if (dist <= circle.r && x >= 0 && x < size && y >= 0 && y < size) {
            const color = y > circle.cy ? cloudGray : cloudWhite;
            pixels.push({ x, y, color });
          }
        }
      }
    }

    return pixels;
  }

  // Generate a heart sprite
  private generateHeart(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];
    const center = Math.floor(size / 2);

    const heartRed = this.getColor(palette, 0, { r: 255, g: 0, b: 0, a: 255 });
    const heartPink = this.getColor(palette, 1, { r: 255, g: 100, b: 100, a: 255 });
    const heartDark = this.getColor(palette, 2, { r: 180, g: 0, b: 0, a: 255 });

    // Heart shape using parametric equation
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x - center) / (size / 2);
        const ny = (y - size * 0.4) / (size / 2);

        // Heart equation: (x^2 + y^2 - 1)^3 - x^2*y^3 < 0
        const val = Math.pow(nx * nx + ny * ny - 0.3, 3) - nx * nx * ny * ny * ny;

        if (val < 0) {
          let color = heartRed;
          if (nx < -0.2 && ny < 0) {
            color = heartPink; // Highlight
          } else if (nx > 0.2 || ny > 0.3) {
            color = heartDark; // Shadow
          }
          pixels.push({ x, y, color });
        }
      }
    }

    return pixels;
  }

  // Generate a coin sprite
  private generateCoin(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];
    const center = Math.floor(size / 2);

    const gold = this.getColor(palette, 0, { r: 255, g: 215, b: 0, a: 255 });
    const goldLight = this.getColor(palette, 1, { r: 255, g: 245, b: 100, a: 255 });
    const goldDark = this.getColor(palette, 2, { r: 184, g: 134, b: 11, a: 255 });

    const radius = Math.floor(size * 0.4);

    for (let y = center - radius; y <= center + radius; y++) {
      for (let x = center - radius; x <= center + radius; x++) {
        const dist = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
        if (dist <= radius) {
          let color = gold;
          if (dist > radius - 1) {
            color = goldDark;
          } else if (x < center - radius * 0.3 && y < center - radius * 0.3) {
            color = goldLight;
          }
          pixels.push({ x, y, color });
        }
      }
    }

    // Add $ symbol or simple mark
    const markY = center;
    pixels.push({ x: center, y: markY - 1, color: goldDark });
    pixels.push({ x: center, y: markY, color: goldDark });
    pixels.push({ x: center, y: markY + 1, color: goldDark });

    return pixels;
  }

  // Generate a sword sprite
  private generateSword(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];
    const center = Math.floor(size / 2);

    const blade = this.getColor(palette, 0, { r: 192, g: 192, b: 192, a: 255 });
    const bladeLight = this.getColor(palette, 1, { r: 220, g: 220, b: 220, a: 255 });
    const handle = this.getColor(palette, 2, { r: 139, g: 90, b: 43, a: 255 });
    const guard = this.getColor(palette, 3, { r: 255, g: 215, b: 0, a: 255 });

    // Blade (diagonal)
    const bladeLength = Math.floor(size * 0.7);
    for (let i = 0; i < bladeLength; i++) {
      const x = center - Math.floor(bladeLength / 2) + i;
      const y = size - 3 - i;
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels.push({ x, y, color: blade });
        if (i < bladeLength - 2) {
          pixels.push({ x: x + 1, y, color: bladeLight });
        }
      }
    }

    // Guard
    const guardY = size - 3;
    for (let x = center - 2; x <= center + 2; x++) {
      pixels.push({ x, y: guardY, color: guard });
    }

    // Handle
    for (let y = guardY + 1; y < size; y++) {
      pixels.push({ x: center, y, color: handle });
    }

    return pixels;
  }

  // Generate a potion sprite
  private generatePotion(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];
    const center = Math.floor(size / 2);

    const liquid = this.getColor(palette, 0, { r: 138, g: 43, b: 226, a: 255 });
    const liquidLight = this.getColor(palette, 1, { r: 186, g: 85, b: 211, a: 255 });
    const glass = this.getColor(palette, 2, { r: 200, g: 200, b: 255, a: 200 });
    const cork = this.getColor(palette, 3, { r: 139, g: 90, b: 43, a: 255 });

    // Bottle body
    const bodyTop = Math.floor(size * 0.35);
    const bodyBottom = size - 2;
    const bodyRadius = Math.floor(size * 0.35);

    for (let y = bodyTop; y <= bodyBottom; y++) {
      const progress = (y - bodyTop) / (bodyBottom - bodyTop);
      const rowRadius = Math.floor(bodyRadius * (0.6 + progress * 0.4));

      for (let x = center - rowRadius; x <= center + rowRadius; x++) {
        if (x >= 0 && x < size) {
          const isEdge = x === center - rowRadius || x === center + rowRadius;
          const color = isEdge ? glass : (x < center ? liquidLight : liquid);
          pixels.push({ x, y, color });
        }
      }
    }

    // Neck
    const neckTop = Math.floor(size * 0.15);
    const neckWidth = Math.floor(size * 0.15);
    for (let y = neckTop; y < bodyTop; y++) {
      for (let x = center - neckWidth; x <= center + neckWidth; x++) {
        const isEdge = x === center - neckWidth || x === center + neckWidth;
        pixels.push({ x, y, color: isEdge ? glass : liquid });
      }
    }

    // Cork
    for (let y = neckTop - 2; y < neckTop; y++) {
      for (let x = center - neckWidth; x <= center + neckWidth; x++) {
        pixels.push({ x, y, color: cork });
      }
    }

    return pixels;
  }

  // Generate a star sprite
  private generateStar(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];
    const center = Math.floor(size / 2);

    const starYellow = this.getColor(palette, 0, { r: 255, g: 255, b: 0, a: 255 });
    const starLight = this.getColor(palette, 1, { r: 255, g: 255, b: 150, a: 255 });
    const starOrange = this.getColor(palette, 2, { r: 255, g: 200, b: 0, a: 255 });

    // 5-pointed star
    const outerRadius = Math.floor(size * 0.45);
    const innerRadius = Math.floor(outerRadius * 0.4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const angle = Math.atan2(dy, dx);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Star shape calculation
        const starAngle = ((angle + Math.PI) / (2 * Math.PI)) * 5;
        const starPhase = starAngle % 1;
        const targetRadius = innerRadius + (outerRadius - innerRadius) *
          (starPhase < 0.5 ? starPhase * 2 : (1 - starPhase) * 2);

        if (dist <= targetRadius) {
          let color = starYellow;
          if (dist < targetRadius * 0.5) {
            color = starLight;
          } else if (dist > targetRadius * 0.8) {
            color = starOrange;
          }
          pixels.push({ x, y, color });
        }
      }
    }

    return pixels;
  }

  // Generate a house sprite
  private generateHouse(size: CanvasSize, palette?: Color[]): Pixel[] {
    const pixels: Pixel[] = [];

    const wall = this.getColor(palette, 0, { r: 210, g: 180, b: 140, a: 255 });
    const roof = this.getColor(palette, 1, { r: 139, g: 69, b: 19, a: 255 });
    const door = this.getColor(palette, 2, { r: 101, g: 67, b: 33, a: 255 });
    const window = this.getColor(palette, 3, { r: 135, g: 206, b: 235, a: 255 });

    const center = Math.floor(size / 2);
    const houseWidth = Math.floor(size * 0.7);
    const houseHeight = Math.floor(size * 0.5);
    const roofHeight = Math.floor(size * 0.35);

    // Roof (triangle)
    for (let y = 0; y < roofHeight; y++) {
      const rowWidth = Math.floor((y / roofHeight) * houseWidth);
      for (let x = center - rowWidth; x <= center + rowWidth; x++) {
        if (x >= 0 && x < size) {
          pixels.push({ x, y: y + 1, color: roof });
        }
      }
    }

    // Walls
    const wallTop = roofHeight + 1;
    const wallLeft = center - Math.floor(houseWidth / 2);
    const wallRight = center + Math.floor(houseWidth / 2);

    for (let y = wallTop; y < wallTop + houseHeight; y++) {
      for (let x = wallLeft; x <= wallRight; x++) {
        pixels.push({ x, y, color: wall });
      }
    }

    // Door
    const doorWidth = Math.floor(size * 0.15);
    const doorHeight = Math.floor(houseHeight * 0.6);
    const doorTop = wallTop + houseHeight - doorHeight;

    for (let y = doorTop; y < wallTop + houseHeight; y++) {
      for (let x = center - Math.floor(doorWidth / 2); x <= center + Math.floor(doorWidth / 2); x++) {
        pixels.push({ x, y, color: door });
      }
    }

    // Window
    const windowSize = Math.floor(size * 0.12);
    const windowY = wallTop + Math.floor(houseHeight * 0.2);

    // Left window
    for (let y = windowY; y < windowY + windowSize; y++) {
      for (let x = wallLeft + 2; x < wallLeft + 2 + windowSize; x++) {
        pixels.push({ x, y, color: window });
      }
    }

    // Right window
    for (let y = windowY; y < windowY + windowSize; y++) {
      for (let x = wallRight - 1 - windowSize; x < wallRight - 1; x++) {
        pixels.push({ x, y, color: window });
      }
    }

    return pixels;
  }

  // Generate abstract shape based on prompt
  private generateAbstract(size: CanvasSize, palette?: Color[], prompt: string = ''): Pixel[] {
    const pixels: Pixel[] = [];

    // Use prompt to seed randomness
    let seed = 0;
    for (let i = 0; i < prompt.length; i++) {
      seed += prompt.charCodeAt(i);
    }

    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    const baseColor = this.getColor(palette, 0, {
      r: Math.floor(random() * 255),
      g: Math.floor(random() * 255),
      b: Math.floor(random() * 255),
      a: 255,
    });

    const shapes = Math.floor(random() * 3) + 2;

    for (let s = 0; s < shapes; s++) {
      const shapeX = Math.floor(random() * size * 0.6) + size * 0.2;
      const shapeY = Math.floor(random() * size * 0.6) + size * 0.2;
      const shapeRadius = Math.floor(random() * size * 0.3) + size * 0.1;

      const shapeColor = {
        r: Math.min(255, baseColor.r + Math.floor((random() - 0.5) * 100)),
        g: Math.min(255, baseColor.g + Math.floor((random() - 0.5) * 100)),
        b: Math.min(255, baseColor.b + Math.floor((random() - 0.5) * 100)),
        a: 255,
      };

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dist = Math.sqrt(Math.pow(x - shapeX, 2) + Math.pow(y - shapeY, 2));
          if (dist <= shapeRadius) {
            pixels.push({ x, y, color: shapeColor });
          }
        }
      }
    }

    return pixels;
  }
}

// Export singleton instance
export const aiService = new AIService();
