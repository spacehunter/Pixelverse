import { useEffect, useRef, useCallback } from 'react';
import { useEditor } from '../store/EditorContext';

export function AnimationTimeline() {
  const { state, dispatch } = useEditor();
  const { sprite, currentFrameIndex, isPlaying, copiedFrame, floatingSelection, selection, copiedSelection } = state;
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Use refs to avoid stale closures in animation loop
  const frameIndexRef = useRef(currentFrameIndex);
  const spriteRef = useRef(sprite);

  // Keep refs in sync
  useEffect(() => {
    frameIndexRef.current = currentFrameIndex;
  }, [currentFrameIndex]);

  useEffect(() => {
    spriteRef.current = sprite;
  }, [sprite]);

  // Animation loop - only depends on isPlaying
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = 0;
      return;
    }

    const animate = (timestamp: number) => {
      const currentSprite = spriteRef.current;
      if (!currentSprite || currentSprite.frames.length <= 1) {
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const currentIdx = frameIndexRef.current;
      const currentFrame = currentSprite.frames[currentIdx];

      if (!currentFrame) {
        // Frame was deleted, reset to 0
        dispatch({ type: 'SET_CURRENT_FRAME', index: 0 });
        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - lastTimeRef.current;

      if (elapsed >= currentFrame.duration) {
        const nextIndex = (currentIdx + 1) % currentSprite.frames.length;
        dispatch({ type: 'SET_CURRENT_FRAME', index: nextIndex });
        lastTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, dispatch]);

  // Keyboard shortcuts for copy/paste frames
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cmd/Ctrl + C to copy frame (only when no selection exists)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && !e.shiftKey) {
        // Only copy frame if we have a sprite and NO active selection
        // If there's a selection, PixelCanvas handles copying the selection
        if (sprite && !selection) {
          dispatch({ type: 'COPY_FRAME' });
        }
      }

      // Cmd/Ctrl + V to paste frame (only when no copied selection exists)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v' && !e.shiftKey) {
        // Only paste frame if there's no copied selection
        // If there's a copied selection, PixelCanvas handles pasting it
        if (sprite && copiedFrame && !copiedSelection) {
          e.preventDefault();
          dispatch({ type: 'PASTE_FRAME' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, sprite, copiedFrame, selection, copiedSelection]);

  const handleAddFrame = () => {
    dispatch({ type: 'ADD_FRAME' });
  };

  const handleDeleteFrame = (index: number) => {
    if (sprite && sprite.frames.length > 1) {
      dispatch({ type: 'DELETE_FRAME', index });
    }
  };

  const handleDuplicateFrame = (index: number) => {
    dispatch({ type: 'DUPLICATE_FRAME', index });
  };

  const handleSelectFrame = (index: number) => {
    dispatch({ type: 'SET_CURRENT_FRAME', index });
  };

  const handleTogglePlay = () => {
    dispatch({ type: 'TOGGLE_PLAY' });
  };

  const handleDurationChange = (index: number, duration: number) => {
    dispatch({ type: 'SET_FRAME_DURATION', index, duration });
  };

  // Internal render function
  const renderFrameThumbnailInternal = useCallback(
    (frameIndex: number, canvas: HTMLCanvasElement | null) => {
      if (!canvas || !sprite) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const frame = sprite.frames[frameIndex];
      const scale = Math.min(canvas.width / sprite.width, canvas.height / sprite.height);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw checkerboard background
      const checkSize = 4;
      for (let y = 0; y < canvas.height / checkSize; y++) {
        for (let x = 0; x < canvas.width / checkSize; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2a3e' : '#3a3a4e';
          ctx.fillRect(x * checkSize, y * checkSize, checkSize, checkSize);
        }
      }

      // Draw all visible layers
      for (const layer of frame.layers) {
        if (!layer.visible) continue;

        const opacity = layer.opacity / 100;

        layer.pixels.forEach((color, key) => {
          const [x, y] = key.split(',').map(Number);
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a / 255) * opacity})`;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        });
      }

      // Draw floating selection on the current frame's thumbnail
      if (frameIndex === currentFrameIndex && floatingSelection) {
        const { x: fx, y: fy, pixels } = floatingSelection;
        pixels.forEach((color, key) => {
          const [relX, relY] = key.split(',').map(Number);
          const absX = relX + fx;
          const absY = relY + fy;
          if (absX >= 0 && absX < sprite.width && absY >= 0 && absY < sprite.height) {
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
            ctx.fillRect(absX * scale, absY * scale, scale, scale);
          }
        });

        // Draw a subtle border around the floating selection area
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.7)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(
          fx * scale,
          fy * scale,
          floatingSelection.width * scale,
          floatingSelection.height * scale
        );
        ctx.setLineDash([]);
      }
    },
    [sprite, currentFrameIndex, floatingSelection]
  );

  // Wrapper that stores the canvas ref and renders
  const renderFrameThumbnail = useCallback(
    (frameIndex: number, canvas: HTMLCanvasElement | null) => {
      if (canvas) {
        canvasRefs.current.set(frameIndex, canvas);
      }
      renderFrameThumbnailInternal(frameIndex, canvas);
    },
    [renderFrameThumbnailInternal]
  );

  // Re-render current frame thumbnail when floating selection changes
  useEffect(() => {
    if (!sprite) return;
    const canvas = canvasRefs.current.get(currentFrameIndex);
    if (canvas) {
      renderFrameThumbnailInternal(currentFrameIndex, canvas);
    }
  }, [floatingSelection, currentFrameIndex, sprite, renderFrameThumbnailInternal]);

  if (!sprite) {
    return (
      <div className="panel p-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Animation
        </h3>
        <p className="text-xs text-gray-500">No sprite loaded</p>
      </div>
    );
  }

  // Safety check: ensure currentFrameIndex is valid
  const safeFrameIndex = Math.min(currentFrameIndex, sprite.frames.length - 1);
  const currentFrame = sprite.frames[safeFrameIndex];

  if (!currentFrame) {
    return (
      <div className="panel p-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Animation
        </h3>
        <p className="text-xs text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Animation
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className={`btn-secondary text-xs px-3 py-1 flex items-center gap-1 ${
              isPlaying ? 'bg-editor-highlight' : ''
            }`}
          >
            {isPlaying ? (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play
              </>
            )}
          </button>
          <button onClick={handleAddFrame} className="btn-secondary text-xs px-2 py-1">
            + Frame
          </button>
        </div>
      </div>

      {/* Frame thumbnails */}
      <div className="flex gap-2 overflow-x-auto py-2 px-1">
        {sprite.frames.map((frame, index) => (
          <div
            key={frame.id}
            className={`flex-shrink-0 cursor-pointer rounded overflow-hidden transition-all ${
              index === currentFrameIndex
                ? 'ring-2 ring-editor-highlight shadow-[0_0_12px_rgba(233,69,96,0.6)]'
                : 'ring-1 ring-editor-accent/50 hover:ring-editor-accent'
            }`}
            onClick={() => handleSelectFrame(index)}
          >
            <canvas
              width={64}
              height={64}
              ref={canvas => renderFrameThumbnail(index, canvas)}
              className="block"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="bg-editor-accent/50 p-1 rounded-b flex items-center justify-between">
              <span className="text-xs text-gray-300">#{index + 1}</span>
              <div className="flex gap-1">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDuplicateFrame(index);
                  }}
                  className="text-xs text-gray-400 hover:text-editor-highlight"
                  title="Duplicate frame"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2"/>
                  </svg>
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteFrame(index);
                  }}
                  disabled={sprite.frames.length <= 1}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-30"
                  title="Delete frame"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Frame duration */}
      <div className="border-t border-editor-accent/30 pt-3 mt-3">
        <label className="text-xs text-gray-400 block mb-1">
          Frame {safeFrameIndex + 1} Duration: {currentFrame.duration}ms
        </label>
        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={currentFrame.duration}
          onChange={e => handleDurationChange(safeFrameIndex, parseInt(e.target.value))}
          className="w-full accent-editor-highlight"
        />
      </div>

      {/* Animation stats */}
      <div className="text-xs text-gray-500 mt-2">
        {sprite.frames.length} frame{sprite.frames.length !== 1 ? 's' : ''} •{' '}
        {Math.round(
          1000 / (sprite.frames.reduce((sum, f) => sum + f.duration, 0) / sprite.frames.length)
        )}{' '}
        FPS avg
        {copiedSelection && (
          <span className="ml-2 text-purple-400">• Selection copied</span>
        )}
        {copiedFrame && !copiedSelection && (
          <span className="ml-2 text-editor-highlight">• Frame copied</span>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-gray-600 mt-1">
        Cmd/Ctrl+C to copy • Cmd/Ctrl+V to paste
      </div>
    </div>
  );
}
