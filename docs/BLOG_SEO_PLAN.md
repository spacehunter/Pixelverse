# Pixelverse Blog & SEO Integration Plan

## Executive Summary

This plan outlines a modular, SEO-optimized blog system for Pixelverse that:
- Lives separately from the main React app (no interference)
- Uses AI (Groq) to generate short, engaging blog posts about new features
- Generates relevant images using Replicate's AI models
- Runs via bash script for easy content creation
- Implements comprehensive SEO best practices

---

## Architecture Overview

```
/Pixelverse
├── /src                     # Main React app (unchanged)
├── /blog                    # NEW: Blog system (separate)
│   ├── /content
│   │   └── /posts           # Markdown blog posts
│   │       └── *.md
│   ├── /public
│   │   └── /images          # Generated blog images
│   │       └── /posts
│   ├── /templates           # HTML templates
│   ├── /scripts             # Build scripts
│   ├── /dist                # Built static blog
│   └── blog.json            # Blog index/metadata
├── /scripts                 # NEW: Automation scripts
│   ├── generate-blog-post.sh
│   ├── generate-blog-image.sh
│   └── publish-blog.sh
└── /dist                    # Main app build output
    └── /blog                # Blog deployed as subdirectory
```

### Why This Architecture?

1. **Separation of Concerns**: Blog is 100% separate from the React SPA
2. **No Build Conflicts**: Different build processes, no interference
3. **SEO-Friendly**: Static HTML pages crawlable by search engines
4. **Scalable**: Easy to add posts without touching main app
5. **Version Controlled**: All content in Git for history tracking

---

## Component 1: Blog System (Static Site Generator)

### Technology Choice: Lightweight Custom SSG

Rather than adding heavy dependencies, we'll use a lightweight approach:
- **Content**: Markdown files with YAML frontmatter
- **Build**: Node.js script to convert MD to HTML
- **Styling**: Tailwind CSS (already in project)
- **Output**: Static HTML files

### Blog Post Structure

```markdown
---
title: "New Selection Tool Makes Editing a Breeze"
slug: selection-tool-release
date: 2024-01-15
author: Pixelverse Team
tags: [feature, tools, editing]
image: /blog/images/posts/selection-tool-hero.png
description: "Copy, paste, and move pixel selections with our new powerful selection tool."
featured: true
---

The latest Pixelverse update brings a game-changing selection tool...
```

### Blog Index (blog.json)

```json
{
  "posts": [
    {
      "slug": "selection-tool-release",
      "title": "New Selection Tool Makes Editing a Breeze",
      "date": "2024-01-15",
      "description": "Copy, paste, and move pixel selections...",
      "image": "/blog/images/posts/selection-tool-hero.png",
      "tags": ["feature", "tools"],
      "readTime": "2 min"
    }
  ],
  "totalPosts": 1,
  "lastUpdated": "2024-01-15T10:00:00Z"
}
```

---

## Component 2: AI Blog Post Generation

### Bash Script: `generate-blog-post.sh`

```bash
#!/bin/bash
# Usage: ./scripts/generate-blog-post.sh "feature-name" "brief description"

FEATURE_NAME="$1"
DESCRIPTION="$2"
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
```

### AI Content Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    BLOG GENERATION PIPELINE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. INPUT: Feature name + description                        │
│     ↓                                                        │
│  2. GROQ API: Generate blog content                          │
│     - Title (catchy, SEO-friendly)                           │
│     - Meta description (150-160 chars)                       │
│     - Body content (300-500 words)                           │
│     - Tags (3-5 relevant tags)                               │
│     ↓                                                        │
│  3. REPLICATE API: Generate hero image                       │
│     - Pixel art style matching app aesthetic                 │
│     - Feature-relevant imagery                               │
│     ↓                                                        │
│  4. OUTPUT: Markdown file + image saved                      │
│     ↓                                                        │
│  5. UPDATE: blog.json index updated                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Groq Prompt Template for Blog Posts

```javascript
const BLOG_SYSTEM_PROMPT = `You are a tech blogger for Pixelverse, an AI-powered pixel art sprite editor.
Write SHORT, ENGAGING blog posts about new features.

Style Guidelines:
- Conversational but professional tone
- 300-500 words maximum
- Focus on user benefits, not technical details
- Include a clear call-to-action
- Use short paragraphs (2-3 sentences max)
- Add 2-3 subheadings for scannability

