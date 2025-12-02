import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Sprite, Frame, Layer, Color, Tool, CanvasSize } from '../types';
import { createPixelKey } from '../types';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Create an empty layer
function createEmptyLayer(name: string = 'Layer 1'): Layer {
  return {
    id: generateId(),
    name,
    visible: true,
    locked: false,
    opacity: 100,
    pixels: new Map(),
  };
}

// Create an empty frame
function createEmptyFrame(): Frame {
  return {
    id: generateId(),
    layers: [createEmptyLayer()],
    duration: 100,
  };
}

// Create a new sprite
function createNewSprite(width: CanvasSize, height: CanvasSize, name: string = 'Untitled'): Sprite {
  return {
    id: generateId(),
    name,
    width,
    height,
    frames: [createEmptyFrame()],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

interface EditorState {
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
  history: HistoryEntry[];
  historyIndex: number;
}

interface HistoryEntry {
  sprite: Sprite;
  timestamp: number;
}

type EditorAction =
  | { type: 'CREATE_SPRITE'; width: CanvasSize; height: CanvasSize; name?: string }
  | { type: 'SET_PIXEL'; x: number; y: number; color: Color }
  | { type: 'CLEAR_PIXEL'; x: number; y: number }
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SET_PRIMARY_COLOR'; color: Color }
  | { type: 'SET_SECONDARY_COLOR'; color: Color }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_CURRENT_FRAME'; index: number }
  | { type: 'SET_CURRENT_LAYER'; index: number }
  | { type: 'ADD_FRAME' }
  | { type: 'DELETE_FRAME'; index: number }
  | { type: 'DUPLICATE_FRAME'; index: number }
  | { type: 'ADD_LAYER' }
  | { type: 'DELETE_LAYER'; index: number }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; index: number }
  | { type: 'SET_LAYER_OPACITY'; index: number; opacity: number }
  | { type: 'RENAME_LAYER'; index: number; name: string }
  | { type: 'REORDER_LAYERS'; fromIndex: number; toIndex: number }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_FRAME_DURATION'; index: number; duration: number }
  | { type: 'SET_BRUSH_SIZE'; size: number }
  | { type: 'FILL_AREA'; x: number; y: number; color: Color }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_SPRITE'; sprite: Sprite }
  | { type: 'SET_PIXELS_BATCH'; pixels: Array<{ x: number; y: number; color: Color }> };

const initialState: EditorState = {
  sprite: null,
  currentTool: 'pencil',
  primaryColor: { r: 0, g: 0, b: 0, a: 255 },
  secondaryColor: { r: 255, g: 255, b: 255, a: 255 },
  currentFrameIndex: 0,
  currentLayerIndex: 0,
  zoom: 10,
  showGrid: true,
  isPlaying: false,
  brushSize: 1,
  history: [],
  historyIndex: -1,
};

// Deep clone a sprite (handling Maps)
function cloneSprite(sprite: Sprite): Sprite {
  return {
    ...sprite,
    frames: sprite.frames.map(frame => ({
      ...frame,
      layers: frame.layers.map(layer => ({
        ...layer,
        pixels: new Map(layer.pixels),
      })),
    })),
    updatedAt: new Date(),
  };
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'CREATE_SPRITE': {
      const sprite = createNewSprite(action.width, action.height, action.name);
      return {
        ...state,
        sprite,
        currentFrameIndex: 0,
        currentLayerIndex: 0,
        history: [{ sprite: cloneSprite(sprite), timestamp: Date.now() }],
        historyIndex: 0,
      };
    }

    case 'SET_PIXEL': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      const layer = frame.layers[state.currentLayerIndex];

      if (layer.locked) return state;

      const key = createPixelKey(action.x, action.y);
      layer.pixels.set(key, action.color);

      return { ...state, sprite };
    }

    case 'CLEAR_PIXEL': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      const layer = frame.layers[state.currentLayerIndex];

      if (layer.locked) return state;

      const key = createPixelKey(action.x, action.y);
      layer.pixels.delete(key);

      return { ...state, sprite };
    }

    case 'SET_PIXELS_BATCH': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      const layer = frame.layers[state.currentLayerIndex];

      if (layer.locked) return state;

      for (const pixel of action.pixels) {
        const key = createPixelKey(pixel.x, pixel.y);
        if (pixel.color.a === 0) {
          layer.pixels.delete(key);
        } else {
          layer.pixels.set(key, pixel.color);
        }
      }

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ sprite: cloneSprite(sprite), timestamp: Date.now() });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...state,
        sprite,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'SET_TOOL':
      return { ...state, currentTool: action.tool };

    case 'SET_PRIMARY_COLOR':
      return { ...state, primaryColor: action.color };

    case 'SET_SECONDARY_COLOR':
      return { ...state, secondaryColor: action.color };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(1, Math.min(50, action.zoom)) };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'SET_CURRENT_FRAME':
      if (!state.sprite || action.index < 0 || action.index >= state.sprite.frames.length) {
        return state;
      }
      return { ...state, currentFrameIndex: action.index };

    case 'SET_CURRENT_LAYER': {
      if (!state.sprite) return state;
      const frame = state.sprite.frames[state.currentFrameIndex];
      if (action.index < 0 || action.index >= frame.layers.length) return state;
      return { ...state, currentLayerIndex: action.index };
    }

    case 'ADD_FRAME': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      sprite.frames.push(createEmptyFrame());
      return { ...state, sprite };
    }

    case 'DELETE_FRAME': {
      if (!state.sprite || state.sprite.frames.length <= 1) return state;
      const sprite = cloneSprite(state.sprite);
      sprite.frames.splice(action.index, 1);
      const newFrameIndex = Math.min(state.currentFrameIndex, sprite.frames.length - 1);
      return { ...state, sprite, currentFrameIndex: newFrameIndex };
    }

    case 'DUPLICATE_FRAME': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frameToDuplicate = sprite.frames[action.index];
      const newFrame: Frame = {
        id: generateId(),
        duration: frameToDuplicate.duration,
        layers: frameToDuplicate.layers.map(layer => ({
          ...layer,
          id: generateId(),
          pixels: new Map(layer.pixels),
        })),
      };
      sprite.frames.splice(action.index + 1, 0, newFrame);
      return { ...state, sprite, currentFrameIndex: action.index + 1 };
    }

    case 'ADD_LAYER': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      const newLayerIndex = frame.layers.length;
      frame.layers.push(createEmptyLayer(`Layer ${newLayerIndex + 1}`));
      return { ...state, sprite, currentLayerIndex: newLayerIndex };
    }

    case 'DELETE_LAYER': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      if (frame.layers.length <= 1) return state;
      frame.layers.splice(action.index, 1);
      const newLayerIndex = Math.min(state.currentLayerIndex, frame.layers.length - 1);
      return { ...state, sprite, currentLayerIndex: newLayerIndex };
    }

    case 'TOGGLE_LAYER_VISIBILITY': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      frame.layers[action.index].visible = !frame.layers[action.index].visible;
      return { ...state, sprite };
    }

    case 'SET_LAYER_OPACITY': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      frame.layers[action.index].opacity = action.opacity;
      return { ...state, sprite };
    }

    case 'RENAME_LAYER': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      frame.layers[action.index].name = action.name;
      return { ...state, sprite };
    }

    case 'REORDER_LAYERS': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      const [removed] = frame.layers.splice(action.fromIndex, 1);
      frame.layers.splice(action.toIndex, 0, removed);
      return { ...state, sprite };
    }

    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };

    case 'SET_FRAME_DURATION': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      sprite.frames[action.index].duration = action.duration;
      return { ...state, sprite };
    }

    case 'SET_BRUSH_SIZE':
      return { ...state, brushSize: Math.max(1, Math.min(10, action.size)) };

    case 'FILL_AREA': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      const layer = frame.layers[state.currentLayerIndex];

      if (layer.locked) return state;

      // Flood fill algorithm
      const width = state.sprite.width;
      const height = state.sprite.height;
      const targetKey = createPixelKey(action.x, action.y);
      const targetColor = layer.pixels.get(targetKey) || { r: 0, g: 0, b: 0, a: 0 };

      // Don't fill if same color
      if (
        targetColor.r === action.color.r &&
        targetColor.g === action.color.g &&
        targetColor.b === action.color.b &&
        targetColor.a === action.color.a
      ) {
        return state;
      }

      const stack: Array<[number, number]> = [[action.x, action.y]];
      const visited = new Set<string>();

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const key = createPixelKey(x, y);

        if (visited.has(key)) continue;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const currentColor = layer.pixels.get(key) || { r: 0, g: 0, b: 0, a: 0 };

        if (
          currentColor.r !== targetColor.r ||
          currentColor.g !== targetColor.g ||
          currentColor.b !== targetColor.b ||
          currentColor.a !== targetColor.a
        ) {
          continue;
        }

        visited.add(key);
        layer.pixels.set(key, action.color);

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ sprite: cloneSprite(sprite), timestamp: Date.now() });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...state,
        sprite,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'CLEAR_CANVAS': {
      if (!state.sprite) return state;
      const sprite = cloneSprite(state.sprite);
      const frame = sprite.frames[state.currentFrameIndex];
      const layer = frame.layers[state.currentLayerIndex];

      if (layer.locked) return state;

      layer.pixels.clear();

      // Add to history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ sprite: cloneSprite(sprite), timestamp: Date.now() });

      return {
        ...state,
        sprite,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        sprite: cloneSprite(state.history[newIndex].sprite),
        historyIndex: newIndex,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        sprite: cloneSprite(state.history[newIndex].sprite),
        historyIndex: newIndex,
      };
    }

    case 'LOAD_SPRITE': {
      return {
        ...state,
        sprite: action.sprite,
        currentFrameIndex: 0,
        currentLayerIndex: 0,
        history: [{ sprite: cloneSprite(action.sprite), timestamp: Date.now() }],
        historyIndex: 0,
      };
    }

    default:
      return state;
  }
}

interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  createSprite: (width: CanvasSize, height: CanvasSize, name?: string) => void;
  setPixel: (x: number, y: number, color: Color) => void;
  clearPixel: (x: number, y: number) => void;
  setPixelsBatch: (pixels: Array<{ x: number; y: number; color: Color }>) => void;
  setTool: (tool: Tool) => void;
  setPrimaryColor: (color: Color) => void;
  setSecondaryColor: (color: Color) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  fillArea: (x: number, y: number, color: Color) => void;
  undo: () => void;
  redo: () => void;
  getCurrentLayer: () => Layer | null;
  getCurrentFrame: () => Frame | null;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  const createSprite = useCallback((width: CanvasSize, height: CanvasSize, name?: string) => {
    dispatch({ type: 'CREATE_SPRITE', width, height, name });
  }, []);

  const setPixel = useCallback((x: number, y: number, color: Color) => {
    dispatch({ type: 'SET_PIXEL', x, y, color });
  }, []);

  const clearPixel = useCallback((x: number, y: number) => {
    dispatch({ type: 'CLEAR_PIXEL', x, y });
  }, []);

  const setPixelsBatch = useCallback((pixels: Array<{ x: number; y: number; color: Color }>) => {
    dispatch({ type: 'SET_PIXELS_BATCH', pixels });
  }, []);

  const setTool = useCallback((tool: Tool) => {
    dispatch({ type: 'SET_TOOL', tool });
  }, []);

  const setPrimaryColor = useCallback((color: Color) => {
    dispatch({ type: 'SET_PRIMARY_COLOR', color });
  }, []);

  const setSecondaryColor = useCallback((color: Color) => {
    dispatch({ type: 'SET_SECONDARY_COLOR', color });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', zoom });
  }, []);

  const toggleGrid = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID' });
  }, []);

  const fillArea = useCallback((x: number, y: number, color: Color) => {
    dispatch({ type: 'FILL_AREA', x, y, color });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const getCurrentLayer = useCallback((): Layer | null => {
    if (!state.sprite) return null;
    const frame = state.sprite.frames[state.currentFrameIndex];
    return frame?.layers[state.currentLayerIndex] || null;
  }, [state.sprite, state.currentFrameIndex, state.currentLayerIndex]);

  const getCurrentFrame = useCallback((): Frame | null => {
    if (!state.sprite) return null;
    return state.sprite.frames[state.currentFrameIndex] || null;
  }, [state.sprite, state.currentFrameIndex]);

  return (
    <EditorContext.Provider
      value={{
        state,
        dispatch,
        createSprite,
        setPixel,
        clearPixel,
        setPixelsBatch,
        setTool,
        setPrimaryColor,
        setSecondaryColor,
        setZoom,
        toggleGrid,
        fillArea,
        undo,
        redo,
        getCurrentLayer,
        getCurrentFrame,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
