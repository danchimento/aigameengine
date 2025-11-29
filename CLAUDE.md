# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Game Engine is a text-based interactive game powered by OpenAI's GPT-4 Turbo. The game uses a configurable system prompt composed of engine rules and scenario definitions to create dynamic, AI-driven gameplay experiences.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Core Game Loop

1. **Client** (app/page.tsx): React client component manages user input, conversation history, and displays AI responses
2. **API Route** (app/api/game/route.ts): Server-side Next.js API route that orchestrates game logic
3. **OpenAI Integration**: Sends conversation history with dynamically built system prompt to GPT-4 Turbo

### System Prompt Composition

The game's behavior is controlled by two markdown files at the project root:

- **engine-rules.md**: Defines how the game engine behaves, rules, constraints, and mechanics
- **scenario.md**: Defines the game scenario, setting, characters, and story context

These files are read by the API route on each request and concatenated to form the system prompt sent to OpenAI.

### Data Flow

1. User submits command via textarea in app/page.tsx
2. Client maintains full conversation history (array of Message objects with role: 'user' | 'assistant')
3. POST request sent to /api/game with entire conversation history
4. API route reads engine-rules.md and scenario.md from filesystem
5. System prompt built: `${engineRules}\n\n${scenario}`
6. Full message array sent to OpenAI: [system prompt, ...conversation history]
7. AI response returned and displayed; full history maintained but only latest response shown

### State Management

- Conversation history maintained client-side in React state (app/page.tsx:13)
- Each message typed as: `{ role: 'user' | 'assistant', content: string }`
- No persistence layer - conversation resets on page refresh

## Environment Configuration

Required environment variable in `.env.local`:
```
OPENAI_API_KEY=your_api_key_here
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: OpenAI SDK (GPT-4 Turbo model)
- **Runtime**: Node.js for API routes

## Key Implementation Details

- Client component uses 'use client' directive (app/page.tsx:1)
- API route uses Node.js fs module to read markdown files synchronously
- Path resolution uses process.cwd() to ensure files are read from project root
- Model hardcoded to 'gpt-4-turbo' in app/api/game/route.ts:26
- TypeScript strict mode enabled in tsconfig.json
