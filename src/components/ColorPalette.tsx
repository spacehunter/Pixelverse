import { useState } from 'react';
import { useEditor } from '../store/EditorContext';
import type { Color, ColorPalette as ColorPaletteType } from '../types';
import { DEFAULT_PALETTES, colorToHex, hexToColor } from '../types';

interface ColorSwatchProps {
  color: Color;
  selected?: boolean;
  onClick: () => void;
  onRightClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

function ColorSwatch({ color, selected, onClick, onRightClick, size = 'md' }: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onRightClick?.();
  };

  return (
    <button
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={`${sizeClasses[size]} rounded border-2 transition-all ${
        selected
          ? 'border-white ring-2 ring-editor-highlight scale-110'
          : 'border-transparent hover:border-gray-500'
      }`}
      style={{ backgroundColor: colorToHex(color) }}
      title={`${colorToHex(color)} (Left: primary, Right: secondary)`}
    />
  );
}

export function ColorPalette() {
  const { state, setPrimaryColor, setSecondaryColor } = useEditor();
  const { primaryColor, secondaryColor } = state;

  const [currentPalette, setCurrentPalette] = useState<ColorPaletteType>(DEFAULT_PALETTES[0]);
  const [customColor, setCustomColor] = useState(colorToHex(primaryColor));

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setCustomColor(hex);
    setPrimaryColor(hexToColor(hex));
  };

  const swapColors = () => {
    const temp = primaryColor;
    setPrimaryColor(secondaryColor);
    setSecondaryColor(temp);
  };

  return (
    <div className="panel p-3 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Colors</h3>

      {/* Current Colors */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <ColorSwatch
            color={primaryColor}
            size="lg"
            onClick={() => {}}
            selected
          />
          <ColorSwatch
            color={secondaryColor}
            size="md"
            onClick={() => {}}
            selected={false}
          />
          <button
            onClick={swapColors}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-editor-accent rounded-full text-xs flex items-center justify-center hover:bg-editor-highlight transition-colors"
            title="Swap colors (X)"
          >
            ⇄
          </button>
        </div>

        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Custom Color</label>
          <input
            type="color"
            value={customColor}
            onChange={handleColorInput}
            className="w-full h-8 rounded cursor-pointer bg-transparent"
          />
        </div>
      </div>

      {/* Palette Selector */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Palette</label>
        <select
          value={currentPalette.id}
          onChange={e => {
            const palette = DEFAULT_PALETTES.find(p => p.id === e.target.value);
            if (palette) setCurrentPalette(palette);
          }}
          className="w-full bg-editor-accent text-white text-sm p-2 rounded"
        >
          {DEFAULT_PALETTES.map(palette => (
            <option key={palette.id} value={palette.id}>
              {palette.name}
            </option>
          ))}
        </select>
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-8 gap-1">
        {currentPalette.colors.map((color, index) => (
          <ColorSwatch
            key={index}
            color={color}
            size="sm"
            selected={colorToHex(color) === colorToHex(primaryColor)}
            onClick={() => setPrimaryColor(color)}
            onRightClick={() => setSecondaryColor(color)}
          />
        ))}
      </div>

      {/* Quick Colors */}
      <div className="border-t border-editor-accent/30 pt-3">
        <label className="text-xs text-gray-400 block mb-2">Quick Colors</label>
        <div className="flex flex-wrap gap-1">
          {[
            { r: 0, g: 0, b: 0, a: 255 },
            { r: 255, g: 255, b: 255, a: 255 },
            { r: 255, g: 0, b: 0, a: 255 },
            { r: 0, g: 255, b: 0, a: 255 },
            { r: 0, g: 0, b: 255, a: 255 },
            { r: 255, g: 255, b: 0, a: 255 },
            { r: 255, g: 0, b: 255, a: 255 },
            { r: 0, g: 255, b: 255, a: 255 },
            { r: 128, g: 128, b: 128, a: 255 },
            { r: 128, g: 0, b: 0, a: 255 },
            { r: 0, g: 128, b: 0, a: 255 },
            { r: 0, g: 0, b: 128, a: 255 },
            { r: 255, g: 165, b: 0, a: 255 },
            { r: 139, g: 69, b: 19, a: 255 },
            { r: 255, g: 192, b: 203, a: 255 },
            { r: 128, g: 0, b: 128, a: 255 },
          ].map((color, index) => (
            <ColorSwatch
              key={index}
              color={color}
              size="sm"
              onClick={() => setPrimaryColor(color)}
              onRightClick={() => setSecondaryColor(color)}
            />
          ))}
        </div>
      </div>

      {/* Color Info */}
      <div className="border-t border-editor-accent/30 pt-3 text-xs text-gray-400">
        <div>Primary: {colorToHex(primaryColor)}</div>
        <div>Secondary: {colorToHex(secondaryColor)}</div>
      </div>
    </div>
  );
}
