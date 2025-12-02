# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pixelverse is an AI-powered pixel art sprite editor built with React 19, TypeScript, and Vite. It features real AI sprite generation using Replicate's Retro Diffusion models, multi-frame animation, layers, and comprehensive export options.

## Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Type-check and build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture

### State Management

The app uses React Context with `useReducer` for state management (`src/store/EditorContext.tsx`). The `EditorProvider` wraps the entire application and exposes:
- Editor state (sprite, tool, colors, zoom, history, copiedFrame)
- Actions via dispatch (SET_PIXEL, SET_PIXELS_BATCH, FILL_AREA, UNDO/REDO, COPY_FRAME, PASTE_FRAME, etc.)
- Convenience methods via `useEditor()` hook
- App starts with a default 16x16 blank canvas (no create dialog needed)

### Core Data Structures

Defined in `src/types/index.ts`:
- **Sprite**: Container with width/height (8/16/32/64/128), frames, and metadata
- **Frame**: Collection of layers with duration for animation
- **Layer**: Name, visibility, opacity, lock state, and pixel data stored as `Map<string, Color>` using "x,y" string keys
- **Color**: RGBA object with r, g, b, a (0-255)
- **Tool**: pencil, eraser, fill, eyedropper, pan, line, rectangle, circle

Use `createPixelKey(x, y)` and `parsePixelKey(key)` utilities for pixel map operations.

### Component Structure

- **App.tsx**: Main layout with three-panel design (left sidebar, center canvas, right panel)
- **PixelCanvas**: HTML5 canvas with zoom (1-100x), grid, drawing tools, pan tool, and 1:1 preview
- **Toolbar**: Tool selection, brush size, zoom slider with Cmd/Ctrl+scroll support
- **ColorPalette**: Color picking with NES, Game Boy, PICO-8 palette presets
- **LayersPanel**: Layer management (add, delete, reorder, visibility, opacity)
- **AnimationTimeline**: Frame management, playback, copy/paste frames (Cmd/Ctrl+C/V)
- **AIGenerationPanel**: AI sprite generation with model/style selection
- **ExportPanel**: Save/load projects (.pixelverse), export PNG/spritesheet/GIF

### AI Service

`src/services/aiService.ts` integrates with Replicate API for real AI sprite generation:
- **Models**: rd-fast (15 styles, faster) and rd-plus (19 styles, higher quality)
- **Styles**: default, retro, game_asset, character_turnaround, pixel art specific styles
- **Features**: Background removal, custom sizes (16-128px)
- Uses Vite proxy (`/api/replicate`) to avoid CORS issues
- Converts generated images to editable pixel data

### Keyboard Shortcuts

- **Tools**: P (pencil), E (eraser), F (fill), I (eyedropper), H (pan), L (line), R (rectangle), C (circle)
- **Zoom**: +/- keys, or Cmd/Ctrl + scroll wheel
- **Undo/Redo**: Cmd/Ctrl+Z / Cmd/Ctrl+Y (or Cmd/Ctrl+Shift+Z)
- **Grid**: Cmd/Ctrl+G
- **Brush size**: [ and ] keys
- **Copy/Paste Frame**: Cmd/Ctrl+C / Cmd/Ctrl+V
- **Save Project**: Cmd/Ctrl+S

### Styling

Uses Tailwind CSS with custom editor theme colors:
- `editor-bg`: #1a1a2e
- `editor-panel`: #16213e
- `editor-accent`: #0f3460
- `editor-highlight`: #e94560
