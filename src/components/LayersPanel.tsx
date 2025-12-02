import { useState } from 'react';
import { useEditor } from '../store/EditorContext';

export function LayersPanel() {
  const { state, dispatch, getCurrentFrame } = useEditor();
  const { currentLayerIndex, sprite } = state;

  const [editingLayerName, setEditingLayerName] = useState<number | null>(null);
  const [layerNameInput, setLayerNameInput] = useState('');

  const frame = getCurrentFrame();
  const layers = frame?.layers || [];

  const handleAddLayer = () => {
    dispatch({ type: 'ADD_LAYER' });
  };

  const handleDeleteLayer = (index: number) => {
    if (layers.length > 1) {
      dispatch({ type: 'DELETE_LAYER', index });
    }
  };

  const handleToggleVisibility = (index: number) => {
    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', index });
  };

  const handleSelectLayer = (index: number) => {
    dispatch({ type: 'SET_CURRENT_LAYER', index });
  };

  const handleStartRename = (index: number, currentName: string) => {
    setEditingLayerName(index);
    setLayerNameInput(currentName);
  };

  const handleFinishRename = (index: number) => {
    if (layerNameInput.trim()) {
      dispatch({ type: 'RENAME_LAYER', index, name: layerNameInput.trim() });
    }
    setEditingLayerName(null);
    setLayerNameInput('');
  };

  const handleOpacityChange = (index: number, opacity: number) => {
    dispatch({ type: 'SET_LAYER_OPACITY', index, opacity });
  };

  const handleMoveLayer = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex + 1 : fromIndex - 1;
    if (toIndex >= 0 && toIndex < layers.length) {
      dispatch({ type: 'REORDER_LAYERS', fromIndex, toIndex });
    }
  };

  if (!sprite) {
    return (
      <div className="panel p-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Layers
        </h3>
        <p className="text-xs text-gray-500">No sprite loaded</p>
      </div>
    );
  }

  return (
    <div className="panel p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Layers
        </h3>
        <button
          onClick={handleAddLayer}
          className="btn-secondary text-xs px-2 py-1"
          title="Add Layer"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
        {[...layers].reverse().map((layer, reversedIndex) => {
          const index = layers.length - 1 - reversedIndex;
          const isSelected = index === currentLayerIndex;
          const isEditing = editingLayerName === index;

          return (
            <div
              key={layer.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-editor-highlight/30 border border-editor-highlight'
                  : 'bg-editor-accent/30 border border-transparent hover:border-editor-accent'
              }`}
              onClick={() => handleSelectLayer(index)}
            >
              {/* Visibility toggle */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleToggleVisibility(index);
                }}
                className={`w-6 h-6 flex items-center justify-center rounded ${
                  layer.visible ? 'text-white' : 'text-gray-500'
                }`}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? '👁' : '👁‍🗨'}
              </button>

              {/* Layer name */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={layerNameInput}
                    onChange={e => setLayerNameInput(e.target.value)}
                    onBlur={() => handleFinishRename(index)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleFinishRename(index);
                      if (e.key === 'Escape') {
                        setEditingLayerName(null);
                        setLayerNameInput('');
                      }
                    }}
                    className="w-full bg-editor-bg text-white text-xs p-1 rounded"
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="text-xs truncate block"
                    onDoubleClick={e => {
                      e.stopPropagation();
                      handleStartRename(index, layer.name);
                    }}
                  >
                    {layer.name}
                  </span>
                )}
              </div>

              {/* Layer actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleMoveLayer(index, 'up');
                  }}
                  disabled={index === layers.length - 1}
                  className="w-5 h-5 text-xs disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleMoveLayer(index, 'down');
                  }}
                  disabled={index === 0}
                  className="w-5 h-5 text-xs disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteLayer(index);
                  }}
                  disabled={layers.length <= 1}
                  className="w-5 h-5 text-xs text-red-400 disabled:opacity-30 hover:text-red-300"
                  title="Delete layer"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer opacity slider */}
      {layers[currentLayerIndex] && (
        <div className="border-t border-editor-accent/30 pt-3">
          <label className="text-xs text-gray-400 block mb-1">
            Opacity: {layers[currentLayerIndex].opacity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={layers[currentLayerIndex].opacity}
            onChange={e => handleOpacityChange(currentLayerIndex, parseInt(e.target.value))}
            className="w-full accent-editor-highlight"
          />
        </div>
      )}
    </div>
  );
}
