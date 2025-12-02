// Core types for the Pixelverse sprite editor

export type CanvasSize = 8 | 16 | 32 | 64 | 128;

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Pixel {
  x: number;
  y: number;
  color: Color;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  pixels: Map<string, Color>; // key: "x,y"
}

export interface Frame {
  id: string;
  layers: Layer[];
  duration: number; // milliseconds
}

export interface Sprite {
  id: string;
  name: string;
  width: CanvasSize;
  height: CanvasSize;
  frames: Frame[];
  createdAt: Date;
  updatedAt: Date;
}

export type Tool =
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'eyedropper'
  | 'select'
  | 'move'
  | 'pan'
  | 'line'
  | 'rectangle'
  | 'circle';

export interface EditorState {
  sprite: Sprite | null;
  currentTool: Tool;
  primaryColor: Color;
  secondaryColor: Color;
  currentFrameIndex: number;
  currentLayerIndex: number;
  zoom: number;
  showGrid: boolean;
  isPlaying: boolean;
  brushSize: number;
}

export interface HistoryEntry {
  type: 'pixel' | 'frame' | 'layer';
  data: unknown;
  timestamp: number;
}

// AI Generation types are defined in src/services/aiService.ts

// Palette types
export interface ColorPalette {
  id: string;
  name: string;
  colors: Color[];
}

// Default palettes
export const DEFAULT_PALETTES: ColorPalette[] = [
  {
    id: 'nes',
    name: 'NES',
    colors: [
      { r: 0, g: 0, b: 0, a: 255 },
      { r: 252, g: 252, b: 252, a: 255 },
      { r: 248, g: 56, b: 0, a: 255 },
      { r: 0, g: 168, b: 0, a: 255 },
      { r: 0, g: 88, b: 248, a: 255 },
      { r: 248, g: 184, b: 0, a: 255 },
      { r: 0, g: 168, b: 248, a: 255 },
      { r: 104, g: 68, b: 0, a: 255 },
      { r: 124, g: 124, b: 124, a: 255 },
      { r: 248, g: 120, b: 88, a: 255 },
      { r: 88, g: 216, b: 84, a: 255 },
      { r: 88, g: 248, b: 152, a: 255 },
      { r: 248, g: 216, b: 120, a: 255 },
      { r: 216, g: 0, b: 204, a: 255 },
      { r: 248, g: 184, b: 248, a: 255 },
      { r: 188, g: 188, b: 188, a: 255 },
    ],
  },
  {
    id: 'gameboy',
    name: 'Game Boy',
    colors: [
      { r: 15, g: 56, b: 15, a: 255 },
      { r: 48, g: 98, b: 48, a: 255 },
      { r: 139, g: 172, b: 15, a: 255 },
      { r: 155, g: 188, b: 15, a: 255 },
    ],
  },
  {
    id: 'pico8',
    name: 'PICO-8',
    colors: [
      { r: 0, g: 0, b: 0, a: 255 },
      { r: 29, g: 43, b: 83, a: 255 },
      { r: 126, g: 37, b: 83, a: 255 },
      { r: 0, g: 135, b: 81, a: 255 },
      { r: 171, g: 82, b: 54, a: 255 },
      { r: 95, g: 87, b: 79, a: 255 },
      { r: 194, g: 195, b: 199, a: 255 },
      { r: 255, g: 241, b: 232, a: 255 },
      { r: 255, g: 0, b: 77, a: 255 },
      { r: 255, g: 163, b: 0, a: 255 },
      { r: 255, g: 236, b: 39, a: 255 },
      { r: 0, g: 228, b: 54, a: 255 },
      { r: 41, g: 173, b: 255, a: 255 },
      { r: 131, g: 118, b: 156, a: 255 },
      { r: 255, g: 119, b: 168, a: 255 },
      { r: 255, g: 204, b: 170, a: 255 },
    ],
  },
];

// Utility functions
export function colorToHex(color: Color): string {
  const r = color.r.toString(16).padStart(2, '0');
  const g = color.g.toString(16).padStart(2, '0');
  const b = color.b.toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function hexToColor(hex: string): Color {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 255,
    };
  }
  return { r: 0, g: 0, b: 0, a: 255 };
}

export function colorToRgba(color: Color): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}

export function colorsEqual(a: Color, b: Color): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

export function createPixelKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function parsePixelKey(key: string): { x: number; y: number } {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}
