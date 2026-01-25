import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EditorProvider } from '../store/EditorContext';
import {
  Header,
  PixelCanvas,
  Toolbar,
  ColorPalette,
  LayersPanel,
  AnimationTimeline,
  AIGenerationPanel,
  ExportPanel,
} from '../components';

type RightPanel = 'ai' | 'layers' | 'export';

function EditorLayout() {
  const [rightPanel, setRightPanel] = useState<RightPanel>('ai');

  return (
    <div className="h-screen flex flex-col bg-editor-bg">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools & Colors */}
        <aside className="w-48 flex-shrink-0 overflow-y-auto p-2 space-y-2 border-r border-editor-accent/30">
          <Toolbar />
          <ColorPalette />
        </aside>

        {/* Center - Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <PixelCanvas />
          </div>

          {/* Animation Timeline */}
          <div className="border-t border-editor-accent/30">
            <AnimationTimeline />
          </div>
        </main>

        {/* Right Sidebar - AI, Layers, Export */}
        <aside className="w-72 flex-shrink-0 overflow-y-auto border-l border-editor-accent/30">
          {/* Panel Tabs */}
          <div className="flex border-b border-editor-accent/30">
            <button
              onClick={() => setRightPanel('ai')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                rightPanel === 'ai'
                  ? 'bg-editor-highlight text-white'
                  : 'text-gray-400 hover:bg-editor-accent/30'
              }`}
            >
              AI Generate
            </button>
            <button
              onClick={() => setRightPanel('layers')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                rightPanel === 'layers'
                  ? 'bg-editor-highlight text-white'
                  : 'text-gray-400 hover:bg-editor-accent/30'
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setRightPanel('export')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                rightPanel === 'export'
                  ? 'bg-editor-highlight text-white'
                  : 'text-gray-400 hover:bg-editor-accent/30'
              }`}
            >
              Export
            </button>
          </div>

          {/* Panel Content */}
          <div className="p-2">
            {rightPanel === 'ai' && <AIGenerationPanel />}
            {rightPanel === 'layers' && <LayersPanel />}
            {rightPanel === 'export' && <ExportPanel />}
          </div>
        </aside>
      </div>

      {/* Footer - Status Bar */}
      <footer className="bg-editor-panel border-t border-editor-accent/30 px-4 py-1 text-xs text-gray-500 flex justify-between">
        <Link to="/" className="hover:text-gray-300 transition-colors">
          ← Back to Home
        </Link>
        <span>Press P for pencil, E for eraser, F for fill, I for eyedropper</span>
        <span>Ctrl+Z / Ctrl+Y for undo/redo</span>
      </footer>
    </div>
  );
}

export function EditorPage() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}

export default EditorPage;
