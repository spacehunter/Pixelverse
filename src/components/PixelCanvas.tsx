import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditor } from '../store/EditorContext';
import type { Color } from '../types';
import { createPixelKey, colorToRgba } from '../types';

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    state,
    dispatch,
    setPixelsBatch,
    fillArea,
    setPrimaryColor,
    getCurrentLayer,
    getCurrentFrame,
  } = useEditor();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState<{ x: number; y: number } | null>(null);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [pendingPixels, setPendingPixels] = useState<Array<{ x: number; y: number; color: Color }>>([]);

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);

  // Floating selection dragging state
  const [isDraggingFloating, setIsDraggingFloating] = useState(false);
  const [floatingDragOffset, setFloatingDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Marching ants animation
  const [marchingAntsOffset, setMarchingAntsOffset] = useState(0);

  const { sprite, zoom, showGrid, currentTool, primaryColor, secondaryColor, brushSize, selection, floatingSelection } = state;

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

    // Draw floating selection (pasted content that can be moved)
    if (floatingSelection) {
      const { x: fx, y: fy, pixels: floatingPixels } = floatingSelection;
      floatingPixels.forEach((color, key) => {
        const [relX, relY] = key.split(',').map(Number);
        const absX = relX + fx;
        const absY = relY + fy;
        if (absX >= 0 && absX < sprite.width && absY >= 0 && absY < sprite.height) {
          ctx.fillStyle = colorToRgba(color);
          ctx.fillRect(absX * pixelSize, absY * pixelSize, pixelSize, pixelSize);
        }
      });

      // Draw marching ants border around floating selection
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -marchingAntsOffset;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        fx * pixelSize + 0.5,
        fy * pixelSize + 0.5,
        floatingSelection.width * pixelSize - 1,
        floatingSelection.height * pixelSize - 1
      );
      ctx.strokeStyle = 'black';
      ctx.lineDashOffset = -marchingAntsOffset + 4;
      ctx.strokeRect(
        fx * pixelSize + 0.5,
        fy * pixelSize + 0.5,
        floatingSelection.width * pixelSize - 1,
        floatingSelection.height * pixelSize - 1
      );
      ctx.setLineDash([]);
    }

    // Draw selection rectangle with marching ants
    if (selection) {
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -marchingAntsOffset;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        selection.x * pixelSize + 0.5,
        selection.y * pixelSize + 0.5,
        selection.width * pixelSize - 1,
        selection.height * pixelSize - 1
      );
      ctx.strokeStyle = 'black';
      ctx.lineDashOffset = -marchingAntsOffset + 4;
      ctx.strokeRect(
        selection.x * pixelSize + 0.5,
        selection.y * pixelSize + 0.5,
        selection.width * pixelSize - 1,
        selection.height * pixelSize - 1
      );
      ctx.setLineDash([]);
    }

    // Draw selection in progress (while dragging)
    if (isSelecting && selectionStart && selectionEnd) {
      const sx = Math.min(selectionStart.x, selectionEnd.x);
      const sy = Math.min(selectionStart.y, selectionEnd.y);
      const sw = Math.abs(selectionEnd.x - selectionStart.x) + 1;
      const sh = Math.abs(selectionEnd.y - selectionStart.y) + 1;

      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -marchingAntsOffset;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx * pixelSize + 0.5, sy * pixelSize + 0.5, sw * pixelSize - 1, sh * pixelSize - 1);
      ctx.strokeStyle = 'black';
      ctx.lineDashOffset = -marchingAntsOffset + 4;
      ctx.strokeRect(sx * pixelSize + 0.5, sy * pixelSize + 0.5, sw * pixelSize - 1, sh * pixelSize - 1);
      ctx.setLineDash([]);

      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(100, 149, 237, 0.2)';
      ctx.fillRect(sx * pixelSize, sy * pixelSize, sw * pixelSize, sh * pixelSize);
    }
  }, [sprite, zoom, showGrid, getCurrentFrame, selection, floatingSelection, isSelecting, selectionStart, selectionEnd, marchingAntsOffset]);

  // Re-render when state changes
  useEffect(() => {
    render();
  }, [render, state]);

  // Marching ants animation
  useEffect(() => {
    if (!selection && !floatingSelection && !isSelecting) return;

    const interval = setInterval(() => {
      setMarchingAntsOffset(prev => (prev + 1) % 8);
    }, 100);

    return () => clearInterval(interval);
  }, [selection, floatingSelection, isSelecting]);

  // Keyboard shortcuts for selection (Escape to cancel, copy/paste handled in Toolbar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        // Cancel floating selection or clear selection
        if (floatingSelection) {
          dispatch({ type: 'CANCEL_FLOATING_SELECTION' });
        } else if (selection) {
          dispatch({ type: 'SET_SELECTION', selection: null });
        }
      }

      // Copy selection (Cmd/Ctrl + C)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selection) {
        dispatch({ type: 'COPY_SELECTION' });
        e.preventDefault();
      }

      // Paste selection (Cmd/Ctrl + V)
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && state.copiedSelection) {
        // Commit any existing floating selection first
        if (floatingSelection) {
          dispatch({ type: 'COMMIT_FLOATING_SELECTION' });
        }
        dispatch({ type: 'PASTE_SELECTION' });
        e.preventDefault();
      }

      // Enter to commit floating selection
      if (e.key === 'Enter' && floatingSelection) {
        dispatch({ type: 'COMMIT_FLOATING_SELECTION' });
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, floatingSelection, state.copiedSelection, dispatch]);

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

  // Check if a point is inside the floating selection
  const isInsideFloatingSelection = useCallback(
    (x: number, y: number): boolean => {
      if (!floatingSelection) return false;
      return (
        x >= floatingSelection.x &&
        x < floatingSelection.x + floatingSelection.width &&
        y >= floatingSelection.y &&
        y < floatingSelection.y + floatingSelection.height
      );
    },
    [floatingSelection]
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      // Handle pan tool
      if (currentTool === 'pan') {
        setIsPanning(true);
        setLastPanPos({ x: e.clientX, y: e.clientY });
        return;
      }

      const coords = getPixelCoords(e);
      if (!coords) return;

      // Handle floating selection
      if (floatingSelection) {
        if (isInsideFloatingSelection(coords.x, coords.y)) {
          // Start dragging the floating selection
          setIsDraggingFloating(true);
          setFloatingDragOffset({
            x: coords.x - floatingSelection.x,
            y: coords.y - floatingSelection.y,
          });
          return;
        } else {
          // Clicked outside - commit the floating selection
          dispatch({ type: 'COMMIT_FLOATING_SELECTION' });
          return;
        }
      }

      // Handle select tool
      if (currentTool === 'select') {
        // Clear existing selection
        dispatch({ type: 'SET_SELECTION', selection: null });
        setIsSelecting(true);
        setSelectionStart(coords);
        setSelectionEnd(coords);
        return;
      }

      // Clear selection when using other tools
      if (selection) {
        dispatch({ type: 'SET_SELECTION', selection: null });
      }

      setIsDrawing(true);
      setLastPos(null);
      setPendingPixels([]);
      handleDraw(coords, e.button === 2);
    },
    [getPixelCoords, handleDraw, currentTool, floatingSelection, isInsideFloatingSelection, dispatch, selection]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Pan is handled by global handlers, skip here
      if (isPanning) return;

      const coords = getPixelCoords(e);
      if (!coords) return;

      // Handle floating selection dragging
      if (isDraggingFloating && floatingDragOffset && floatingSelection) {
        const newX = coords.x - floatingDragOffset.x;
        const newY = coords.y - floatingDragOffset.y;
        dispatch({ type: 'MOVE_FLOATING_SELECTION', x: newX, y: newY });
        return;
      }

      // Handle selection in progress
      if (isSelecting) {
        setSelectionEnd(coords);
        return;
      }

      if (!isDrawing) return;
      handleDraw(coords, e.buttons === 2);
    },
    [isDrawing, isPanning, isSelecting, isDraggingFloating, floatingDragOffset, floatingSelection, getPixelCoords, handleDraw, dispatch]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPos(null);
      return;
    }

    // Finish floating selection drag
    if (isDraggingFloating) {
      setIsDraggingFloating(false);
      setFloatingDragOffset(null);
      return;
    }

    // Finish selection
    if (isSelecting && selectionStart && selectionEnd) {
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const width = Math.abs(selectionEnd.x - selectionStart.x) + 1;
      const height = Math.abs(selectionEnd.y - selectionStart.y) + 1;

      // Only create selection if it has area
      if (width > 0 && height > 0) {
        dispatch({ type: 'SET_SELECTION', selection: { x, y, width, height } });
      }

      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    if (isDrawing && pendingPixels.length > 0) {
      setPixelsBatch(pendingPixels);
    }
    setIsDrawing(false);
    setLastPos(null);
    setPendingPixels([]);
  }, [isDrawing, isPanning, isSelecting, isDraggingFloating, selectionStart, selectionEnd, pendingPixels, setPixelsBatch, dispatch]);

  const handleMouseLeave = useCallback(() => {
    // Don't stop panning when mouse leaves - let global handler manage it
    if (isPanning) {
      return;
    }

    // Don't stop selection or floating drag on mouse leave
    if (isSelecting || isDraggingFloating) {
      return;
    }

    if (isDrawing && pendingPixels.length > 0) {
      setPixelsBatch(pendingPixels);
    }
    setIsDrawing(false);
    setLastPos(null);
    setPendingPixels([]);
  }, [isDrawing, isPanning, isSelecting, isDraggingFloating, pendingPixels, setPixelsBatch]);

  // Use ref for lastPanPos to avoid effect re-running on every move
  const lastPanPosRef = useRef<{ x: number; y: number } | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    lastPanPosRef.current = lastPanPos;
  }, [lastPanPos]);

  // Global mouse handlers for panning (so it works even outside canvas)
  useEffect(() => {
    if (!isPanning) {
      return;
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const pos = lastPanPosRef.current;
      if (!pos) return;
      const container = containerRef.current;
      if (!container) return;

      const dx = e.clientX - pos.x;
      const dy = e.clientY - pos.y;

      // High-speed panning - 30x multiplier for fast navigation
      const speed = 30;

      // Scroll the container (negative because dragging right should show content on the left)
      container.scrollBy(-dx * speed, -dy * speed);

      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setLastPanPos(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning]);

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Handle scroll wheel: Cmd/Ctrl + scroll for zoom, regular scroll for pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Zoom if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -5 : 5;
        const newZoom = Math.max(1, Math.min(100, zoom + delta));
        dispatch({ type: 'SET_ZOOM', zoom: newZoom });
      }
      // Otherwise allow natural scrolling for panning
    };

    // Use non-passive listener to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [dispatch, zoom, sprite]);

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

  // Render 1:1 preview
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const preview = previewRef.current;
    const ctx = preview?.getContext('2d');
    if (!preview || !ctx || !sprite) return;

    preview.width = sprite.width;
    preview.height = sprite.height;

    // Clear with checkerboard
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2a3e' : '#3a3a4e';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw all visible layers
    const frame = getCurrentFrame();
    if (!frame) return;

    for (const layer of frame.layers) {
      if (!layer.visible) continue;
      const opacity = layer.opacity / 100;

      layer.pixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a / 255) * opacity})`;
        ctx.fillRect(x, y, 1, 1);
      });
    }
  }, [sprite, state, getCurrentFrame]);

  if (!sprite) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Create or load a sprite to start editing
      </div>
    );
  }

  // Calculate canvas dimensions
  const canvasWidth = sprite.width * zoom;
  const canvasHeight = sprite.height * zoom;

  return (
    <div className="relative w-full h-full">
      {/* Scroll container - absolute positioning gives it definite dimensions */}
      <div
        ref={containerRef}
        className="absolute top-0 left-0 right-0 bottom-0 overflow-auto"
      >
        {/* Inner content - explicit size larger than container forces scrollbars */}
        <div
          style={{
            width: `${canvasWidth + 32}px`,
            height: `${canvasHeight + 32}px`,
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
            className={`border border-editor-accent/50 shadow-lg block ${
              floatingSelection
                ? isDraggingFloating ? 'cursor-grabbing' : 'cursor-move'
                : currentTool === 'pan'
                  ? isPanning ? 'cursor-grabbing' : 'cursor-grab'
                  : currentTool === 'select'
                    ? 'cursor-crosshair'
                    : 'cursor-crosshair'
            }`}
            style={{
              imageRendering: 'pixelated',
            }}
          />
        </div>
      </div>

      {/* 1:1 Preview - fixed in corner */}
      <div
        className="fixed bg-editor-panel border border-editor-accent/50 rounded-lg p-2 shadow-lg z-50"
        style={{ bottom: '80px', right: '290px' }}
      >
        <div className="text-xs text-gray-400 mb-1 text-center">1:1 Preview</div>
        <canvas
          ref={previewRef}
          className="border border-editor-accent/30"
          style={{
            imageRendering: 'pixelated',
            minWidth: '64px',
            minHeight: '64px',
            width: sprite.width < 64 ? '64px' : `${sprite.width}px`,
            height: sprite.height < 64 ? '64px' : `${sprite.height}px`,
          }}
        />
        <div className="text-xs text-gray-500 mt-1 text-center">
          {sprite.width}x{sprite.height}
        </div>
      </div>
    </div>
  );
}
