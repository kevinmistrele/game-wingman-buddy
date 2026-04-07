

# Plano: Atualização em tempo real após aceitar solicitação / auto-aceite mútuo

## Problema raiz

O `Chat.tsx` usa dois hooks separados: `useChat` (gerencia `friends`, `conversations`) e `useFriendRequests` (gerencia solicitações). Quando uma solicitação é aceita via `useFriendRequests.acceptRequest`, o hook `useChat` não sabe que uma nova friendship/conversa foi criada — então o botão "Adicionar" continua visível e o amigo não aparece na lista.

## Solução

### 1. Adicionar realtime listener para friendships no `useChat`

**Arquivo:** `src/hooks/useChat.ts`

Adicionar um `useEffect` com listener realtime na tabela `friendships` (INSERT e DELETE), chamando `fetchFriends()` e `fetchConversations()` automaticamente quando houver mudanças. Isso resolve todos os cenários:
- Aceitar solicitação na aba "Pedidos" → friendship criada → lista de amigos atualiza → botão "Adicionar" some
- Auto-aceite mútuo → mesma coisa
- Remover amigo do outro lado → lista atualiza

### 2. Chamar refresh explícito após aceitar request no Chat.tsx

**Arquivo:** `src/pages/Chat.tsx`

No `handleAcceptRequest`, após `acceptRequest`, chamar também `refreshFriends` e `refreshConversations` do `useChat` para atualização imediata (sem depender apenas do realtime que pode ter delay).

Extrair `refreshFriends` e `refreshConversations` do `useChat` (já expõe `refreshConversations` e `refreshFriends` — verificar se `refreshFriends` está exposto, caso contrário expor).

### 3. Refresh após auto-aceite mútuo no useFriendRequests

**Arquivo:** `src/hooks/useFriendRequests.ts`

O `sendRequest` já faz o auto-aceite, mas o `useChat` não sabe. Com o listener realtime do passo 1, isso será resolvido automaticamente. Mas para resposta imediata, o `sendRequest` pode retornar um indicador de que houve auto-aceite, para o `Chat.tsx` forçar refresh.

Alternativa mais simples: o realtime listener já resolve. Garantir que o listener também escuta a tabela `conversations`.

## Arquivos modificados
- `src/hooks/useChat.ts` — listener realtime em `friendships` + expor `refreshFriends`
- `src/pages/Chat.tsx` — chamar `refreshFriends`/`refreshConversations` após aceitar request