SEO Guidelines:
- Title: 50-60 characters, include primary keyword
- Meta description: 150-160 characters
- Naturally include keywords 2-3 times
- Start with a hook that addresses user pain points`;
```

---

## Component 3: Image Generation

### Image Generation Script

Uses Replicate's Retro Diffusion model (already integrated in project):

```bash
#!/bin/bash
# generate-blog-image.sh

PROMPT="$1"
OUTPUT_PATH="$2"

# Generate pixel art style image for blog
curl -X POST "https://api.replicate.com/v1/predictions" \
  -H "Authorization: Token $REPLICATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "rd-fast",
    "input": {
      "prompt": "'"$PROMPT"', pixel art style, game asset, clean edges",
      "style": "pixel_art",
      "width": 512,
      "height": 256
    }
  }'
```

### Image Optimization Pipeline

1. Generate via Replicate (512x256 for blog headers)
2. Compress with ImageMagick/Sharp
3. Generate WebP version for modern browsers
4. Create social media preview sizes (1200x630 for OG images)

---

## Component 4: SEO Strategy

### On-Page SEO Elements

```html
<!-- Per-page SEO in blog HTML template -->
<head>
  <!-- Primary Meta Tags -->
  <title>{post.title} | Pixelverse Blog</title>
  <meta name="title" content="{post.title} | Pixelverse Blog">
  <meta name="description" content="{post.description}">
  <meta name="keywords" content="{post.tags.join(', ')}, pixel art, sprite editor">
  <link rel="canonical" href="https://pixelverse.app/blog/{post.slug}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://pixelverse.app/blog/{post.slug}">
  <meta property="og:title" content="{post.title}">
  <meta property="og:description" content="{post.description}">
  <meta property="og:image" content="https://pixelverse.app{post.image}">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://pixelverse.app/blog/{post.slug}">
  <meta property="twitter:title" content="{post.title}">
  <meta property="twitter:description" content="{post.description}">
  <meta property="twitter:image" content="https://pixelverse.app{post.image}">

  <!-- Article-specific -->
  <meta property="article:published_time" content="{post.date}">
  <meta property="article:author" content="Pixelverse Team">
  <meta property="article:tag" content="{post.tags}">
</head>
```

### Schema.org Structured Data

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{post.title}",
  "image": "{post.image}",
  "datePublished": "{post.date}",
  "dateModified": "{post.date}",
  "author": {
    "@type": "Organization",
    "name": "Pixelverse"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Pixelverse",
    "logo": {
      "@type": "ImageObject",
      "url": "https://pixelverse.app/logo.png"
    }
  },
  "description": "{post.description}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://pixelverse.app/blog/{post.slug}"
  }
}
</script>
```

### Technical SEO Files

#### sitemap.xml (Auto-generated)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pixelverse.app/</loc>
    <lastmod>2024-01-15</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://pixelverse.app/blog/</loc>
    <lastmod>2024-01-15</lastmod>
    <priority>0.8</priority>
  </url>
  <!-- Auto-generated blog post entries -->
  <url>
    <loc>https://pixelverse.app/blog/selection-tool-release</loc>
    <lastmod>2024-01-15</lastmod>
    <priority>0.6</priority>
  </url>
</urlset>
```

#### robots.txt

```
User-agent: *
Allow: /
Allow: /blog/

Sitemap: https://pixelverse.app/sitemap.xml
```

---

## Component 5: File Structure Details

### Blog Directory Structure

```
/blog
├── content/
│   └── posts/
│       ├── 2024-01-15-selection-tool.md
│       ├── 2024-01-10-ai-generation.md
│       └── ...
├── public/
│   └── images/
│       └── posts/
│           ├── selection-tool-hero.png
│           ├── selection-tool-hero.webp
│           └── ...
├── templates/
│   ├── base.html           # Base layout
│   ├── post.html           # Single post template
│   ├── index.html          # Blog listing template
│   └── partials/
│       ├── header.html
│       ├── footer.html
│       └── seo-head.html
├── scripts/
│   ├── build.js            # Build static HTML
│   ├── generate-sitemap.js # Generate sitemap
│   └── utils.js            # Helper functions
├── styles/
│   └── blog.css            # Blog-specific styles
├── blog.json               # Blog index
└── package.json            # Blog dependencies (minimal)
```

---

## Component 6: Scripts

