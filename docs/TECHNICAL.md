# Game Wingman Buddy — Documentação Técnica

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Estilização | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| Animações | Framer Motion 11 |
| Roteamento | React Router DOM 6 |
| Estado servidor | TanStack Query v5 |
| Backend / BaaS | Supabase (Auth, Database, Realtime, Edge Functions) |
| Formulários | React Hook Form + Zod |
| Testes unitários | Vitest + Testing Library |
| Testes E2E | Playwright |
| Charts | Recharts |
| Linting | ESLint 9 + typescript-eslint |

---

## Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+ ou Bun
- Uma instância Supabase configurada

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz com:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<sua-anon-key>
```

### Instalação e Dev

```bash
npm install       # ou bun install
npm run dev       # servidor de desenvolvimento em http://localhost:5173
```

### Build

```bash
npm run build     # build de produção
npm run preview   # preview do build
```

### Testes

```bash
npm run test          # vitest (unitários)
npm run test:watch    # modo watch
npx playwright test   # testes e2e
```

---

## Estrutura de Diretórios

```
src/
├── assets/              # Imagens estáticas (logo, heroes)
├── components/          # Componentes React reutilizáveis
│   ├── profile/         # Abas do perfil (Overview, Stats, Champions, Matches)
│   └── ui/              # Componentes shadcn/ui (Radix primitives)
├── contexts/            # React Contexts globais
│   ├── AuthContext.tsx  # Sessão, perfil e onboarding
│   └── ThemeContext.tsx # Tema claro/escuro
├── hooks/               # Custom hooks de lógica de negócio
├── integrations/
│   └── supabase/        # Cliente Supabase e tipos gerados
├── lib/                 # Utilitários puros
│   ├── eloUtils.ts      # Sistema de elo e regras de matchmaking
│   ├── soundUtils.ts    # Controle de sons do sistema
│   └── utils.ts         # Helpers gerais (cn, etc.)
├── pages/               # Telas roteadas
└── test/                # Setup de testes
```

---

## Arquitetura

### Padrão de dados

A aplicação usa Supabase como backend completo. Não há servidor próprio — toda a lógica de servidor fica em Edge Functions no Supabase. O cliente consome a API REST do Supabase diretamente via `@supabase/supabase-js`, com os tipos TypeScript gerados automaticamente em `src/integrations/supabase/types.ts`.

### Fluxo de autenticação

O `AuthContext` encapsula toda a lógica de sessão:

1. Na inicialização, obtém a sessão via `supabase.auth.getSession()`
2. Assina `onAuthStateChange` para reagir a login/logout
3. Ao detectar um usuário autenticado, busca o perfil correspondente na tabela `profiles`
4. Detecta se o usuário precisa de onboarding (OAuth sem username personalizado)
5. Gerencia sessão simultânea: compara `active_session_id` do perfil com o ID salvo no `localStorage`; se houver conflito, apresenta modal de takeover

```
AuthProvider
  └── fetchProfile(userId) → profiles table
  └── claimSession(userId) → detecta conflito de sessão ativa
  └── checkOnboarding(user, profile) → flag needsOnboarding
```

### Rotas e proteção

```
/              → Index (landing + dashboard)
/auth          → Login/Cadastro
/verify-email  → Confirmação de email
/matchmaking   → ProtectedRoute → Matchmaking
/chat          → ProtectedRoute → Chat
/profile       → ProtectedRoute → Perfil
/settings      → ProtectedRoute → Configurações
*              → NotFound
```

`ProtectedRoute` redireciona para `/` se não houver usuário autenticado. O `OnboardingGuard` injeta o modal de onboarding quando `needsOnboarding` é `true`, independente da rota.

---

## Banco de Dados (Supabase)

### Tabelas

**`profiles`**
Perfil público de cada usuário. Criado automaticamente via trigger no cadastro.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | ID interno do perfil |
| `user_id` | uuid | FK para `auth.users` |
| `username` | text | Nome de usuário único |
| `avatar_url` | text | URL do avatar |
| `riot_id` | text | Ex: `ShadowKnight#BR1` |
| `rank_tier` | text | Tier manual (GOLD, PLATINUM…) |
| `rank_division` | text | Divisão manual (I, II, III, IV) |
| `rank_source` | text | `riot` ou `manual` |
| `preferred_role` | text | Função preferida |
| `preferred_duo_role` | text | Função desejada no duo |
| `preferred_game` | enum | `lol`, `valorant`, `both` |
| `discord_id` | text | Tag Discord opcional |
| `last_seen` | timestamp | Atualizado a cada 60s (status online) |
| `active_session_id` | uuid | Controle de sessão única |
| `session_started_at` | timestamp | Início da sessão ativa |

