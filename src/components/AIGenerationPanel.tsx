import { useState } from 'react';
import { useEditor } from '../store/EditorContext';
import { aiService } from '../services/aiService';
import type { CanvasSize, Color } from '../types';
import { DEFAULT_PALETTES } from '../types';

const SPRITE_SUGGESTIONS = [
  'tree',
  'character',
  'enemy slime',
  'cloud',
  'heart',
  'coin',
  'sword',
  'potion',
  'star',
  'house',
  'player hero',
  'zombie monster',
  'treasure chest',
  'flower',
  'rock',
  'bush',
];

const STYLE_PRESETS = [
  { id: 'retro', name: 'Retro 8-bit', description: 'Classic NES-style sprites' },
  { id: 'modern', name: 'Modern Pixel', description: 'Clean, detailed pixel art' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple, iconic shapes' },
];

export function AIGenerationPanel() {
  const { state, dispatch, createSprite } = useEditor();
  const { sprite } = state;

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSize, setSelectedSize] = useState<CanvasSize>(16);
  const [selectedStyle, setSelectedStyle] = useState('retro');
  const [usePalette, setUsePalette] = useState(true);
  const [selectedPaletteId, setSelectedPaletteId] = useState('nes');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your sprite');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Create sprite if none exists
      if (!sprite || sprite.width !== selectedSize) {
        createSprite(selectedSize, selectedSize, prompt.substring(0, 20));
      }

      // Get palette colors if selected
      let colorPalette: Color[] | undefined;
      if (usePalette) {
        const palette = DEFAULT_PALETTES.find(p => p.id === selectedPaletteId);
        colorPalette = palette?.colors;
      }

      // Generate using AI service
      const result = await aiService.generateSprite({
        prompt,
        size: selectedSize,
        style: selectedStyle as 'retro' | 'modern' | 'minimalist',
        colorPalette,
      });

      if (!result.success) {
        setError(result.error || 'Generation failed');
        return;
      }

      // Apply generated pixels to current layer
      if (result.pixels && result.pixels.length > 0) {
        // Clear current layer first
        dispatch({ type: 'CLEAR_CANVAS' });

        // Set the generated pixels
        dispatch({
          type: 'SET_PIXELS_BATCH',
          pixels: result.pixels.map(p => ({
            x: p.x,
            y: p.y,
            color: p.color,
          })),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleQuickGenerate = async (suggestion: string) => {
    setPrompt(suggestion);
    // Wait for state update then generate
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  return (
    <div className="panel p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          AI Generation
        </h3>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">
          Describe your sprite
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g., 'a cute green slime enemy' or 'pixel art tree'"
          className="w-full bg-editor-accent/50 text-white text-sm p-2 rounded resize-none h-20"
          disabled={isGenerating}
        />
      </div>

      {/* Quick Suggestions */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Quick ideas</label>
        <div className="flex flex-wrap gap-1">
          {SPRITE_SUGGESTIONS.slice(0, 8).map(suggestion => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs px-2 py-1 bg-editor-accent/30 rounded hover:bg-editor-accent/50 transition-colors"
              disabled={isGenerating}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Sprite Size</label>
        <div className="flex gap-1">
          {([8, 16, 32, 64] as CanvasSize[]).map(size => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`flex-1 text-xs py-1 rounded transition-colors ${
                selectedSize === size
                  ? 'bg-editor-highlight text-white'
                  : 'bg-editor-accent/30 hover:bg-editor-accent/50'
              }`}
              disabled={isGenerating}
            >
              {size}x{size}
            </button>
          ))}
        </div>
      </div>

      {/* Style Selection */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Style</label>
        <select
          value={selectedStyle}
          onChange={e => setSelectedStyle(e.target.value)}
          className="w-full bg-editor-accent text-white text-sm p-2 rounded"
          disabled={isGenerating}
        >
          {STYLE_PRESETS.map(style => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
        </select>
      </div>

      {/* Palette Option */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="usePalette"
          checked={usePalette}
          onChange={e => setUsePalette(e.target.checked)}
          className="accent-editor-highlight"
          disabled={isGenerating}
        />
        <label htmlFor="usePalette" className="text-xs text-gray-400">
          Use color palette
        </label>
      </div>

      {usePalette && (
        <select
          value={selectedPaletteId}
          onChange={e => setSelectedPaletteId(e.target.value)}
          className="w-full bg-editor-accent text-white text-sm p-2 rounded"
          disabled={isGenerating}
        >
          {DEFAULT_PALETTES.map(palette => (
            <option key={palette.id} value={palette.id}>
              {palette.name}
            </option>
          ))}
        </select>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-xs text-red-400 bg-red-900/30 p-2 rounded">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className={`btn-primary w-full flex items-center justify-center gap-2 ${
          isGenerating ? 'opacity-50 cursor-wait' : ''
        }`}
      >
        {isGenerating ? (
          <>
            <span className="animate-spin">⚙️</span>
            Generating...
          </>
        ) : (
          <>
            <span>✨</span>
            Generate Sprite
          </>
        )}
      </button>

      {/* Quick Generate Buttons */}
      <div className="border-t border-editor-accent/30 pt-3">
        <label className="text-xs text-gray-400 block mb-2">One-click generate</label>
        <div className="grid grid-cols-2 gap-1">
          {['tree', 'character', 'enemy slime', 'heart'].map(item => (
            <button
              key={item}
              onClick={() => handleQuickGenerate(item)}
              disabled={isGenerating}
              className="text-xs py-2 bg-editor-accent/30 rounded hover:bg-editor-highlight/50 transition-colors capitalize"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="text-xs text-gray-500 border-t border-editor-accent/30 pt-3">
        <p className="mb-1">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Be specific: "red dragon" vs just "dragon"</li>
          <li>Mention style: "cute", "scary", "cartoon"</li>
          <li>8x8 for icons, 16x16 for characters</li>
        </ul>
      </div>
    </div>
  );
}
