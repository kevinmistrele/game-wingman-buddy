

# Plano: Status Online + Fix abas cortadas na sidebar

## 1. Status Online dos usuários

### Database
- Adicionar coluna `last_seen` (timestamp with time zone, default now()) na tabela `profiles`
- Usuário é considerado "online" se `last_seen` foi há menos de 2 minutos

### Heartbeat (`src/hooks/useOnlineStatus.ts`)
- Novo hook que atualiza `profiles.last_seen = now()` a cada 60 segundos via `setInterval`
- Chamado uma vez no `App.tsx` para usuários autenticados

### Indicador visual
- Bolinha verde (online) ou cinza (offline) no avatar em:
  - `FriendsSidebar.tsx` — nas abas Conversas, Amigos e Pedidos
  - `ChatPanel.tsx` — no header do chat ativo
- Lógica: comparar `profile.last_seen` com `Date.now() - 2min`

### Fetch do last_seen
- Os perfis já são carregados no `useChat` — basta incluir `last_seen` (já vem no `select("*")`)
- Adicionar polling a cada 60s no `useChat.fetchFriends` para atualizar o status sem depender de realtime

## 2. Fix abas cortadas com badge de notificação

### Problema
As abas usam `flex-1` com conteúdo variável. Quando o badge aparece, o texto + ícone + badge estouram o espaço.

### Solução (`src/components/FriendsSidebar.tsx`)
- Esconder o texto das abas e mostrar apenas ícone + badge em telas pequenas (`hidden sm:inline`)
- Usar `min-w-0` e `overflow-hidden` no container das abas
- Badge: reduzir padding e usar tamanho fixo mínimo
- Garantir `whitespace-nowrap` e `truncate` no texto da aba

## Arquivos modificados
- **Migration SQL** — adicionar `last_seen` em `profiles`
- `src/hooks/useOnlineStatus.ts` — novo hook de heartbeat
- `src/App.tsx` — usar o hook
- `src/components/FriendsSidebar.tsx` — indicador online + fix tabs
- `src/components/ChatPanel.tsx` — indicador online no header
- `src/hooks/useChat.ts` — polling de friends a cada 60s