### Main Generation Script: `scripts/generate-blog-post.sh`

```bash
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required environment variables
if [ -z "$GROQ_API_KEY" ]; then
    echo -e "${RED}Error: GROQ_API_KEY not set${NC}"
    exit 1
fi

if [ -z "$REPLICATE_API_TOKEN" ]; then
    echo -e "${RED}Error: REPLICATE_API_TOKEN not set${NC}"
    exit 1
fi

# Parse arguments
FEATURE_NAME="$1"
FEATURE_DESC="$2"

if [ -z "$FEATURE_NAME" ] || [ -z "$FEATURE_DESC" ]; then
    echo "Usage: ./scripts/generate-blog-post.sh \"Feature Name\" \"Brief description of the feature\""
    exit 1
fi

DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')
POST_FILE="blog/content/posts/${DATE}-${SLUG}.md"
IMAGE_FILE="blog/public/images/posts/${SLUG}-hero.png"

echo -e "${YELLOW}Generating blog post for: ${FEATURE_NAME}${NC}"

# Step 1: Generate blog content with Groq
echo -e "${YELLOW}Step 1/4: Generating content with AI...${NC}"
BLOG_CONTENT=$(node scripts/lib/generate-content.js "$FEATURE_NAME" "$FEATURE_DESC")

# Step 2: Generate hero image with Replicate
echo -e "${YELLOW}Step 2/4: Generating hero image...${NC}"
node scripts/lib/generate-image.js "$FEATURE_NAME" "$IMAGE_FILE"

# Step 3: Create markdown file
echo -e "${YELLOW}Step 3/4: Creating markdown file...${NC}"
echo "$BLOG_CONTENT" > "$POST_FILE"

# Step 4: Update blog index
echo -e "${YELLOW}Step 4/4: Updating blog index...${NC}"
node scripts/lib/update-index.js "$POST_FILE"

echo -e "${GREEN}Blog post generated successfully!${NC}"
echo -e "Post: $POST_FILE"
echo -e "Image: $IMAGE_FILE"
echo -e "\nNext steps:"
echo -e "  1. Review the generated content"
echo -e "  2. Run 'npm run blog:build' to build the blog"
echo -e "  3. Commit and push changes"
```

### Content Generation Script: `scripts/lib/generate-content.js`

```javascript
#!/usr/bin/env node
const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const featureName = process.argv[2];
const featureDesc = process.argv[3];

const systemPrompt = `You are a tech blogger for Pixelverse, an AI-powered pixel art sprite editor.
Write a SHORT, ENGAGING blog post about a new feature.

STRICT Requirements:
- Title: 50-60 characters, catchy, include "Pixelverse" or "pixel art"
- Description: Exactly 150-160 characters for meta description
- Body: 300-400 words MAXIMUM
- Tone: Excited but professional, focus on user benefits
- Include 2-3 short subheadings
- End with a call-to-action
- Generate 3-5 relevant tags

Output Format (YAML frontmatter + markdown body):
---
title: "Your Catchy Title Here"
description: "Your 150-160 character meta description here."
tags: [tag1, tag2, tag3]
---

Your markdown content here...`;

const userPrompt = `Write a blog post about this new Pixelverse feature:

Feature: ${featureName}
Description: ${featureDesc}

Remember: Keep it SHORT (300-400 words max), ENGAGING, and SEO-friendly!`;

// Make API request to Groq
const requestData = JSON.stringify({
  model: 'llama-3.1-8b-instant',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.7,
  max_tokens: 1000
});

const options = {
  hostname: 'api.groq.com',
  path: '/openai/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': requestData.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    const content = response.choices[0].message.content;

    // Add date and other frontmatter
    const date = new Date().toISOString().split('T')[0];
    const slug = featureName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Insert additional frontmatter after the opening ---
    const enhancedContent = content.replace(
      /^---\n/,
      `---\nslug: ${slug}\ndate: ${date}\nauthor: Pixelverse Team\nimage: /blog/images/posts/${slug}-hero.png\nfeatured: false\n`
    );

    console.log(enhancedContent);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});

req.write(requestData);
req.end();
```

---

## Component 7: Build & Deploy

### Blog Build Process

```bash
# In blog/package.json scripts:
{
  "scripts": {
    "build": "node scripts/build.js",
    "generate-sitemap": "node scripts/generate-sitemap.js",
    "dev": "node scripts/dev-server.js"
  }
}
```

