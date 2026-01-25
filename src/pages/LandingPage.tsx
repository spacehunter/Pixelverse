import { Link } from 'react-router-dom';

// Example sprite data - in production these would be actual generated examples
const exampleSprites = [
  { name: 'Knight', category: 'RPG', color: 'from-blue-500 to-purple-600' },
  { name: 'Slime', category: 'Enemies', color: 'from-green-400 to-emerald-600' },
  { name: 'Treasure Chest', category: 'Items', color: 'from-yellow-500 to-orange-600' },
  { name: 'Forest Tileset', category: 'Tilesets', color: 'from-green-600 to-teal-600' },
  { name: 'Wizard', category: 'RPG', color: 'from-purple-500 to-pink-600' },
  { name: 'Robot', category: 'Sci-Fi', color: 'from-gray-500 to-blue-600' },
];

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Generation',
    description: 'Describe what you want and let AI create pixel-perfect sprites in seconds.',
  },
  {
    icon: '🎨',
    title: 'Full Editor Suite',
    description: 'Complete drawing tools, layers, and color palettes for fine-tuning your sprites.',
  },
  {
    icon: '🎬',
    title: 'Animation Support',
    description: 'Create sprite sheets with multiple frames for walk cycles, attacks, and more.',
  },
  {
    icon: '📦',
    title: 'Game-Ready Export',
    description: 'Export as PNG, sprite sheets, or GIF animations ready for your game engine.',
  },
  {
    icon: '🎯',
    title: 'Multiple Sizes',
    description: 'Generate sprites in 8x8, 16x16, 32x32, 64x64, or custom dimensions.',
  },
  {
    icon: '💾',
    title: '100% Free',
    description: 'No signup required. Start creating immediately in your browser.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Describe Your Sprite',
    description: 'Type a description like "pixel art knight with blue armor and sword"',
  },
  {
    number: '2',
    title: 'Generate with AI',
    description: 'Our AI creates pixel art based on your description in seconds',
  },
  {
    number: '3',
    title: 'Refine & Export',
    description: 'Use the editor to perfect your sprite, then export for your game',
  },
];

