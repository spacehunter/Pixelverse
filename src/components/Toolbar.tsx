import { useEffect } from 'react';
import { useEditor } from '../store/EditorContext';
import type { Tool } from '../types';

const tools: { id: Tool; name: string; icon: string; shortcut: string }[] = [
  { id: 'pencil', name: 'Pencil', icon: '✏️', shortcut: 'P' },
  { id: 'eraser', name: 'Eraser', icon: '🧹', shortcut: 'E' },
  { id: 'fill', name: 'Fill', icon: '🪣', shortcut: 'F' },
  { id: 'eyedropper', name: 'Eyedropper', icon: '💧', shortcut: 'I' },
  { id: 'line', name: 'Line', icon: '📏', shortcut: 'L' },
  { id: 'rectangle', name: 'Rectangle', icon: '⬜', shortcut: 'R' },
  { id: 'circle', name: 'Circle', icon: '⭕', shortcut: 'C' },
];

export function Toolbar() {
  const { state, setTool, dispatch, undo, redo, toggleGrid } = useEditor();
  const { currentTool, brushSize, showGrid, zoom } = state;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Tool shortcuts
      const tool = tools.find(t => t.shortcut.toLowerCase() === key);
      if (tool) {
        setTool(tool.id);
        return;
      }

      // Other shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (key) {
          case 'z':
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            e.preventDefault();
            break;
          case 'y':
            redo();
            e.preventDefault();
            break;
          case 'g':
            toggleGrid();
            e.preventDefault();
            break;
        }
      }

      // Brush size shortcuts
      if (key === '[') {
        dispatch({ type: 'SET_BRUSH_SIZE', size: brushSize - 1 });
      } else if (key === ']') {
        dispatch({ type: 'SET_BRUSH_SIZE', size: brushSize + 1 });
      }

      // Zoom shortcuts
      if (key === '-' || key === '_') {
        dispatch({ type: 'SET_ZOOM', zoom: zoom - 2 });
      } else if (key === '=' || key === '+') {
        dispatch({ type: 'SET_ZOOM', zoom: zoom + 2 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, undo, redo, toggleGrid, dispatch, brushSize, zoom]);

  return (
    <div className="panel p-3 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Tools</h3>

      <div className="grid grid-cols-2 gap-1">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setTool(tool.id)}
            className={`tool-btn flex flex-col items-center gap-1 ${
              currentTool === tool.id ? 'active' : ''
            }`}
            title={`${tool.name} (${tool.shortcut})`}
          >
            <span className="text-lg">{tool.icon}</span>
            <span className="text-xs">{tool.name}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-editor-accent/30 pt-3">
        <label className="text-xs text-gray-400 block mb-2">
          Brush Size: {brushSize}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={brushSize}
          onChange={e => dispatch({ type: 'SET_BRUSH_SIZE', size: parseInt(e.target.value) })}
          className="w-full accent-editor-highlight"
        />
      </div>

      <div className="border-t border-editor-accent/30 pt-3">
        <label className="text-xs text-gray-400 block mb-2">Zoom: {zoom}x</label>
        <input
          type="range"
          min="4"
          max="40"
          value={zoom}
          onChange={e => dispatch({ type: 'SET_ZOOM', zoom: parseInt(e.target.value) })}
          className="w-full accent-editor-highlight"
        />
      </div>

      <div className="border-t border-editor-accent/30 pt-3 flex flex-col gap-2">
        <button
          onClick={toggleGrid}
          className={`btn-secondary text-xs ${showGrid ? 'bg-editor-highlight' : ''}`}
        >
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>

        <div className="flex gap-1">
          <button
            onClick={undo}
            className="btn-secondary text-xs flex-1"
            title="Undo (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            onClick={redo}
            className="btn-secondary text-xs flex-1"
            title="Redo (Ctrl+Y)"
          >
            ↪ Redo
          </button>
        </div>

        <button
          onClick={() => dispatch({ type: 'CLEAR_CANVAS' })}
          className="btn-secondary text-xs bg-red-900/50 hover:bg-red-800/50"
        >
          Clear Layer
        </button>
      </div>
    </div>
  );
}
