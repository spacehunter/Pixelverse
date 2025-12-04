import { useState, useCallback, useEffect } from 'react';
import { useEditor } from '../store/EditorContext';
import type { Sprite, Color } from '../types';

type ExportFormat = 'png' | 'spritesheet' | 'gif';

// Convert sprite to JSON-serializable format (Maps to arrays)
function spriteToJSON(sprite: Sprite): object {
  return {
    ...sprite,
    frames: sprite.frames.map(frame => ({
      ...frame,
      layers: frame.layers.map(layer => ({
        ...layer,
        pixels: Array.from(layer.pixels.entries()),
      })),
    })),
  };
}

// Convert JSON back to sprite (arrays to Maps)
function jsonToSprite(json: ReturnType<typeof spriteToJSON>): Sprite {
  const data = json as {
    id: string;
    name: string;
    width: number;
    height: number;
    frames: Array<{
      id: string;
      duration: number;
      aiPrompt?: string; // AI generation prompt used to create this frame
      layers: Array<{
        id: string;
        name: string;
        visible: boolean;
        locked: boolean;
        opacity: number;
        pixels: Array<[string, Color]>;
      }>;
    }>;
    createdAt: string;
    updatedAt: string;
  };

  return {
    ...data,
    width: data.width as Sprite['width'],
    height: data.height as Sprite['height'],
    frames: data.frames.map(frame => ({
      ...frame,
      layers: frame.layers.map(layer => ({
        ...layer,
        pixels: new Map(layer.pixels),
      })),
    })),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

export function ExportPanel() {
  const { state, dispatch } = useEditor();
  const { sprite } = state;

  const [fileName, setFileName] = useState('');
  const [exportScale, setExportScale] = useState(1);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [includeTransparency, setIncludeTransparency] = useState(true);
  const [spritesheetColumns, setSpritesheetColumns] = useState(4);

  // Update filename when sprite name changes
  useEffect(() => {
    if (sprite?.name) {
      setFileName(sprite.name);
    }
  }, [sprite?.name]);

  // Render sprite to canvas
  const renderSpriteToCanvas = useCallback(
    (frameIndex: number, scale: number): HTMLCanvasElement | null => {
      if (!sprite) return null;

      const canvas = document.createElement('canvas');
      canvas.width = sprite.width * scale;
      canvas.height = sprite.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Clear with transparency or white
      if (!includeTransparency) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw all visible layers
      const frame = sprite.frames[frameIndex];
      for (const layer of frame.layers) {
        if (!layer.visible) continue;

        const opacity = layer.opacity / 100;

        layer.pixels.forEach((color, key) => {
          const [x, y] = key.split(',').map(Number);
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a / 255) * opacity})`;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        });
      }

      return canvas;
    },
    [sprite, includeTransparency]
  );

  // Export single frame as PNG
  const exportPNG = useCallback(() => {
    const canvas = renderSpriteToCanvas(state.currentFrameIndex, exportScale);
    if (!canvas) return;

    const name = fileName.trim() || 'sprite';
    const link = document.createElement('a');
    link.download = `${name}_frame${state.currentFrameIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [renderSpriteToCanvas, exportScale, fileName, state.currentFrameIndex]);

  // Export all frames as sprite sheet
  const exportSpriteSheet = useCallback(() => {
    if (!sprite) return;

    const frameCount = sprite.frames.length;
    const cols = Math.min(spritesheetColumns, frameCount);
    const rows = Math.ceil(frameCount / cols);

    const canvas = document.createElement('canvas');
    canvas.width = sprite.width * exportScale * cols;
    canvas.height = sprite.height * exportScale * rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with transparency or white
    if (!includeTransparency) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw each frame
    for (let i = 0; i < frameCount; i++) {
      const frameCanvas = renderSpriteToCanvas(i, exportScale);
      if (frameCanvas) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.drawImage(
          frameCanvas,
          col * sprite.width * exportScale,
          row * sprite.height * exportScale
        );
      }
    }

    const name = fileName.trim() || 'spritesheet';
    const link = document.createElement('a');
    link.download = `${name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [sprite, renderSpriteToCanvas, exportScale, spritesheetColumns, includeTransparency, fileName]);

  // Export as animated GIF (simplified version)
  const exportGIF = useCallback(async () => {
    if (!sprite || sprite.frames.length < 2) {
      alert('Need at least 2 frames for GIF export');
      return;
    }

    // For now, export as sprite sheet and inform user
    // Full GIF encoding would require a library like gif.js
    alert(
      'GIF export is coming soon! For now, use the sprite sheet export and convert it to GIF using an online tool.'
    );
    exportSpriteSheet();
  }, [sprite, exportSpriteSheet]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    const canvas = renderSpriteToCanvas(state.currentFrameIndex, exportScale);
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      alert('Sprite copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard. Try the download option instead.');
    }
  }, [renderSpriteToCanvas, state.currentFrameIndex, exportScale]);

  // Get data URL for preview
  const getPreviewDataUrl = useCallback((): string => {
    const canvas = renderSpriteToCanvas(state.currentFrameIndex, Math.min(4, exportScale));
    return canvas?.toDataURL('image/png') || '';
  }, [renderSpriteToCanvas, state.currentFrameIndex, exportScale]);

  // Save project as JSON file using native file picker when available
  const saveProject = useCallback(async () => {
    if (!sprite) return;

    const name = fileName.trim() || sprite.name || 'project';
    const data = spriteToJSON(sprite);
    const jsonString = JSON.stringify(data, null, 2);
    const saveFileName = `${name}.pixelverse`;

    // Try to use the File System Access API (native save dialog)
    if ('showSaveFilePicker' in window) {
      try {
        const options = {
          suggestedName: saveFileName,
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

        // Update filename from saved file
        const savedName = fileHandle.name.replace(/\.pixelverse$/, '');
        setFileName(savedName);
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
    link.download = saveFileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [sprite, fileName]);

  // Load project from JSON file
  const loadProject = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pixelverse,.json';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const loadedSprite = jsonToSprite(json);
          dispatch({ type: 'LOAD_SPRITE', sprite: loadedSprite });
          setFileName(loadedSprite.name);
        } catch (err) {
          console.error('Failed to load project:', err);
          alert('Failed to load project. Make sure it\'s a valid .pixelverse file.');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }, [dispatch]);

  // Keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (sprite) {
          saveProject();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sprite, saveProject]);

  if (!sprite) {
    return (
      <div className="panel p-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Export
        </h3>
        <p className="text-xs text-gray-500">No sprite to export</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Save & Export
      </h3>

      {/* Filename */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Filename</label>
        <input
          type="text"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          placeholder="Enter filename..."
          className="w-full bg-editor-accent/50 text-white text-sm p-2 rounded focus:outline-none focus:ring-1 focus:ring-editor-highlight"
        />
      </div>

      {/* Save/Load Project */}
      <div className="flex gap-2">
        <button onClick={() => saveProject()} className="flex-1 btn-primary text-xs py-2">
          Save Project
        </button>
        <button onClick={loadProject} className="flex-1 btn-secondary text-xs py-2">
          Load Project
        </button>
      </div>
      <div className="text-xs text-gray-500 -mt-1">
        Saves all {sprite.frames.length} frame{sprite.frames.length !== 1 ? 's' : ''} & layers • Cmd/Ctrl+S
      </div>

      <div className="border-t border-editor-accent/30 pt-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Export Image
        </h4>
      </div>

      {/* Preview */}
      <div className="bg-editor-bg rounded p-2 flex items-center justify-center">
        <img
          src={getPreviewDataUrl()}
          alt="Preview"
          className="max-w-full max-h-20"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Format Selection */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Format</label>
        <div className="flex gap-1">
          {(['png', 'spritesheet', 'gif'] as ExportFormat[]).map(format => (
            <button
              key={format}
              onClick={() => setExportFormat(format)}
              className={`flex-1 text-xs py-1 rounded capitalize transition-colors ${
                exportFormat === format
                  ? 'bg-editor-highlight text-white'
                  : 'bg-editor-accent/30 hover:bg-editor-accent/50'
              }`}
            >
              {format === 'spritesheet' ? 'Sheet' : format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">
          Scale: {exportScale}x ({sprite.width * exportScale}x{sprite.height * exportScale}px)
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={exportScale}
          onChange={e => setExportScale(parseInt(e.target.value))}
          className="w-full accent-editor-highlight"
        />
      </div>

      {/* Spritesheet columns */}
      {exportFormat === 'spritesheet' && (
        <div>
          <label className="text-xs text-gray-400 block mb-1">
            Columns: {spritesheetColumns}
          </label>
          <input
            type="range"
            min="1"
            max={sprite.frames.length}
            value={spritesheetColumns}
            onChange={e => setSpritesheetColumns(parseInt(e.target.value))}
            className="w-full accent-editor-highlight"
          />
        </div>
      )}

      {/* Transparency */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="transparency"
          checked={includeTransparency}
          onChange={e => setIncludeTransparency(e.target.checked)}
          className="accent-editor-highlight"
        />
        <label htmlFor="transparency" className="text-xs text-gray-400">
          Transparent background
        </label>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            if (exportFormat === 'png') exportPNG();
            else if (exportFormat === 'spritesheet') exportSpriteSheet();
            else exportGIF();
          }}
          className="btn-primary w-full"
        >
          Download {exportFormat === 'spritesheet' ? 'Sprite Sheet' : exportFormat.toUpperCase()}
        </button>

        <button onClick={copyToClipboard} className="btn-secondary w-full">
          Copy to Clipboard
        </button>
      </div>

      {/* Export Info */}
      <div className="text-xs text-gray-500 border-t border-editor-accent/30 pt-3">
        <p className="font-medium text-gray-400 mb-1">
          {exportFormat === 'png' && `Exports frame ${state.currentFrameIndex + 1} only`}
          {exportFormat === 'spritesheet' &&
            `Exports ALL ${sprite.frames.length} frames in ${spritesheetColumns}x${Math.ceil(
              sprite.frames.length / spritesheetColumns
            )} grid`}
          {exportFormat === 'gif' && `Exports ALL ${sprite.frames.length} frames as animation`}
        </p>
        <p className="text-gray-600">
          {exportFormat === 'png' && 'Use spritesheet to export all frames'}
          {exportFormat === 'spritesheet' && 'Good for game engines'}
          {exportFormat === 'gif' && 'Coming soon - uses spritesheet for now'}
        </p>
      </div>
    </div>
  );
}
