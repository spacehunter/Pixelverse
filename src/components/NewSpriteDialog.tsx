import { useState } from 'react';
import type { CanvasSize } from '../types';

interface NewSpriteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (width: CanvasSize, height: CanvasSize, name: string) => void;
}

const PRESET_SIZES: { name: string; width: CanvasSize; height: CanvasSize }[] = [
  { name: '8x8 (Icons)', width: 8, height: 8 },
  { name: '16x16 (Characters)', width: 16, height: 16 },
  { name: '32x32 (Detailed)', width: 32, height: 32 },
  { name: '64x64 (Large)', width: 64, height: 64 },
];

export function NewSpriteDialog({ isOpen, onClose, onCreate }: NewSpriteDialogProps) {
  const [name, setName] = useState('New Sprite');
  const [selectedPreset, setSelectedPreset] = useState(1); // Default to 16x16

  if (!isOpen) return null;

  const handleCreate = () => {
    const preset = PRESET_SIZES[selectedPreset];
    onCreate(preset.width, preset.height, name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-editor-panel rounded-lg p-6 w-96 max-w-full mx-4 shadow-2xl border border-editor-accent/30">
        <h2 className="text-xl font-bold text-white mb-4">New Sprite</h2>

        {/* Name Input */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-editor-accent/50 text-white p-2 rounded"
            autoFocus
          />
        </div>

        {/* Size Presets */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-2">Size</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_SIZES.map((preset, index) => (
              <button
                key={preset.name}
                onClick={() => setSelectedPreset(index)}
                className={`p-3 rounded text-left transition-all ${
                  selectedPreset === index
                    ? 'bg-editor-highlight text-white ring-2 ring-editor-highlight'
                    : 'bg-editor-accent/30 hover:bg-editor-accent/50'
                }`}
              >
                <div className="font-medium text-sm">{preset.name}</div>
                <div className="text-xs text-gray-400">
                  {preset.width}x{preset.height} pixels
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-4 p-4 bg-editor-bg rounded flex items-center justify-center">
          <div
            className="border border-editor-accent/50"
            style={{
              width: PRESET_SIZES[selectedPreset].width * 3,
              height: PRESET_SIZES[selectedPreset].height * 3,
              background:
                'repeating-conic-gradient(#2a2a3e 0% 25%, #3a3a4e 0% 50%) 50% / 10px 10px',
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleCreate} className="btn-primary flex-1">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
