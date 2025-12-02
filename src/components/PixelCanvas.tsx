import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditor } from '../store/EditorContext';
import type { Color } from '../types';
import { createPixelKey, colorToRgba } from '../types';

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    state,
    setPixelsBatch,
    fillArea,
    setPrimaryColor,
    getCurrentLayer,
    getCurrentFrame,
  } = useEditor();

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [pendingPixels, setPendingPixels] = useState<Array<{ x: number; y: number; color: Color }>>([]);

  const { sprite, zoom, showGrid, currentTool, primaryColor, secondaryColor, brushSize } = state;

  // Render the canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !sprite) return;

    const pixelSize = zoom;
    const width = sprite.width * pixelSize;
    const height = sprite.height * pixelSize;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas with transparent background pattern
    ctx.clearRect(0, 0, width, height);

    // Draw checkerboard background for transparency
    const checkSize = pixelSize / 2;
    for (let y = 0; y < sprite.height * 2; y++) {
      for (let x = 0; x < sprite.width * 2; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2a3e' : '#3a3a4e';
        ctx.fillRect(x * checkSize, y * checkSize, checkSize, checkSize);
      }
    }

    // Get current frame
    const frame = getCurrentFrame();
    if (!frame) return;

    // Draw all visible layers (from bottom to top)
    for (const layer of frame.layers) {
      if (!layer.visible) continue;

      const opacity = layer.opacity / 100;

      layer.pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a / 255) * opacity})`;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      });
    }

    // Draw grid
    if (showGrid && pixelSize >= 4) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= sprite.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize + 0.5, 0);
        ctx.lineTo(x * pixelSize + 0.5, height);
        ctx.stroke();
      }

      for (let y = 0; y <= sprite.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize + 0.5);
        ctx.lineTo(width, y * pixelSize + 0.5);
        ctx.stroke();
      }
    }
  }, [sprite, zoom, showGrid, getCurrentFrame]);

  // Re-render when state changes
  useEffect(() => {
    render();
  }, [render, state]);

  // Get pixel coordinates from mouse event
  const getPixelCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas || !sprite) return null;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / zoom);
      const y = Math.floor((e.clientY - rect.top) / zoom);

      if (x < 0 || x >= sprite.width || y < 0 || y >= sprite.height) {
        return null;
      }

      return { x, y };
    },
    [sprite, zoom]
  );

  // Draw pixels in a line using Bresenham's algorithm
  const drawLine = useCallback(
    (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      color: Color,
      pixels: Array<{ x: number; y: number; color: Color }>
    ) => {
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        // Draw with brush size
        for (let bx = 0; bx < brushSize; bx++) {
          for (let by = 0; by < brushSize; by++) {
            const px = x0 + bx - Math.floor(brushSize / 2);
            const py = y0 + by - Math.floor(brushSize / 2);
            if (sprite && px >= 0 && px < sprite.width && py >= 0 && py < sprite.height) {
              pixels.push({ x: px, y: py, color });
            }
          }
        }

        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
      }
    },
    [sprite, brushSize]
  );

  // Handle drawing
  const handleDraw = useCallback(
    (coords: { x: number; y: number }, isRightClick: boolean = false) => {
      if (!sprite) return;

      const color = isRightClick ? secondaryColor : primaryColor;
      const layer = getCurrentLayer();
      if (!layer || layer.locked) return;

      switch (currentTool) {
        case 'pencil': {
          const pixels: Array<{ x: number; y: number; color: Color }> = [];

          if (lastPos) {
            drawLine(lastPos.x, lastPos.y, coords.x, coords.y, color, pixels);
          } else {
            // Draw with brush size
            for (let bx = 0; bx < brushSize; bx++) {
              for (let by = 0; by < brushSize; by++) {
                const px = coords.x + bx - Math.floor(brushSize / 2);
                const py = coords.y + by - Math.floor(brushSize / 2);
                if (px >= 0 && px < sprite.width && py >= 0 && py < sprite.height) {
                  pixels.push({ x: px, y: py, color });
                }
              }
            }
          }

          setPendingPixels(prev => [...prev, ...pixels]);
          break;
        }

        case 'eraser': {
          const pixels: Array<{ x: number; y: number; color: Color }> = [];
          const transparent = { r: 0, g: 0, b: 0, a: 0 };

          if (lastPos) {
            drawLine(lastPos.x, lastPos.y, coords.x, coords.y, transparent, pixels);
          } else {
            for (let bx = 0; bx < brushSize; bx++) {
              for (let by = 0; by < brushSize; by++) {
                const px = coords.x + bx - Math.floor(brushSize / 2);
                const py = coords.y + by - Math.floor(brushSize / 2);
                if (px >= 0 && px < sprite.width && py >= 0 && py < sprite.height) {
                  pixels.push({ x: px, y: py, color: transparent });
                }
              }
            }
          }

          setPendingPixels(prev => [...prev, ...pixels]);
          break;
        }

        case 'fill': {
          fillArea(coords.x, coords.y, color);
          break;
        }

        case 'eyedropper': {
          const key = createPixelKey(coords.x, coords.y);
          const pixelColor = layer.pixels.get(key);
          if (pixelColor) {
            setPrimaryColor(pixelColor);
          }
          break;
        }
      }

      setLastPos(coords);
    },
    [
      sprite,
      currentTool,
      primaryColor,
      secondaryColor,
      brushSize,
      lastPos,
      fillArea,
      setPrimaryColor,
      getCurrentLayer,
      drawLine,
    ]
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const coords = getPixelCoords(e);
      if (!coords) return;

      setIsDrawing(true);
      setLastPos(null);
      setPendingPixels([]);
      handleDraw(coords, e.button === 2);
    },
    [getPixelCoords, handleDraw]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const coords = getPixelCoords(e);
      if (!coords) return;

      handleDraw(coords, e.buttons === 2);
    },
    [isDrawing, getPixelCoords, handleDraw]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing && pendingPixels.length > 0) {
      setPixelsBatch(pendingPixels);
    }
    setIsDrawing(false);
    setLastPos(null);
    setPendingPixels([]);
  }, [isDrawing, pendingPixels, setPixelsBatch]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing && pendingPixels.length > 0) {
      setPixelsBatch(pendingPixels);
    }
    setIsDrawing(false);
    setLastPos(null);
    setPendingPixels([]);
  }, [isDrawing, pendingPixels, setPixelsBatch]);

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Render pending pixels while drawing
  useEffect(() => {
    if (pendingPixels.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !sprite) return;

    // Draw pending pixels on top
    for (const pixel of pendingPixels) {
      if (pixel.color.a === 0) {
        // Redraw checkerboard for erased pixels
        const checkSize = zoom / 2;
        for (let cy = 0; cy < 2; cy++) {
          for (let cx = 0; cx < 2; cx++) {
            const checkX = pixel.x * 2 + cx;
            const checkY = pixel.y * 2 + cy;
            ctx.fillStyle = (checkX + checkY) % 2 === 0 ? '#2a2a3e' : '#3a3a4e';
            ctx.fillRect(
              pixel.x * zoom + cx * checkSize,
              pixel.y * zoom + cy * checkSize,
              checkSize,
              checkSize
            );
          }
        }
      } else {
        ctx.fillStyle = colorToRgba(pixel.color);
        ctx.fillRect(pixel.x * zoom, pixel.y * zoom, zoom, zoom);
      }
    }
  }, [pendingPixels, sprite, zoom]);

  if (!sprite) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Create or load a sprite to start editing
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center h-full overflow-auto p-4"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        className="cursor-crosshair border border-editor-accent/50 shadow-lg"
        style={{
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