**`matchmaking_queue`**
Entradas na fila de matchmaking.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK para `auth.users` |
| `game` | text | Ex: `lol` |
| `mode` | text | `normal`, `aram`, `solo_duo`, `flex` |
| `status` | text | `waiting`, `matched`, `cancelled` |
| `region` | text | Ex: `br1` |
| `my_role` | text | Função do jogador |
| `desired_duo_role` | text | Função desejada no parceiro |
| `created_at` | timestamp | Usado para janela de 2 minutos |

**`matches`**
Matches gerados pelo sistema.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user1_id` | uuid | Jogador 1 |
| `user2_id` | uuid | Jogador 2 |
| `game` | text | Jogo |
| `status` | text | `pending`, `accepted`, `declined`, `expired` |
| `user1_status` | text | `pending`, `accepted`, `declined` |
| `user2_status` | text | `pending`, `accepted`, `declined` |

**`conversations`**
Uma conversa privada entre dois usuários.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user1_id` | uuid | Usuário menor por UUID (sorted) |
| `user2_id` | uuid | Usuário maior por UUID (sorted) |
| `match_id` | uuid | FK opcional para `matches` |
| `hidden_by` | uuid[] | IDs de usuários que ocultaram a conversa |

**`messages`**
Mensagens individuais de uma conversa.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `conversation_id` | uuid | FK para `conversations` |
| `sender_id` | uuid | FK para `auth.users` |
| `content` | text | Conteúdo da mensagem |
| `created_at` | timestamp | |

**`friend_requests`**
Pedidos de amizade entre usuários.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `sender_id` | uuid | |
| `receiver_id` | uuid | |
| `status` | text | `pending`, `accepted`, `declined` |

