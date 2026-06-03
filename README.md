# MatchGaming

Plataforma de matchmaking social para jogadores de **League of Legends**. Encontre um parceiro compatível pelo elo, entre na fila, aceite o match e jogue junto — tudo dentro da plataforma.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Estilização | Tailwind CSS 3 + shadcn/ui |
| Animações | Framer Motion 11 |
| Roteamento | React Router DOM 6 |
| Estado servidor | TanStack Query v5 |
| Backend | Supabase (Auth, Database, Realtime, Edge Functions) |
| Formulários | React Hook Form + Zod |
| Testes | Vitest + Playwright |

---

## Pré-requisitos

- Node.js 18+ (ou Bun)
- Conta e projeto no [Supabase](https://supabase.com)

---

## Configuração

Clone o repositório e instale as dependências:

```bash
git clone <repo-url>
cd game-wingman-buddy
npm install
```

Crie o arquivo `.env` na raiz com as credenciais do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<sua-anon-key>
VITE_SUPABASE_PROJECT_ID=<seu-project-id>
```

---

## Desenvolvimento

```bash
npm run dev       # servidor em http://localhost:5173
npm run build     # build de produção
npm run preview   # preview do build
npm run lint      # ESLint
npm run test      # testes unitários (Vitest)
npm run test:watch
npx playwright test   # testes e2e
```

---

## Funcionalidades

- **Matchmaking** — fila por modo (Normal, ARAM, Solo/Duo, Flex) com compatibilidade de elo e função. Fase estrita (30s) e expandida com fallback automático.
- **Chat em tempo real** — conversa criada automaticamente após match aceito via Supabase Realtime.
- **Integração Riot API** — rank, histórico de partidas, campeões e maestria via Edge Function.
- **Sistema de amigos** — pedidos, lista com status online/offline, exclusão da fila de matchmaking.
- **Perfil completo** — Riot ID vinculado, elo manual ou via API, avatar, Discord tag.
- **Configurações** — tema claro/escuro, sons, preferências de função, lista de bloqueados, exportação e exclusão de conta.
- **Controle de sessão** — detecção de sessão simultânea com modal de takeover.

---

## Estrutura do Projeto

```
src/
├── design-system/
│   └── tokens/          # Fonte única de verdade para cores, tipografia, animações e efeitos
├── components/          # Componentes reutilizáveis
│   └── ui/              # Primitivos shadcn/ui
├── contexts/            # AuthContext, ThemeContext
├── hooks/               # useMatchmaking, useChat, useFriendRequests, useOnlineStatus
├── integrations/
│   └── supabase/        # Client e tipos gerados
├── lib/                 # eloUtils, soundUtils, utils
└── pages/               # Index, Auth, Matchmaking, Chat, Profile, Settings
```

---

## Design System

Os tokens do DS ficam em `src/design-system/tokens/` e são a fonte de verdade para todo o projeto:

```ts
import { motionConfig, zIndex, tierColorValues } from '@/design-system/tokens'
```

O `tailwind.config.ts` importa os tokens diretamente, expondo utilities como `text-tier-gold`, `bg-status-online`, `text-warning`, `z-modal`, entre outras.

---

## Documentação

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — visão de produto, funcionalidades e fluxos de usuário
- [`docs/TECHNICAL.md`](docs/TECHNICAL.md) — arquitetura, banco de dados, hooks e integrações

---

## Licença

Privado. Todos os direitos reservados.
