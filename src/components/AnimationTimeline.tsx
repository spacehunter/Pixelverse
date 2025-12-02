import { useEffect, useRef, useCallback } from 'react';
import { useEditor } from '../store/EditorContext';

export function AnimationTimeline() {
  const { state, dispatch } = useEditor();
  const { sprite, currentFrameIndex, isPlaying } = state;
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !sprite || sprite.frames.length <= 1) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const currentFrame = sprite.frames[currentFrameIndex];
      const elapsed = timestamp - lastTimeRef.current;

      if (elapsed >= currentFrame.duration) {
        const nextIndex = (currentFrameIndex + 1) % sprite.frames.length;
        dispatch({ type: 'SET_CURRENT_FRAME', index: nextIndex });
        lastTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, sprite, currentFrameIndex, dispatch]);

  // Reset timer when stopping
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = 0;
    }
  }, [isPlaying]);

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

  // Render frame thumbnail
  const renderFrameThumbnail = useCallback(
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
    },
    [sprite]
  );

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

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Animation
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className={`btn-secondary text-xs px-3 py-1 ${
              isPlaying ? 'bg-editor-highlight' : ''
            }`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={handleAddFrame} className="btn-secondary text-xs px-2 py-1">
            + Frame
          </button>
        </div>
      </div>

      {/* Frame thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sprite.frames.map((frame, index) => (
          <div
            key={frame.id}
            className={`flex-shrink-0 cursor-pointer rounded transition-all ${
              index === currentFrameIndex
                ? 'ring-2 ring-editor-highlight scale-105'
                : 'hover:ring-1 hover:ring-editor-accent'
            }`}
            onClick={() => handleSelectFrame(index)}
          >
            <canvas
              width={64}
              height={64}
              ref={canvas => renderFrameThumbnail(index, canvas)}
              className="rounded-t"
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
                  className="text-xs hover:text-editor-highlight"
                  title="Duplicate frame"
                >
                  📋
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
          Frame {currentFrameIndex + 1} Duration: {sprite.frames[currentFrameIndex].duration}ms
        </label>
        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={sprite.frames[currentFrameIndex].duration}
          onChange={e => handleDurationChange(currentFrameIndex, parseInt(e.target.value))}
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
      </div>
    </div>
  );
}