**`friendships`**
Amizades confirmadas.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user1_id` | uuid | |
| `user2_id` | uuid | |

**`blocked_users`**
Usuários bloqueados.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `blocker_id` | uuid | |
| `blocked_id` | uuid | |

**`user_roles`**
Controle de permissões administrativas.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `role` | enum | `admin`, `moderator`, `user` |

### Enums

- `app_role`: `admin`, `moderator`, `user`
- `preferred_game`: `lol`, `valorant`, `both`

### Funções do Banco

- `delete_user_account()` — deleta a conta do usuário autenticado e todos os dados associados
- `has_role(user_id, role)` — verifica se um usuário possui determinado papel

---

## Hooks Principais

### `useMatchmaking`

Gerencia todo o ciclo de matchmaking: entrar na fila, aguardar match, aceitar/recusar e criar a conversa.

**Estado exposto:**

- `status`: `idle | searching | found`
- `currentMatch`: match ativo
- `matchedPlayer`: perfil e rank do oponente
- `myRank` / `myRankSource`: rank do usuário atual (Riot ou manual)
- `queueCounts`: número de jogadores aguardando por modo
- `otherAccepted`: se o oponente já aceitou o match
- `acceptedConvoId`: ID da conversa criada após ambos aceitarem
- `searchPhase`: `strict | expanded`

**Lógica de matching (`attemptMatch`):**

1. Busca os últimos 20 jogadores na fila no mesmo modo e dentro da janela de 2 minutos
2. Exclui amigos e usuários bloqueados
3. Nos modos ranqueados, valida compatibilidade de elo via `canMatch()`
4. Na fase estrita, valida compatibilidade de funções via `areRolesCompatible()`
5. Tenta inserir um `match` e atualiza o status das entradas na fila para `matched`

**Realtime:** Assina mudanças na tabela `matches` filtradas pelo `user_id`. Também tem polling a cada 2 segundos como fallback para o caso de o evento Realtime não chegar.

**Cleanup:** Usa `beforeunload` com `navigator.sendBeacon` para cancelar a entrada na fila se o usuário fechar a aba.

### `useChat`

Gerencia conversas, amigos e mensagens em tempo real.

- Busca conversas visíveis (não ocultas pelo usuário) enriquecidas com o perfil do outro participante e a última mensagem
- Assina novas mensagens via Supabase Realtime
- Toca som de notificação em novas mensagens de outras conversas

### `useFriendRequests`

Gerencia pedidos de amizade pendentes recebidos e enviados. Assina novos pedidos via Realtime para atualizar a lista em tempo real.

### `useOnlineStatus`

Atualiza o campo `last_seen` do perfil a cada 60 segundos enquanto o usuário está autenticado.

### `useRiotMatches`

Wrapper de TanStack Query em torno da Edge Function `riot-matches`. Busca perfil completo de LoL: summoner, ranked entries, top champions e partidas recentes. Resultado em cache por 5 minutos.

---

## Utilitários de Elo (`eloUtils.ts`)

Implementa as regras oficiais da Riot para matchmaking ranqueado:

- `getRankValue(tier, division)` — converte tier + division em valor numérico comparável
- `canQueueSoloDuo(tier1, div1, tier2, div2)` — valida se dois jogadores podem se duoar em Solo/Duo (exclui altas tier, Diamond só joga com Diamond, demais permitem ±1 tier)
- `canMatch(mode, rank1, rank2)` — wrapper que aplica as regras corretas por modo
- `areRolesCompatible(...)` — verifica se as funções dos dois jogadores são compatíveis (sem conflito de rota e compatibilidade bidirecional)

---

## Edge Function: `riot-matches`

A Supabase Edge Function `riot-matches` é o proxy para a Riot Games API. O frontend não chama a Riot diretamente — toda requisição passa pela Edge Function, que injeta a `RIOT_API_KEY` e formata os dados.

**Parâmetros de query:**

- `action=profile` — retorna perfil completo (summoner, ranked, top champions, partidas recentes)
- `game=lol`
- `riotId=NomeJogador#BR1`
- `region=br1`
- `count=N` — número de partidas recentes

**Fluxo interno:**

1. Resolve `riotId` para PUUID via `account/v1`
2. Busca dados do summoner via `summoner/v4`
3. Busca ranked entries via `league/v4`
4. Busca top champions via `champion-mastery/v4`
5. Busca IDs das partidas recentes via `match/v5` e enriquece cada uma

---

## Realtime

A aplicação usa três canais Realtime do Supabase:

| Canal | Tabela observada | Uso |
|---|---|---|
| `matches-realtime-{userId}` | `matches` | Detectar match encontrado, aceito, recusado |
| `messages-{conversationId}` | `messages` | Novas mensagens na conversa ativa |
| `friend-requests-{userId}` | `friend_requests` | Novos pedidos de amizade |

---

## Sons do Sistema

O módulo `soundUtils.ts` usa a Web Audio API para gerar sons sintéticos (sem arquivos externos):

- `playMatchFoundSound()` — acorde de 3 notas ascendentes ao encontrar um match
- `playMatchAcceptedSound()` — confirmação ao ambos aceitarem
- `playNewMessageSound()` — tique suave em novas mensagens

O usuário pode desativar os sons nas configurações; a preferência é salva no `localStorage`.

---

## Testes

**Unitários (Vitest):** Setup em `src/test/setup.ts` com `@testing-library/jest-dom`. Rodam isolados sem dependência de browser.

**E2E (Playwright):** Configurados em `playwright.config.ts` com `playwright-fixture.ts` para setup de sessão. Cobrem fluxos críticos da aplicação.

---

## Considerações de Performance

- Entradas na fila têm janela ativa de 2 minutos (`QUEUE_ACTIVE_WINDOW_MS`) — entradas mais antigas são ignoradas sem precisar deletá-las
- Dados do perfil Riot são cacheados por TanStack Query com `staleTime` configurado
- O `attemptMatch` usa `useCallback` com dependências mínimas para evitar recriações desnecessárias
- Polling de fallback para aceitação de match (2s) é cancelado imediatamente ao navegar para o chat
- A função de cleanup da fila usa `navigator.sendBeacon` para garantir cancelamento mesmo no `beforeunload`
