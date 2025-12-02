import { useState, useCallback } from 'react';
import { useEditor } from '../store/EditorContext';

type ExportFormat = 'png' | 'spritesheet' | 'gif';

export function ExportPanel() {
  const { state } = useEditor();
  const { sprite } = state;

  const [exportScale, setExportScale] = useState(1);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [includeTransparency, setIncludeTransparency] = useState(true);
  const [spritesheetColumns, setSpritesheetColumns] = useState(4);

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

    const link = document.createElement('a');
    link.download = `${sprite?.name || 'sprite'}_frame${state.currentFrameIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [renderSpriteToCanvas, exportScale, sprite, state.currentFrameIndex]);

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

    const link = document.createElement('a');
    link.download = `${sprite.name || 'spritesheet'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [sprite, renderSpriteToCanvas, exportScale, spritesheetColumns, includeTransparency]);

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
    <div className="panel p-3 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Export
      </h3>

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
        <p>
          {exportFormat === 'png' && `Exporting frame ${state.currentFrameIndex + 1}`}
          {exportFormat === 'spritesheet' &&
            `${sprite.frames.length} frames in ${spritesheetColumns}x${Math.ceil(
              sprite.frames.length / spritesheetColumns
            )} grid`}
          {exportFormat === 'gif' && `Animated GIF with ${sprite.frames.length} frames`}
        </p>
      </div>
    </div>
  );
}