const useCases = [
  'RPG Characters & NPCs',
  'Platformer Heroes & Enemies',
  'Game Environment Tilesets',
  'Item & Inventory Icons',
  'UI Elements & Buttons',
  'Animated Spell Effects',
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23] text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🎮</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Pixelverse
          </span>
        </div>
        <Link
          to="/editor"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
        >
          Open Editor
        </Link>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            AI Sprite Generator
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto">
          Create pixel art game assets in seconds with AI
        </p>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Free browser-based tool for indie game developers, hobbyists, and pixel art enthusiasts.
          No signup required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            to="/editor"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
          >
            Start Creating Free →
          </Link>
        </div>
        
        {/* Disambiguation Notice */}
        <p className="text-sm text-gray-500 italic">
          Looking for the Pixelverse Telegram game? That's a different project.{' '}
          <span className="text-gray-400">This is an AI sprite creation tool.</span>
        </p>
      </header>

      {/* Example Gallery */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          Generated Sprite Examples
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          See what our AI can create. From RPG characters to platformer enemies, tilesets to item icons.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {exampleSprites.map((sprite) => (
            <div
              key={sprite.name}
              className="aspect-square rounded-xl bg-gradient-to-br p-1 group cursor-pointer"
              style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
            >
              <div className={`w-full h-full rounded-lg bg-gradient-to-br ${sprite.color} flex items-center justify-center relative overflow-hidden`}>
                {/* Pixel grid overlay effect */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '8px 8px'
                  }}
                />
                <div className="text-center p-2 relative z-10">
                  <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                    {sprite.category === 'RPG' ? '⚔️' : 
                     sprite.category === 'Enemies' ? '👾' : 
                     sprite.category === 'Items' ? '📦' : 
                     sprite.category === 'Tilesets' ? '🌳' : 
                     sprite.category === 'Sci-Fi' ? '🤖' : '✨'}
                  </div>
                  <p className="text-xs font-medium text-white/90">{sprite.name}</p>
                  <p className="text-[10px] text-white/60">{sprite.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-16 border-t border-white/10">
        <h2 className="text-3xl font-bold text-center mb-4">
          How It Works
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Three simple steps to create game-ready pixel art
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16 border-t border-white/10">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything You Need
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          A complete toolkit for creating pixel art game assets
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What is Pixelverse / SEO Content Section */}
      <section className="container mx-auto px-6 py-16 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            What is Pixelverse?
          </h2>
          <div className="prose prose-lg prose-invert mx-auto">
            <p className="text-gray-300 mb-6">
              <strong>Pixelverse</strong> is a free, browser-based AI sprite generator designed specifically for game developers. 
              Whether you're building an indie RPG, a retro platformer, or a mobile puzzle game, Pixelverse helps you create 
              professional-quality pixel art assets in seconds instead of hours.
            </p>
            <p className="text-gray-300 mb-6">
              Our AI understands game art conventions and can generate characters, enemies, items, tilesets, and UI elements 
              that fit seamlessly into your projects. Simply describe what you need—like "16x16 pixel art treasure chest with 
              gold coins"—and watch your vision come to life.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-8 mb-4">Who Is It For?</h3>
            <ul className="text-gray-300 space-y-2 mb-6">
              <li><strong>Indie Game Developers</strong> — Rapid prototyping and asset creation without hiring an artist</li>
              <li><strong>Game Jam Participants</strong> — Create entire sprite sets in minutes during time-limited jams</li>
              <li><strong>Hobbyist Creators</strong> — Bring your game ideas to life even without art skills</li>
              <li><strong>Pixel Art Enthusiasts</strong> — Use AI as a starting point, then refine with our built-in editor</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-8 mb-4">Popular Use Cases</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {useCases.map((useCase) => (
                <div key={useCase} className="bg-white/5 rounded-lg px-4 py-2 text-sm text-gray-300">
                  {useCase}
                </div>
              ))}
            </div>

            <p className="text-gray-300">
              Unlike generic AI art tools, Pixelverse is optimized for game development workflows. We support standard sprite 
              sizes (8x8, 16x16, 32x32, 64x64), sprite sheet export for animations, and transparent backgrounds—everything 
              you need to drop assets directly into Unity, Godot, GameMaker, or any other engine.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section - Disambiguation */}
      <section className="container mx-auto px-6 py-16 border-t border-white/10">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-2">
              Is this the Pixelverse Telegram game?
            </h3>
            <p className="text-gray-400">
              <strong>No!</strong> Pixelverse.cloud is an AI-powered sprite creation tool for game developers. 
              The Pixelverse Telegram game is a completely separate and unrelated product. We're a creative tool 
              for making pixel art, not a game.
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-2">
              Is it really free?
            </h3>
            <p className="text-gray-400">
              Yes! Pixelverse is completely free to use. No account required, no credit card, no hidden fees. 
              Just open the editor and start creating. We may add premium features in the future, but the core 
              sprite generation will always be free.
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-2">
              Can I use generated sprites in commercial games?
            </h3>
            <p className="text-gray-400">
              Yes! All sprites you create with Pixelverse are yours to use however you want, including in 
              commercial projects. We encourage you to modify and refine the AI output using our editor 
              to make it uniquely yours.
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-2">
              What game engines work with Pixelverse exports?
            </h3>
            <p className="text-gray-400">
              Pixelverse exports standard PNG files with transparency, which work with any game engine: 
              Unity, Unreal, Godot, GameMaker, RPG Maker, Phaser, and more. Sprite sheets are exported 
              in industry-standard formats.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Create Your Game Assets?
        </h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Join thousands of indie developers using AI to accelerate their game development.
        </p>
        <Link
          to="/editor"
          className="inline-block px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
        >
          Start Creating Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🎮</span>
              <span className="font-semibold">Pixelverse.cloud</span>
              <span className="text-gray-500 text-sm">— AI Sprite Generator</span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Pixelverse. Free AI sprite generation for game developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
