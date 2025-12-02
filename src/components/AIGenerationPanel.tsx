import { useState } from 'react';
import { useEditor } from '../store/EditorContext';
import { aiService, RD_FAST_STYLES, RD_PLUS_STYLES, type ReplicateModel } from '../services/aiService';
import type { CanvasSize } from '../types';

const SPRITE_SUGGESTIONS = [
  'a cute slime monster',
  'pixel art sword',
  'treasure chest',
  'magic potion bottle',
  'fantasy tree',
  'knight character',
  'dragon',
  'heart icon',
  'gold coin',
  'castle',
  'mushroom',
  'crystal gem',
];

const MODEL_INFO: Record<ReplicateModel, { name: string; description: string }> = {
  'rd-fast': { name: 'RD Fast', description: 'Quick generation, 15 styles' },
  'rd-plus': { name: 'RD Plus', description: 'Higher quality, 19 styles' },
};

export function AIGenerationPanel() {
  const { state, dispatch, createSprite } = useEditor();
  const { sprite } = state;

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSize, setSelectedSize] = useState<CanvasSize>(32);
  const [selectedModel, setSelectedModel] = useState<ReplicateModel>('rd-fast');
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [removeBackground, setRemoveBackground] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const availableStyles = selectedModel === 'rd-fast' ? RD_FAST_STYLES : RD_PLUS_STYLES;

  // Reset style when model changes if current style isn't available
  const handleModelChange = (model: ReplicateModel) => {
    setSelectedModel(model);
    const newStyles = model === 'rd-fast' ? RD_FAST_STYLES : RD_PLUS_STYLES;
    if (!newStyles.includes(selectedStyle as never)) {
      setSelectedStyle('default');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your sprite');
      return;
    }

    setError(null);
    setGeneratedImageUrl(null);
    setIsGenerating(true);

    try {
      // Create sprite if none exists or size changed
      if (!sprite || sprite.width !== selectedSize) {
        createSprite(selectedSize, selectedSize, prompt.substring(0, 20));
      }

      // Generate using Replicate AI service
      const result = await aiService.generateSprite({
        prompt,
        size: selectedSize,
        model: selectedModel,
        style: selectedStyle,
        removeBackground,
      });

      if (!result.success) {
        setError(result.error || 'Generation failed');
        return;
      }

      if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
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

  const formatStyleName = (style: string) => {
    return style
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col gap-3">
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
          placeholder="e.g., 'a cute green slime monster' or 'pixel art magic sword'"
          className="w-full bg-editor-accent/50 text-white text-sm p-2 rounded resize-none h-20 focus:outline-none focus:ring-1 focus:ring-editor-highlight"
          disabled={isGenerating}
        />
      </div>

      {/* Quick Suggestions */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Quick ideas</label>
        <div className="flex flex-wrap gap-1">
          {SPRITE_SUGGESTIONS.slice(0, 6).map(suggestion => (
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

      {/* Model Selection */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Model</label>
        <div className="flex gap-1">
          {(Object.keys(MODEL_INFO) as ReplicateModel[]).map(model => (
            <button
              key={model}
              onClick={() => handleModelChange(model)}
              className={`flex-1 text-xs py-2 rounded transition-colors ${
                selectedModel === model
                  ? 'bg-editor-highlight text-white'
                  : 'bg-editor-accent/30 hover:bg-editor-accent/50'
              }`}
              disabled={isGenerating}
              title={MODEL_INFO[model].description}
            >
              {MODEL_INFO[model].name}
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
          className="w-full bg-editor-accent text-white text-sm p-2 rounded focus:outline-none focus:ring-1 focus:ring-editor-highlight"
          disabled={isGenerating}
        >
          {availableStyles.map(style => (
            <option key={style} value={style}>
              {formatStyleName(style)}
            </option>
          ))}
        </select>
      </div>

      {/* Size Selection */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Sprite Size</label>
        <div className="flex gap-1">
          {([16, 32, 64, 128] as CanvasSize[]).map(size => (
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

      {/* Options */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="removeBackground"
          checked={removeBackground}
          onChange={e => setRemoveBackground(e.target.checked)}
          className="accent-editor-highlight"
          disabled={isGenerating}
        />
        <label htmlFor="removeBackground" className="text-xs text-gray-400">
          Remove background (transparent)
        </label>
      </div>

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
        className={`w-full py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2 ${
          isGenerating || !prompt.trim()
            ? 'bg-editor-accent/50 text-gray-500 cursor-not-allowed'
            : 'bg-editor-highlight hover:bg-editor-highlight/80 text-white'
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

      {/* Generated Image Preview */}
      {generatedImageUrl && (
        <div className="border-t border-editor-accent/30 pt-3">
          <label className="text-xs text-gray-400 block mb-2">Generated Result</label>
          <div className="bg-editor-accent/30 rounded p-2 flex justify-center">
            <img
              src={generatedImageUrl}
              alt="Generated sprite"
              className="max-w-full h-auto"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-gray-500 border-t border-editor-accent/30 pt-3">
        <p className="mb-1">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Be descriptive: "red dragon breathing fire"</li>
          <li>RD Fast is quicker, RD Plus has better quality</li>
          <li>Try different styles for varied results</li>
          <li>32x32 or 64x64 work best for characters</li>
        </ul>
      </div>
    </div>
  );
}
