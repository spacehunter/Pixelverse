import { useState, useMemo } from 'react';
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

// Color palette for quick color additions
const COLOR_MODIFIERS = [
  { name: 'red', color: '#ef4444', text: 'red' },
  { name: 'blue', color: '#3b82f6', text: 'blue' },
  { name: 'green', color: '#22c55e', text: 'green' },
  { name: 'purple', color: '#a855f7', text: 'purple' },
  { name: 'gold', color: '#eab308', text: 'golden' },
  { name: 'silver', color: '#94a3b8', text: 'silver' },
  { name: 'black', color: '#1f2937', text: 'dark' },
  { name: 'white', color: '#f8fafc', text: 'white' },
];

// Context-aware keyword patterns and their associated modifiers
interface ModifierGroup {
  keywords: string[];
  modifiers: { label: string; text: string; icon?: string }[];
}

const CONTEXT_MODIFIERS: ModifierGroup[] = [
  {
    keywords: ['slime', 'blob', 'jelly', 'goo'],
    modifiers: [
      { label: 'Cute eyes', text: 'with cute big eyes', icon: '👀' },
      { label: 'Gooey', text: 'gooey and dripping', icon: '💧' },
      { label: 'Bouncy', text: 'bouncy and squishy', icon: '🔮' },
      { label: 'Angry', text: 'with angry expression', icon: '😠' },
      { label: 'Happy', text: 'with happy smile', icon: '😊' },
      { label: 'Glowing', text: 'with magical glow', icon: '✨' },
    ],
  },
  {
    keywords: ['knight', 'warrior', 'soldier', 'paladin', 'crusader'],
    modifiers: [
      { label: 'Shiny armor', text: 'with shiny polished armor', icon: '🛡️' },
      { label: 'Battle-worn', text: 'with battle-scarred armor', icon: '⚔️' },
      { label: 'Royal', text: 'with royal ornate armor', icon: '👑' },
      { label: 'Holding sword', text: 'holding a sword', icon: '🗡️' },
      { label: 'With shield', text: 'carrying a shield', icon: '🛡️' },
      { label: 'Heroic pose', text: 'in heroic stance', icon: '💪' },
    ],
  },
  {
    keywords: ['dragon', 'wyrm', 'drake', 'wyvern'],
    modifiers: [
      { label: 'Fire breath', text: 'breathing fire', icon: '🔥' },
      { label: 'Wings spread', text: 'with wings spread', icon: '🦅' },
      { label: 'Fierce', text: 'looking fierce and menacing', icon: '😤' },
      { label: 'Baby dragon', text: 'baby dragon cute', icon: '🥚' },
      { label: 'Scales', text: 'with detailed scales', icon: '🐉' },
      { label: 'Horned', text: 'with large horns', icon: '🦌' },
    ],
  },
  {
    keywords: ['sword', 'blade', 'weapon', 'dagger', 'knife'],
    modifiers: [
      { label: 'Glowing', text: 'with magical glow', icon: '✨' },
      { label: 'Flaming', text: 'engulfed in flames', icon: '🔥' },
      { label: 'Ice', text: 'frozen with ice crystals', icon: '❄️' },
      { label: 'Ancient', text: 'ancient and legendary', icon: '📜' },
      { label: 'Ornate', text: 'with ornate handle', icon: '💎' },
      { label: 'Rusted', text: 'old and rusted', icon: '🗡️' },
    ],
  },
  {
    keywords: ['wizard', 'mage', 'witch', 'sorcerer', 'warlock'],
    modifiers: [
      { label: 'With staff', text: 'holding magical staff', icon: '🪄' },
      { label: 'Casting', text: 'casting a spell', icon: '✨' },
      { label: 'Hooded', text: 'wearing mystical hood', icon: '🧙' },
      { label: 'Old wise', text: 'old and wise looking', icon: '📚' },
      { label: 'Young', text: 'young apprentice', icon: '🎓' },
      { label: 'Evil', text: 'with evil sinister look', icon: '😈' },
    ],
  },
  {
    keywords: ['potion', 'bottle', 'flask', 'vial'],
    modifiers: [
      { label: 'Bubbling', text: 'with bubbles inside', icon: '🫧' },
      { label: 'Glowing', text: 'glowing brightly', icon: '✨' },
      { label: 'Health', text: 'health potion', icon: '❤️' },
      { label: 'Mana', text: 'mana potion', icon: '💙' },
      { label: 'Poison', text: 'poison potion', icon: '☠️' },
      { label: 'Corked', text: 'with cork stopper', icon: '🍾' },
    ],
  },
  {
    keywords: ['chest', 'treasure', 'box', 'crate'],
    modifiers: [
      { label: 'Open', text: 'open with gold inside', icon: '📂' },
      { label: 'Locked', text: 'locked with padlock', icon: '🔒' },
      { label: 'Glowing', text: 'with magical glow', icon: '✨' },
      { label: 'Wooden', text: 'wooden with metal bands', icon: '🪵' },
      { label: 'Ornate', text: 'ornate and decorated', icon: '👑' },
      { label: 'Old', text: 'old and dusty', icon: '🕸️' },
    ],
  },
  {
    keywords: ['tree', 'plant', 'forest', 'flower'],
    modifiers: [
      { label: 'Magical', text: 'magical and glowing', icon: '✨' },
      { label: 'Autumn', text: 'with autumn leaves', icon: '🍂' },
      { label: 'Cherry', text: 'cherry blossom', icon: '🌸' },
      { label: 'Dead', text: 'dead and spooky', icon: '💀' },
      { label: 'Large', text: 'large and ancient', icon: '🌳' },
      { label: 'Small', text: 'small sapling', icon: '🌱' },
    ],
  },
  {
    keywords: ['monster', 'creature', 'beast', 'enemy'],
    modifiers: [
      { label: 'Cute', text: 'cute and friendly', icon: '🥰' },
      { label: 'Scary', text: 'scary and menacing', icon: '👹' },
      { label: 'Giant', text: 'giant sized', icon: '🦣' },
      { label: 'Tiny', text: 'tiny and small', icon: '🐜' },
      { label: 'Glowing eyes', text: 'with glowing eyes', icon: '👁️' },
      { label: 'Fangs', text: 'with sharp fangs', icon: '🦷' },
    ],
  },
  {
    keywords: ['character', 'hero', 'person', 'adventurer', 'player'],
    modifiers: [
      { label: 'Idle pose', text: 'in idle stance', icon: '🧍' },
      { label: 'Action pose', text: 'in action pose', icon: '🏃' },
      { label: 'With cape', text: 'wearing flowing cape', icon: '🦸' },
      { label: 'Armored', text: 'wearing armor', icon: '🛡️' },
      { label: 'Robed', text: 'wearing robes', icon: '👘' },
      { label: 'Happy', text: 'with happy expression', icon: '😊' },
    ],
  },
  {
    keywords: ['gem', 'crystal', 'jewel', 'diamond', 'ruby', 'emerald'],
    modifiers: [
      { label: 'Glowing', text: 'glowing with inner light', icon: '✨' },
      { label: 'Faceted', text: 'with many facets', icon: '💎' },
      { label: 'Floating', text: 'floating with magic', icon: '🔮' },
      { label: 'Cracked', text: 'with visible cracks', icon: '💔' },
      { label: 'Cluster', text: 'crystal cluster', icon: '🔷' },
      { label: 'Raw', text: 'raw uncut', icon: '🪨' },
    ],
  },
  {
    keywords: ['coin', 'gold', 'money', 'currency', 'treasure'],
    modifiers: [
      { label: 'Shiny', text: 'shiny and polished', icon: '✨' },
      { label: 'Stacked', text: 'stacked pile', icon: '🪙' },
      { label: 'Ancient', text: 'ancient and worn', icon: '📜' },
      { label: 'Spinning', text: 'spinning animation', icon: '🔄' },
      { label: 'Glowing', text: 'with golden glow', icon: '🌟' },
      { label: 'Embossed', text: 'with embossed design', icon: '👑' },
    ],
  },
  {
    keywords: ['castle', 'tower', 'fortress', 'keep', 'palace'],
    modifiers: [
      { label: 'Medieval', text: 'medieval style', icon: '🏰' },
      { label: 'Ruined', text: 'ruined and crumbling', icon: '🏚️' },
      { label: 'Tall towers', text: 'with tall towers', icon: '🗼' },
      { label: 'Flags', text: 'with flying flags', icon: '🚩' },
      { label: 'Haunted', text: 'dark and haunted', icon: '👻' },
      { label: 'Floating', text: 'floating in sky', icon: '☁️' },
    ],
  },
  {
    keywords: ['mushroom', 'fungus', 'shroom', 'toadstool'],
    modifiers: [
      { label: 'Spotted', text: 'with white spots', icon: '⚪' },
      { label: 'Glowing', text: 'bioluminescent glowing', icon: '✨' },
      { label: 'Tall', text: 'tall and thin', icon: '📏' },
      { label: 'Cluster', text: 'cluster of mushrooms', icon: '🍄' },
      { label: 'Fantasy', text: 'fantasy magical', icon: '🔮' },
      { label: 'Poison', text: 'poisonous looking', icon: '☠️' },
    ],
  },
  {
    keywords: ['heart', 'love', 'health', 'life'],
    modifiers: [
      { label: 'Glowing', text: 'glowing brightly', icon: '✨' },
      { label: 'Pixel', text: 'classic pixel style', icon: '👾' },
      { label: 'Beating', text: 'pulsing animation', icon: '💗' },
      { label: 'Broken', text: 'cracked and broken', icon: '💔' },
      { label: 'Golden', text: 'golden special', icon: '💛' },
      { label: 'Crystal', text: 'crystal heart', icon: '💎' },
    ],
  },
  {
    keywords: ['icon', 'ui', 'button', 'interface'],
    modifiers: [
      { label: 'Simple', text: 'simple and clean', icon: '⬜' },
      { label: 'Glowing', text: 'with glow effect', icon: '✨' },
      { label: 'Outlined', text: 'with outline', icon: '⭕' },
      { label: '3D style', text: 'with 3D depth', icon: '📦' },
      { label: 'Flat', text: 'flat design', icon: '📋' },
      { label: 'Rounded', text: 'with rounded corners', icon: '🔲' },
    ],
  },
];

