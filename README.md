# Pixelverse

AI-powered pixel art sprite editor. Create sprites in seconds with Retro Diffusion AI models.

## Features

- **AI Sprite Generation** - Generate pixel art from text prompts using Retro Diffusion models (rd-fast, rd-plus)
- **Drawing Tools** - Pencil, eraser, fill bucket, eyedropper, line, rectangle, circle
- **Pan & Zoom** - Fast 30x accelerated panning for quick navigation, zoom up to 100x
- **Layers** - Multiple layers with visibility, opacity, and lock controls
- **Animation** - Multi-frame animation with adjustable frame durations and playback
- **Frame Copy/Paste** - Quickly duplicate frames with Cmd/Ctrl+C/V
- **Color Palettes** - Built-in NES, Game Boy, and PICO-8 palettes
- **Export Options** - Native save dialog, project files (.pixelverse), PNG, spritesheets, GIF
- **1:1 Preview** - Real-time actual-size preview while editing

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Replicate API token

# Start development server
npm run dev

# Build for production
npm run build
```

To use AI sprite generation, get your API token from [Replicate](https://replicate.com/account/api-tokens) and add it to `.env`.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Pencil | P |
| Eraser | E |
| Fill | F |
| Eyedropper | I |
| Pan | H |
| Line | L |
| Rectangle | R |
| Circle | C |
| Zoom In/Out | +/- or Cmd/Ctrl + Scroll |
| Undo | Cmd/Ctrl + Z |
| Redo | Cmd/Ctrl + Y |
| Toggle Grid | Cmd/Ctrl + G |
| Brush Size | [ / ] |
| Copy Frame | Cmd/Ctrl + C |
| Paste Frame | Cmd/Ctrl + V |
| Save Project | Cmd/Ctrl + S |

## AI Generation

Pixelverse uses [Retro Diffusion](https://replicate.com/retro-diffusion) models via Replicate API:

- **RD Fast** - Quick generation with 15 style options
- **RD Plus** - Higher quality with 19 style options

Styles include: default, retro, game_asset, character_turnaround, isometric, topdown, and more.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Replicate API (Retro Diffusion models)

## License

MIT
