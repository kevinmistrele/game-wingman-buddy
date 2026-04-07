

# Plano: Limpar mensagens ao excluir amigo, redirecionamento bidirecional, ícones maiores

## 1. Limpar mensagens ao excluir amigo (para ambos os jogadores)

**Arquivo:** `src/hooks/useChat.ts` - função `removeFriend`

Ao remover um amigo, em vez de apenas ocultar conversas (`hidden_by`), deletar permanentemente:
1. Todas as mensagens das conversas entre os dois jogadores (`DELETE FROM messages WHERE conversation_id = <id>`)
2. A conversa em si (`DELETE FROM conversations WHERE id = <id>`)

Isso limpa o histórico para ambos (pessoa A e pessoa B), já que os dados são removidos do banco. Se se reencontrarem ou re-adicionarem, começam do zero.

Mesmo tratamento no `blockUser`: deletar mensagens e conversas ao bloquear.

## 2. Redirecionamento bidirecional após match aceito

**Arquivo:** `src/hooks/useMatchmaking.ts`
- Adicionar estado `acceptedConvoId: string | null`
- No realtime listener, quando `match.status === "accepted"`, buscar/criar a conversa e setar `acceptedConvoId`
- Expor `acceptedConvoId` no retorno do hook

**Arquivo:** `src/components/MatchmakingQueue.tsx`
- Observar `acceptedConvoId` via `useEffect`; quando populado, navegar para `/chat?convo=<id>`
- Isso garante que ambos os jogadores (quem aceita primeiro e quem aceita depois) são redirecionados

## 3. Notificação em tempo real quando o outro jogador aceita

**Arquivo:** `src/hooks/useMatchmaking.ts`
- No listener realtime, ao detectar que o oponente aceitou (`otherStatus === "accepted"` mas match ainda `pending`), setar `otherAccepted = true` e tocar som
- Já parcialmente implementado; garantir que funciona corretamente para UPDATE events

## 4. Ícones maiores

**Arquivo:** `src/components/FriendsSidebar.tsx`
- Avatares: `h-10 w-10` para `h-12 w-12`, texto de iniciais de `text-sm` para `text-base`
- Ícones de ação (Eye, MessageCircle, ShieldBan, UserMinus): `h-3.5 w-3.5` para `h-5 w-5`
- Ícones das abas: `h-3.5 w-3.5` para `h-4 w-4`
- Botões aceitar/recusar pedidos: `h-4 w-4` para `h-5 w-5`

**Arquivo:** `src/components/ChatPanel.tsx`
- Avatar no header: `h-10 w-10` para `h-12 w-12`
- Ícones Discord, UserPlus, Clock, ShieldBan: `h-4 w-4` para `h-5 w-5`

## Arquivos modificados
- `src/hooks/useChat.ts` — deletar mensagens/conversas ao remover amigo ou bloquear
- `src/hooks/useMatchmaking.ts` — novo estado `acceptedConvoId`, redirecionamento bidirecional
- `src/components/MatchmakingQueue.tsx` — useEffect para navegar quando `acceptedConvoId` populado
- `src/components/FriendsSidebar.tsx` — ícones e avatares maiores
- `src/components/ChatPanel.tsx` — ícones e avatar maiores

