import { useState, useRef } from 'react';
import { useEditor } from '../store/EditorContext';
import { NewSpriteDialog } from './NewSpriteDialog';
import type { CanvasSize, Sprite } from '../types';

export function Header() {
  const { state, createSprite, dispatch, undo, redo } = useEditor();
  const { sprite } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showNewDialog, setShowNewDialog] = useState(!sprite);

  const handleNew = () => {
    setShowNewDialog(true);
  };

  const handleCreate = (width: CanvasSize, height: CanvasSize, name: string) => {
    createSprite(width, height, name);
    setShowNewDialog(false);
  };

  // Save sprite to JSON using native file picker when available
  const handleSave = async () => {
    if (!sprite) return;

    // Convert Maps to arrays for JSON serialization
    const spriteData = {
      ...sprite,
      frames: sprite.frames.map(frame => ({
        ...frame,
        layers: frame.layers.map(layer => ({
          ...layer,
          pixels: Array.from(layer.pixels.entries()),
        })),
      })),
    };

    const jsonString = JSON.stringify(spriteData, null, 2);
    const fileName = `${sprite.name || 'sprite'}.pixelverse`;

    // Try to use the File System Access API (native save dialog)
    if ('showSaveFilePicker' in window) {
      try {
        const options = {
          suggestedName: fileName,
          types: [{
            description: 'Pixelverse Project',
            accept: { 'application/json': ['.pixelverse'] },
          }],
        };

        const showSaveFilePicker = (window as any).showSaveFilePicker;
        const fileHandle = await showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();

        // Write the JSON string directly
        await writable.write(jsonString);
        await writable.close();
        return;
      } catch (err: any) {
        // User cancelled - just return
        if (err.name === 'AbortError') return;
        // Other error - fall through to download
        console.error('Save picker failed:', err);
      }
    }

    // Fallback: Use traditional download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Load sprite from JSON
  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target?.result as string);

        // Convert pixels back to Maps (handle both array and object formats)
        const sprite: Sprite = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          frames: data.frames.map((frame: any) => ({
            ...frame,
            layers: frame.layers.map((layer: any) => ({
              ...layer,
              // Handle both array format [[key, value], ...] and object format {key: value}
              pixels: Array.isArray(layer.pixels)
                ? new Map(layer.pixels)
                : new Map(Object.entries(layer.pixels)),
            })),
          })),
        };

        dispatch({ type: 'LOAD_SPRITE', sprite });
      } catch (err) {
        console.error('Failed to load sprite:', err);
        alert('Failed to load sprite file. Make sure it\'s a valid Pixelverse file.');
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  return (
    <>
      <header className="bg-editor-panel border-b border-editor-accent/30 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-editor-highlight to-purple-400 bg-clip-text text-transparent">
                Pixelverse
              </h1>
            </div>
            <span className="text-xs text-gray-500 hidden sm:inline">
              AI-Powered Sprite Editor
            </span>
          </div>

          {/* File Actions */}
          <div className="flex items-center gap-2">
            <button onClick={handleNew} className="btn-secondary text-sm">
              New
            </button>
            <button onClick={handleSave} className="btn-secondary text-sm" disabled={!sprite}>
              Save
            </button>
            <button onClick={handleLoad} className="btn-secondary text-sm">
              Load
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pixelverse,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Sprite Info */}
          {sprite && (
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-400">
              <span>{sprite.name}</span>
              <span>
                {sprite.width}x{sprite.height}
              </span>
              <span>{sprite.frames.length} frames</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              className="p-2 hover:bg-editor-accent/30 rounded"
              title="Undo (Ctrl+Z)"
            >
              ↩
            </button>
            <button
              onClick={redo}
              className="p-2 hover:bg-editor-accent/30 rounded"
              title="Redo (Ctrl+Y)"
            >
              ↪
            </button>
          </div>
        </div>
      </header>

      <NewSpriteDialog
        isOpen={showNewDialog}
        onClose={() => {
          if (sprite) setShowNewDialog(false);
        }}
        onCreate={handleCreate}
      />
    </>
  );
}