### Integration with Main App Build

```json
// In root package.json, add:
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "blog:generate": "./scripts/generate-blog-post.sh",
    "blog:build": "cd blog && npm run build",
    "blog:dev": "cd blog && npm run dev",
    "build:all": "npm run build && npm run blog:build && npm run copy-blog",
    "copy-blog": "cp -r blog/dist dist/blog"
  }
}
```

### Deployment Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STRUCTURE                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  https://pixelverse.app/                                    │
│  ├── index.html          (React SPA)                        │
│  ├── assets/             (Vite bundled assets)              │
│  └── blog/               (Static blog)                      │
│      ├── index.html      (Blog listing)                     │
│      ├── selection-tool/ (Blog post)                        │
│      │   └── index.html                                     │
│      ├── ai-generation/  (Blog post)                        │
│      │   └── index.html                                     │
│      └── images/                                            │
│          └── posts/                                         │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Component 8: SEO Monitoring & Analytics

### Recommended Tools

1. **Google Search Console** - Monitor indexing, search performance
2. **Google Analytics 4** - Track blog traffic, user behavior
3. **Bing Webmaster Tools** - Additional search engine coverage

### Blog Analytics Integration

```html
<!-- In blog template -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create `/blog` directory structure
- [ ] Set up blog build system (Node.js scripts)
- [ ] Create HTML templates with SEO elements
- [ ] Create base styling (Tailwind-based)

### Phase 2: AI Integration (Week 2)
- [ ] Create `generate-blog-post.sh` script
- [ ] Implement Groq content generation
- [ ] Implement Replicate image generation
- [ ] Create blog index updater

### Phase 3: SEO Setup (Week 3)
- [ ] Implement sitemap generation
- [ ] Add robots.txt
- [ ] Add Schema.org structured data
- [ ] Set up canonical URLs

### Phase 4: Deployment (Week 4)
- [ ] Integrate blog build with main build
- [ ] Set up CI/CD for blog
- [ ] Submit sitemap to Google Search Console
- [ ] Create initial blog posts for existing features

---

## Example Usage

### Generating a New Blog Post

```bash
# Set environment variables (or use .env)
export GROQ_API_KEY="your-groq-key"
export REPLICATE_API_TOKEN="your-replicate-token"

# Generate a blog post about a new feature
./scripts/generate-blog-post.sh \
  "Selection Tool" \
  "Copy, paste, and move pixel selections with marching ants preview"

# Output:
# Generating blog post for: Selection Tool
# Step 1/4: Generating content with AI...
# Step 2/4: Generating hero image...
# Step 3/4: Creating markdown file...
# Step 4/4: Updating blog index...
#
# Blog post generated successfully!
# Post: blog/content/posts/2024-01-15-selection-tool.md
# Image: blog/public/images/posts/selection-tool-hero.png
```

### Building the Blog

```bash
# Build just the blog
npm run blog:build

# Build everything (main app + blog)
npm run build:all
```

---

## SEO Content Strategy

### Target Keywords

| Primary Keywords | Secondary Keywords |
|-----------------|-------------------|
| pixel art editor | sprite creator |
| AI sprite generator | pixel art maker |
| pixel art tool | game asset creator |
| sprite animation | retro game graphics |

### Content Calendar Template

| Week | Topic | Target Keyword | Type |
|------|-------|---------------|------|
| 1 | Feature announcement | [feature] + pixel art | News |
| 2 | Tutorial/How-to | how to [action] pixel art | Educational |
| 3 | Tips & tricks | pixel art tips | Value |
| 4 | Showcase/Gallery | pixel art examples | Engagement |

### Blog Post Types

1. **Feature Announcements** - New features, updates
2. **Tutorials** - How to use specific tools
3. **Tips & Tricks** - Quick pixel art tips
4. **Showcases** - User creations, examples
5. **Behind the Scenes** - Development updates

---

## Summary

This plan provides:

1. **Complete Separation** - Blog lives in `/blog`, doesn't touch React app
2. **AI Automation** - Single bash script generates content + images
3. **SEO Optimized** - Proper meta tags, structured data, sitemap
4. **Scalable** - Easy to add posts, maintains index automatically
5. **Lightweight** - No heavy CMS, just markdown + static HTML
6. **Version Controlled** - All content in Git

The system is designed to grow with Pixelverse while maintaining the simplicity and performance of the main application.
