# MatchGaming

![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

> Social matchmaking platform for League of Legends players — find a compatible duo by rank, join the queue, accept the match, and play together.

<!-- Add a screenshot or GIF here: ![MatchGaming Preview](docs/images/preview.png) -->

## About

MatchGaming is a full-featured matchmaking platform built with React, Supabase, and the Riot Games API. Users link their Riot account, set preferences (rank, role, game mode), and enter a real-time queue that matches them with compatible players. After a match is accepted, a live chat is created automatically.

## Features

- **Matchmaking queue** — Normal, ARAM, Solo/Duo, and Flex modes with rank and role compatibility. Strict phase (30s) with automatic expanded fallback
- **Real-time chat** — Created automatically after a match is accepted via Supabase Realtime
- **Riot API integration** — Rank, match history, champions, and mastery via Edge Functions
- **Friends system** — Friend requests, online/offline status, match queue exclusions
- **Complete profile** — Riot ID link, manual or API-synced rank, avatar, Discord tag
- **Settings** — Light/dark theme, sound preferences, role preferences, block list, account export and deletion
- **Session control** — Simultaneous session detection with takeover modal

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Animations | Framer Motion 11 |
| Routing | React Router DOM 6 |
| Server state | TanStack Query v5 |
| Backend | Supabase (Auth, Database, Realtime, Edge Functions) |
| Forms | React Hook Form + Zod |
| Unit tests | Vitest + Testing Library |
| E2E tests | Playwright |

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase project

### Installation

```bash
git clone https://github.com/kevinmistrele/game-wingman-buddy.git
cd game-wingman-buddy
npm install
```

### Environment Variables

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

### Running

```bash
npm run dev           # dev server at http://localhost:5173
npm run build         # production build
npm run lint          # ESLint
npm run test          # unit tests (Vitest)
npx playwright test   # e2e tests
```

## Project Structure

```
src/
├── design-system/
│   └── tokens/       # Single source of truth for colors, typography, animations
├── components/       # Reusable components
│   └── ui/           # shadcn/ui primitives
├── contexts/         # AuthContext, ThemeContext
├── hooks/            # useMatchmaking, useChat, useFriendRequests, useOnlineStatus
├── integrations/
│   └── supabase/     # Client and generated types
├── lib/              # eloUtils, soundUtils, utils
└── pages/            # Index, Auth, Matchmaking, Chat, Profile, Settings
```

## Design System

Tokens live in `src/design-system/tokens/` and are the single source of truth for the entire project, consumed directly by `tailwind.config.ts`:

```ts
import { motionConfig, zIndex, tierColorValues } from '@/design-system/tokens'
```

## Documentation

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product vision, features, and user flows
- [`docs/TECHNICAL.md`](docs/TECHNICAL.md) — architecture, database, hooks, and integrations

## Author

Made by [Kevin Mistrele](https://github.com/kevinmistrele)
