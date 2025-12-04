import { useState, useMemo, useEffect, useRef } from 'react';
import { useEditor } from '../store/EditorContext';
import { aiService, RD_FAST_STYLES, RD_PLUS_STYLES, type ReplicateModel } from '../services/aiService';
import { groqService } from '../services/groqService';
import type { CanvasSize } from '../types';

interface AIGeneratedDetail {
  label: string;
  text: string;
}

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

// Expanded color families with variations for richer color selection
interface ColorVariation {
  name: string;
  color: string;
  text: string;
}

interface ColorFamily {
  name: string;
  baseColor: string;
  variations: ColorVariation[];
}

const COLOR_FAMILIES: ColorFamily[] = [
  {
    name: 'red',
    baseColor: '#ef4444',
    variations: [
      { name: 'red', color: '#ef4444', text: 'red' },
      { name: 'crimson', color: '#dc143c', text: 'crimson' },
      { name: 'scarlet', color: '#ff2400', text: 'scarlet' },
      { name: 'ruby', color: '#e0115f', text: 'ruby red' },
      { name: 'coral', color: '#ff7f50', text: 'coral' },
      { name: 'maroon', color: '#800000', text: 'maroon' },
      { name: 'cherry', color: '#de3163', text: 'cherry red' },
      { name: 'rose', color: '#ff007f', text: 'rose' },
      { name: 'burgundy', color: '#722f37', text: 'burgundy' },
      { name: 'blood red', color: '#8a0303', text: 'blood red' },
    ],
  },
  {
    name: 'blue',
    baseColor: '#3b82f6',
    variations: [
      { name: 'blue', color: '#3b82f6', text: 'blue' },
      { name: 'navy', color: '#000080', text: 'navy blue' },
      { name: 'royal', color: '#4169e1', text: 'royal blue' },
      { name: 'sky', color: '#87ceeb', text: 'sky blue' },
      { name: 'cyan', color: '#00ffff', text: 'cyan' },
      { name: 'teal', color: '#008080', text: 'teal' },
      { name: 'sapphire', color: '#0f52ba', text: 'sapphire blue' },
      { name: 'azure', color: '#007fff', text: 'azure' },
      { name: 'cobalt', color: '#0047ab', text: 'cobalt blue' },
      { name: 'ice', color: '#a5f2f3', text: 'ice blue' },
    ],
  },
  {
    name: 'green',
    baseColor: '#22c55e',
    variations: [
      { name: 'green', color: '#22c55e', text: 'green' },
      { name: 'emerald', color: '#50c878', text: 'emerald green' },
      { name: 'forest', color: '#228b22', text: 'forest green' },
      { name: 'lime', color: '#32cd32', text: 'lime green' },
      { name: 'mint', color: '#98fb98', text: 'mint green' },
      { name: 'olive', color: '#808000', text: 'olive green' },
      { name: 'jade', color: '#00a86b', text: 'jade green' },
      { name: 'sage', color: '#9dc183', text: 'sage green' },
      { name: 'seafoam', color: '#71eeb8', text: 'seafoam green' },
      { name: 'hunter', color: '#355e3b', text: 'hunter green' },
    ],
  },
  {
    name: 'purple',
    baseColor: '#a855f7',
    variations: [
      { name: 'purple', color: '#a855f7', text: 'purple' },
      { name: 'violet', color: '#8b00ff', text: 'violet' },
      { name: 'lavender', color: '#e6e6fa', text: 'lavender' },
      { name: 'plum', color: '#8e4585', text: 'plum' },
      { name: 'magenta', color: '#ff00ff', text: 'magenta' },
      { name: 'grape', color: '#6f2da8', text: 'grape purple' },
      { name: 'amethyst', color: '#9966cc', text: 'amethyst' },
      { name: 'indigo', color: '#4b0082', text: 'indigo' },
      { name: 'lilac', color: '#c8a2c8', text: 'lilac' },
      { name: 'orchid', color: '#da70d6', text: 'orchid' },
    ],
  },
  {
    name: 'gold',
    baseColor: '#eab308',
    variations: [
      { name: 'gold', color: '#ffd700', text: 'golden' },
      { name: 'amber', color: '#ffbf00', text: 'amber' },
      { name: 'mustard', color: '#ffdb58', text: 'mustard yellow' },
      { name: 'honey', color: '#eb9605', text: 'honey colored' },
      { name: 'brass', color: '#b5a642', text: 'brass' },
      { name: 'bronze', color: '#cd7f32', text: 'bronze' },
      { name: 'copper', color: '#b87333', text: 'copper' },
      { name: 'ochre', color: '#cc7722', text: 'ochre' },
      { name: 'saffron', color: '#f4c430', text: 'saffron' },
      { name: 'canary', color: '#ffef00', text: 'canary yellow' },
    ],
  },
  {
    name: 'silver',
    baseColor: '#94a3b8',
    variations: [
      { name: 'silver', color: '#c0c0c0', text: 'silver' },
      { name: 'steel', color: '#71797e', text: 'steel gray' },
      { name: 'slate', color: '#708090', text: 'slate gray' },
      { name: 'chrome', color: '#dbe4eb', text: 'chrome' },
      { name: 'pewter', color: '#8e9196', text: 'pewter' },
      { name: 'gunmetal', color: '#2a3439', text: 'gunmetal' },
      { name: 'ash', color: '#b2beb5', text: 'ash gray' },
      { name: 'charcoal', color: '#36454f', text: 'charcoal' },
      { name: 'smoke', color: '#848884', text: 'smoke gray' },
      { name: 'platinum', color: '#e5e4e2', text: 'platinum' },
    ],
  },
  {
    name: 'black',
    baseColor: '#1f2937',
    variations: [
      { name: 'black', color: '#000000', text: 'black' },
      { name: 'dark', color: '#1f2937', text: 'dark' },
      { name: 'shadow', color: '#0a0a0a', text: 'shadowy' },
      { name: 'obsidian', color: '#0b1215', text: 'obsidian black' },
      { name: 'jet', color: '#0a0a0a', text: 'jet black' },
      { name: 'midnight', color: '#191970', text: 'midnight' },
      { name: 'onyx', color: '#353839', text: 'onyx black' },
      { name: 'ebony', color: '#282c34', text: 'ebony' },
      { name: 'raven', color: '#0d0d0d', text: 'raven black' },
      { name: 'void', color: '#050505', text: 'void black' },
    ],
  },
  {
    name: 'white',
    baseColor: '#f8fafc',
    variations: [
      { name: 'white', color: '#ffffff', text: 'white' },
      { name: 'ivory', color: '#fffff0', text: 'ivory' },
      { name: 'cream', color: '#fffdd0', text: 'cream colored' },
      { name: 'pearl', color: '#fdeef4', text: 'pearl white' },
      { name: 'snow', color: '#fffafa', text: 'snow white' },
      { name: 'ghost', color: '#f8f8ff', text: 'ghostly white' },
      { name: 'pale', color: '#faf0e6', text: 'pale' },
      { name: 'frost', color: '#e8e8e8', text: 'frost white' },
      { name: 'bone', color: '#e3dac9', text: 'bone white' },
      { name: 'cloud', color: '#f0f0f0', text: 'cloud white' },
    ],
  },
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
  const { sprite, currentFrameIndex } = state;

  // Check if the current frame is blank (all layers have no pixels)
  const isCurrentFrameBlank = (): boolean => {
    if (!sprite) return true;
    const currentFrame = sprite.frames[currentFrameIndex];
    if (!currentFrame) return true;
    return currentFrame.layers.every(layer => layer.pixels.size === 0);
  };

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSize, setSelectedSize] = useState<CanvasSize>(32);
  const [selectedModel, setSelectedModel] = useState<ReplicateModel>('rd-fast');
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [removeBackground, setRemoveBackground] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showEnhancer, setShowEnhancer] = useState(true);
  const [expandedColorFamily, setExpandedColorFamily] = useState<string | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [aiGeneratedIdeas, setAiGeneratedIdeas] = useState<string[] | null>(null);
  const [aiGeneratedDetails, setAiGeneratedDetails] = useState<AIGeneratedDetail[] | null>(null);
  const [ideasError, setIdeasError] = useState<string | null>(null);

  const colorPopupRef = useRef<HTMLDivElement>(null);
  const colorButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const availableStyles = selectedModel === 'rd-fast' ? RD_FAST_STYLES : RD_PLUS_STYLES;

  // Sync prompt with current frame's aiPrompt when frame changes or project loads
  useEffect(() => {
    if (sprite && sprite.frames[currentFrameIndex]) {
      const currentFrame = sprite.frames[currentFrameIndex];
      // Load the frame's AI prompt if it exists, otherwise clear for a fresh start
      setPrompt(currentFrame.aiPrompt || '');
      // Clear AI-generated suggestions when switching frames
      setAiGeneratedIdeas(null);
      setAiGeneratedDetails(null);
    }
  }, [sprite?.id, currentFrameIndex]); // Re-run when sprite is loaded or frame changes

  // Handle click outside to close color popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        expandedColorFamily &&
        colorPopupRef.current &&
        !colorPopupRef.current.contains(event.target as Node) &&
        !Array.from(colorButtonRefs.current.values()).some(btn => btn?.contains(event.target as Node))
      ) {
        setExpandedColorFamily(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedColorFamily) {
        setExpandedColorFamily(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [expandedColorFamily]);

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
      // Determine target frame index before any dispatches
      let targetFrameIndex = state.currentFrameIndex;

      // Create sprite if none exists or size changed
      if (!sprite || sprite.width !== selectedSize) {
        createSprite(selectedSize, selectedSize, prompt.substring(0, 20));
        targetFrameIndex = 0; // New sprite starts at frame 0
      } else if (!isCurrentFrameBlank()) {
        // If current frame has content, add a new frame to avoid overwriting
        dispatch({ type: 'ADD_FRAME' });
        targetFrameIndex = sprite.frames.length; // The new frame index
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
        // Clear current layer first (in case there's any residual data)
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

        // Store the AI prompt with this frame
        dispatch({
          type: 'SET_FRAME_AI_PROMPT',
          index: targetFrameIndex,
          prompt: prompt,
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

  // Toggle color family expansion
  const handleColorFamilyClick = (familyName: string) => {
    setExpandedColorFamily(prev => (prev === familyName ? null : familyName));
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
    // Close the popup after selecting a color
    setExpandedColorFamily(null);
  };

  // Get expanded family data
  const expandedFamily = expandedColorFamily
    ? COLOR_FAMILIES.find(f => f.name === expandedColorFamily)
    : null;

  // Filter out color variations that are already in the prompt
  const getAvailableVariations = (family: ColorFamily) => {
    const lowerPrompt = prompt.toLowerCase();
    return family.variations.filter(
      v => !lowerPrompt.includes(v.text.toLowerCase().split(' ')[0])
    );
  };

  // Generate new ideas and details using Groq AI
  const handleGenerateNewIdeas = async () => {
    if (!groqService.isConfigured()) {
      setIdeasError('Groq API key not configured. Add VITE_GROQ_API_KEY to your .env file.');
      return;
    }

    setIsGeneratingIdeas(true);
    setIdeasError(null);

    try {
      const { ideas, details } = await groqService.generateIdeasAndDetails(selectedStyle);
      setAiGeneratedIdeas(ideas);
      setAiGeneratedDetails(details);
    } catch (err) {
      console.error('Failed to generate ideas:', err);
      setIdeasError(err instanceof Error ? err.message : 'Failed to generate ideas');
    } finally {
      setIsGeneratingIdeas(false);
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
      <div className="border border-editor-accent/40 rounded">
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
            {/* Generate New Ideas Button */}
            <button
              onClick={handleGenerateNewIdeas}
              disabled={isGenerating || isGeneratingIdeas}
              className={`w-full py-1.5 px-3 rounded text-[11px] font-medium transition-all flex items-center justify-center gap-2 ${
                isGeneratingIdeas
                  ? 'bg-editor-accent/50 text-gray-400 cursor-wait'
                  : 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 text-white'
              }`}
            >
              {isGeneratingIdeas ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Generating ideas...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Generate New Ideas
                </>
              )}
            </button>

            {/* Ideas Error */}
            {ideasError && (
              <div className="text-[10px] text-red-400 bg-red-900/20 px-2 py-1 rounded">
                {ideasError}
              </div>
            )}

            {/* Quick Ideas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Quick Ideas
                </label>
                {aiGeneratedIdeas && (
                  <span className="text-[9px] text-purple-400 flex items-center gap-1">
                    <span>✨</span> AI Generated
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {(aiGeneratedIdeas || SPRITE_SUGGESTIONS.slice(0, 6)).map((suggestion, idx) => (
                  <button
                    key={`${suggestion}-${idx}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`text-[11px] px-2 py-1 rounded transition-colors ${
                      aiGeneratedIdeas
                        ? 'bg-purple-600/30 hover:bg-purple-500/50 border border-purple-500/30'
                        : 'bg-editor-accent/40 hover:bg-editor-highlight/50'
                    }`}
                    disabled={isGenerating || isGeneratingIdeas}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Details - AI Generated or Context-Aware */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Add Details
                </label>
                {aiGeneratedDetails && (
                  <span className="text-[9px] text-purple-400 flex items-center gap-1">
                    <span>✨</span> AI Generated
                  </span>
                )}
              </div>
              {aiGeneratedDetails ? (
                <div className="flex flex-wrap gap-1">
                  {aiGeneratedDetails.map((detail, idx) => (
                    <button
                      key={`${detail.label}-${idx}`}
                      onClick={() => handleModifierClick(detail.text)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 bg-purple-600/30 border border-purple-500/30 rounded hover:bg-purple-500/50 transition-colors"
                      disabled={isGenerating || isGeneratingIdeas}
                      title={`Add "${detail.text}"`}
                    >
                      <span>{detail.label}</span>
                    </button>
                  ))}
                </div>
              ) : contextModifiers.length > 0 ? (
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
              ) : prompt.trim() ? (
                <div className="text-[10px] text-gray-500 italic">
                  All detail suggestions added
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {GENERAL_MODIFIERS.map((mod, idx) => (
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

            {/* Color Palette with Expandable Families */}
            <div className="relative">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                Add Color <span className="text-gray-600">(click to expand)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_FAMILIES.map(family => {
                  const isExpanded = expandedColorFamily === family.name;
                  const availableCount = getAvailableVariations(family).length;
                  return (
                    <button
                      key={family.name}
                      ref={el => {
                        if (el) colorButtonRefs.current.set(family.name, el);
                      }}
                      onClick={() => handleColorFamilyClick(family.name)}
                      className={`group relative w-7 h-7 rounded-md border-2 transition-all duration-200 ${
                        isExpanded
                          ? 'border-white scale-110 ring-2 ring-editor-highlight/50'
                          : 'border-editor-accent/50 hover:border-white/50 hover:scale-105'
                      } ${availableCount === 0 ? 'opacity-40' : ''}`}
                      style={{ backgroundColor: family.baseColor }}
                      disabled={isGenerating || availableCount === 0}
                      title={`${family.name} colors (${availableCount} available)`}
                    >
                      {/* Expansion indicator */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-editor-panel rounded-full flex items-center justify-center text-[8px] transition-opacity ${
                          isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
                        }`}
                      >
                        {isExpanded ? '−' : '+'}
                      </span>
                      {/* Color name tooltip */}
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                        {family.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Expanded Color Variations Popup */}
              {expandedFamily && (
                <div
                  ref={colorPopupRef}
                  className="absolute left-0 right-0 mt-3 p-2 bg-editor-panel border border-editor-accent/60 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {/* Arrow pointer */}
                  <div
                    className="absolute -top-2 w-3 h-3 bg-editor-panel border-l border-t border-editor-accent/60 rotate-45"
                    style={{
                      left: `${(COLOR_FAMILIES.findIndex(f => f.name === expandedColorFamily) * 34) + 14}px`,
                    }}
                  />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-gray-300 capitalize flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: expandedFamily.baseColor }}
                      />
                      {expandedFamily.name} Shades
                    </span>
                    <button
                      onClick={() => setExpandedColorFamily(null)}
                      className="text-gray-500 hover:text-white text-xs p-0.5 hover:bg-editor-accent/50 rounded transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Color Variations Grid */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {getAvailableVariations(expandedFamily).map(variation => (
                      <button
                        key={variation.name}
                        onClick={() => handleColorClick(variation.text)}
                        className="group flex flex-col items-center gap-0.5 p-1.5 rounded-md hover:bg-editor-accent/40 transition-colors"
                        disabled={isGenerating}
                        title={`Add "${variation.text}" to prompt`}
                      >
                        <span
                          className="w-6 h-6 rounded-md border border-white/20 group-hover:border-white/50 group-hover:scale-110 transition-all shadow-sm"
                          style={{ backgroundColor: variation.color }}
                        />
                        <span className="text-[9px] text-gray-400 group-hover:text-gray-200 text-center leading-tight truncate w-full">
                          {variation.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Hint */}
                  <div className="mt-2 pt-1.5 border-t border-editor-accent/30 text-[9px] text-gray-500 text-center">
                    Click a shade or press Esc to close
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
      <div className={`generate-btn-wrapper ${isGenerating ? 'is-generating' : ''}`}>
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
      </div>

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
