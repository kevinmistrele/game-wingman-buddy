

# Plano: Correção de bugs + Sistema de Bloqueio e Solicitações de Amizade

## Problemas identificados

### Bug 1: Conversas ocultas reaparecem
A tabela `conversations` **não tem política RLS para UPDATE**. As chamadas `.update({ hidden_by })` falham silenciosamente. Por isso, ao sair e voltar, as conversas "excluídas" reaparecem.

### Bug 2: Não consegue re-encontrar jogador removido
Em `joinQueue`, o código exclui do matchmaking todos os usuários que têm conversa existente (mesmo ocultas). Precisa filtrar apenas amigos atuais, não conversas antigas.

---

## Mudanças

### 1. Migration: Novas tabelas e políticas RLS

**Adicionar UPDATE policy na tabela `conversations`:**
- Permitir que participantes atualizem suas conversas (necessário para `hidden_by`)

**Nova tabela `friend_requests`:**
- `id`, `sender_id`, `receiver_id`, `status` (pending/accepted/declined), `created_at`
- RLS: sender pode inserir e ver, receiver pode ver e atualizar (aceitar/recusar)
- Realtime habilitado para notificações

**Nova tabela `blocked_users`:**
- `id`, `blocker_id`, `blocked_id`, `created_at`
- RLS: blocker pode inserir, deletar e ver seus bloqueios

### 2. Hook `useFriendRequests.ts` (novo)
- Busca solicitações pendentes recebidas e enviadas
- Envia solicitação (com verificação de limite de 50 pendentes no receiver)
- Aceita solicitação (cria friendship + conversa)
- Recusa solicitação
- Realtime: listener na tabela `friend_requests` para notificações instantâneas (toast ao receber)

### 3. Hook `useChat.ts` — correções
- `removeFriend`: remover `as any` casts desnecessários (hidden_by já está tipado)
- `deleteConversation`: igual, agora funciona porque teremos a policy de UPDATE

### 4. Hook `useMatchmaking.ts` — correção re-match
- Na `joinQueue`, alterar `excludedUserIds` para excluir apenas amigos atuais e jogadores bloqueados, **não** conversas existentes
- Adicionar verificação de bloqueio (excluir bloqueados/bloqueadores)

### 5. Sidebar `FriendsSidebar.tsx` — nova aba "Solicitações"
- Adicionar terceira aba: **Conversas | Amigos | Solicitações**
- Na aba Solicitações: lista de pedidos recebidos com botões Aceitar/Recusar
- Badge de contagem de solicitações pendentes na aba
- Na aba Amigos: adicionar botão de **Bloquear** (ícone shield/ban) ao lado do botão remover

### 6. `ChatPanel.tsx` — botão "Adicionar Amigo"
- Ao lado do botão Discord no header do chat, adicionar botão "Adicionar Amigo" (ícone UserPlus)
- Só aparece se o outro usuário **não é** amigo e **não tem** solicitação pendente
- Ao clicar, envia friend request
- Se já tem solicitação pendente, mostrar status "Solicitação enviada"

### 7. `useMatchmaking.ts` — remover auto-friendship no match
- Em `respondToMatch`, ao aceitar match: **não** criar friendship automaticamente
- Manter a criação da conversa para que possam conversar
- A amizade agora só é criada via solicitação manual

### 8. Bloqueio de jogadores
- `useChat.ts`: nova função `blockUser(userId)` que insere na tabela `blocked_users` e remove friendship + oculta conversas
- Na sidebar (amigos): botão bloquear com confirmação
- No chat header: opção de bloquear via dropdown/botão
- Usuários bloqueados não aparecem no matchmaking e não podem enviar solicitações

---

## Arquivos modificados
- **Migration SQL** — UPDATE policy em conversations, tabelas `friend_requests` e `blocked_users`
- `src/hooks/useFriendRequests.ts` — novo hook
- `src/hooks/useChat.ts` — correção do update + bloqueio
- `src/hooks/useMatchmaking.ts` — filtro de re-match + bloqueio
- `src/components/FriendsSidebar.tsx` — aba solicitações + botão bloquear
- `src/components/ChatPanel.tsx` — botão adicionar amigo
- `src/pages/Chat.tsx` — integrar novo hook

