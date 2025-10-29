# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude AI to generate React components based on natural language descriptions, displays them in real-time in a virtual file system (no files written to disk), and allows users to iterate with the AI to refine their components.

## Tech Stack

- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Prisma with SQLite
- **AI**: Anthropic Claude AI via Vercel AI SDK (@ai-sdk/anthropic)
- **Testing**: Vitest with React Testing Library
- **Editor**: Monaco Editor for code editing

## Development Commands

### Setup
```bash
npm run setup          # Install deps, generate Prisma client, run migrations
```

### Development
```bash
npm run dev           # Start dev server with Turbopack on http://localhost:3000
npm run dev:daemon    # Start dev server in background, logs to logs.txt
```

### Build & Run
```bash
npm run build         # Build for production
npm start            # Start production server
```

### Testing
```bash
npm test             # Run all tests with Vitest
```

### Linting
```bash
npm run lint         # Run ESLint
```

### Database
```bash
npx prisma generate   # Regenerate Prisma client
npx prisma migrate dev # Run migrations
npm run db:reset     # Reset database (force)
```

## Architecture

### Virtual File System (VFS)

The core innovation is the `VirtualFileSystem` class (`src/lib/file-system.ts`), which maintains an in-memory file tree. It provides:
- File/directory creation, deletion, renaming
- Path normalization and traversal
- Serialization/deserialization for persistence
- File content viewing and editing

The VFS is managed via React Context (`FileSystemProvider` in `src/lib/contexts/file-system-context.tsx`) and shared across the preview and editor components.

### AI Integration

The chat API endpoint (`src/app/api/chat/route.ts`) orchestrates the AI generation flow:
1. Receives messages and current VFS state from the client
2. Reconstructs the VFS from serialized data
3. Calls Claude via `streamText` with two custom tools:
   - `str_replace_editor`: View, create, and edit files (supports view, create, str_replace, insert commands)
   - `file_manager`: Rename, delete, and move files/folders
4. Streams responses back to the client
5. Persists messages and VFS state to the database for authenticated users

**Mock Mode**: When `ANTHROPIC_API_KEY` is not set, the app uses a `MockLanguageModel` (in `src/lib/provider.ts`) that returns static component code instead of calling the Claude API. This allows development without an API key.

### Component Structure

The main UI (`src/app/main-content.tsx`) uses a resizable 3-panel layout:
1. **Left Panel**: Chat interface for conversing with Claude
2. **Middle Panel**: Tabbed view toggling between:
   - **Preview**: Live iframe rendering generated components
   - **Code**: File tree + Monaco code editor
3. **Right Panel** (implicit in code view): File tree navigation

### Preview Rendering

The `PreviewFrame` component (`src/components/preview/PreviewFrame.tsx`):
1. Watches for VFS changes via `refreshTrigger` from the FileSystemContext
2. Transforms JSX/TSX files using Babel standalone (`src/lib/transform/jsx-transformer.ts`)
3. Creates an import map for ES modules (React, ReactDOM, etc.)
4. Injects transformed code into an iframe with an HTML document
5. Handles errors and displays them in the preview

Entry point detection looks for: `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx`, or `/src/App.jsx`.

### Database Schema

Two main models (Prisma schema in `prisma/schema.prisma`):
- **User**: email, password (hashed with bcrypt), relations to projects
- **Project**: name, userId (nullable for anonymous users), messages (JSON), data (serialized VFS), timestamps

Prisma client is generated to `src/generated/prisma` (custom output path).

### Authentication

JWT-based auth using `jose` library:
- Auth actions in `src/actions/` (login, register, logout)
- Session middleware in `src/middleware.ts`
- `getSession()` helper in `src/lib/auth.ts` for server-side session access
- Anonymous users can create projects, but they're not persisted

### AI Generation Prompt

The system prompt (`src/lib/prompts/generation.tsx`) instructs Claude to:
- Create React components using Tailwind CSS (no hardcoded styles)
- Use `/App.jsx` as the entry point (every project must have this)
- Import local files with `@/` alias (e.g., `@/components/Calculator`)
- Operate on a virtual root filesystem (`/`)
- Keep responses brief unless asked to elaborate

## Path Aliases

TypeScript is configured with `@/*` pointing to `src/*` (see `tsconfig.json`). Use this alias consistently in imports.

## Testing

- Vitest config in `vitest.config.mts` uses `jsdom` environment
- Test files located in `__tests__` directories alongside components
- Uses React Testing Library for component testing

## Key Files to Know

- `src/lib/file-system.ts`: VFS implementation
- `src/app/api/chat/route.ts`: AI chat endpoint
- `src/lib/provider.ts`: Language model provider (real + mock)
- `src/lib/transform/jsx-transformer.ts`: JSX/TSX to browser-executable code
- `src/components/preview/PreviewFrame.tsx`: Live preview rendering
- `src/lib/contexts/file-system-context.tsx`: VFS React Context
- `src/lib/contexts/chat-context.tsx`: Chat state management
- make sure to use minimal tokens. This is simply a follow along project while learning calude code from anthropic academy