// General modifiers that work with any prompt
const GENERAL_MODIFIERS = [
  { label: 'Glowing', text: 'with magical glow', icon: '✨' },
  { label: 'Cute', text: 'cute and adorable', icon: '🥰' },
  { label: 'Dark', text: 'dark and shadowy', icon: '🌑' },
  { label: 'Shiny', text: 'shiny and polished', icon: '💫' },
  { label: 'Old', text: 'old and weathered', icon: '📜' },
  { label: 'Fantasy', text: 'fantasy style', icon: '🏰' },
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
  const [showEnhancer, setShowEnhancer] = useState(true);

  const availableStyles = selectedModel === 'rd-fast' ? RD_FAST_STYLES : RD_PLUS_STYLES;

  // Detect context from prompt and get relevant modifiers
  const contextModifiers = useMemo(() => {
    if (!prompt.trim()) return [];

    const lowerPrompt = prompt.toLowerCase();
    const matchedModifiers: { label: string; text: string; icon?: string }[] = [];

    // Find matching context groups
    for (const group of CONTEXT_MODIFIERS) {
      const hasKeyword = group.keywords.some(keyword => lowerPrompt.includes(keyword));
      if (hasKeyword) {
        // Filter out modifiers that are already in the prompt
        const availableModifiers = group.modifiers.filter(
          mod => !lowerPrompt.includes(mod.text.toLowerCase().split(' ')[0])
        );
        matchedModifiers.push(...availableModifiers);
      }
    }

    // If no specific context found, show general modifiers
    if (matchedModifiers.length === 0 && prompt.trim().length > 2) {
      return GENERAL_MODIFIERS.filter(
        mod => !lowerPrompt.includes(mod.text.toLowerCase().split(' ')[0])
      );
    }

    // Limit to 6 suggestions for space
    return matchedModifiers.slice(0, 6);
  }, [prompt]);

  // Check which colors are already mentioned in the prompt
  const availableColors = useMemo(() => {
    const lowerPrompt = prompt.toLowerCase();
    return COLOR_MODIFIERS.filter(
      color => !lowerPrompt.includes(color.text.toLowerCase())
    );
  }, [prompt]);

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

  // Append modifier text to the current prompt
  const handleModifierClick = (modifierText: string) => {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt) {
      // Add space and modifier to existing prompt
      setPrompt(`${trimmedPrompt} ${modifierText}`);
    } else {
      setPrompt(modifierText);
    }
  };

  // Add color to the prompt
  const handleColorClick = (colorText: string) => {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt) {
      // Try to insert color intelligently at the start or after "a/an"
      if (trimmedPrompt.match(/^(a|an)\s+/i)) {
        setPrompt(trimmedPrompt.replace(/^(a|an)\s+/i, `$1 ${colorText} `));
      } else {
        setPrompt(`${colorText} ${trimmedPrompt}`);
      }
    } else {
      setPrompt(colorText);
    }
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

      {/* Prompt Enhancer - Color & Modifier Suggestions */}
      <div className="border border-editor-accent/40 rounded overflow-hidden">
        <button
          onClick={() => setShowEnhancer(!showEnhancer)}
          className="w-full flex items-center justify-between px-2 py-1.5 bg-editor-accent/20 hover:bg-editor-accent/30 transition-colors text-xs"
          disabled={isGenerating}
        >
          <span className="flex items-center gap-1.5 text-gray-300">
            <span>🎨</span>
            <span>Enhance Prompt</span>
            {prompt.trim() && contextModifiers.length > 0 && (
              <span className="bg-editor-highlight/60 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                {contextModifiers.length} suggestions
              </span>
            )}
          </span>
          <span className={`text-gray-500 transition-transform ${showEnhancer ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {showEnhancer && (
          <div className="p-2 space-y-2 bg-editor-accent/10">
            {/* Color Palette */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                Add Color
              </label>
              <div className="flex flex-wrap gap-1">
                {availableColors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => handleColorClick(color.text)}
                    className="group relative w-6 h-6 rounded border border-editor-accent/50 hover:border-white/50 hover:scale-110 transition-all"
                    style={{ backgroundColor: color.color }}
                    disabled={isGenerating}
                    title={`Add "${color.text}" to prompt`}
                  >
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                      {color.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Context-Aware Modifiers */}
            {(contextModifiers.length > 0 || !prompt.trim()) && (
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                  {prompt.trim() ? 'Add Details' : 'Start typing to see suggestions'}
                </label>
                {contextModifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {contextModifiers.map((mod, idx) => (
                      <button
                        key={`${mod.label}-${idx}`}
                        onClick={() => handleModifierClick(mod.text)}
                        className="flex items-center gap-1 text-[11px] px-2 py-1 bg-editor-accent/40 rounded hover:bg-editor-highlight/50 transition-colors group"
                        disabled={isGenerating}
                        title={`Add "${mod.text}"`}
                      >
                        {mod.icon && <span className="text-xs">{mod.icon}</span>}
                        <span>{mod.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
