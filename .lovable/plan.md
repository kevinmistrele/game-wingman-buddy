

# Plano: Loading States, Remoção de Amigo com Cascata e Melhoria da Sidebar

## 1. Loading no botão "Encontrar Match" (`MatchmakingQueue.tsx`)
- Adicionar estado `joiningQueue` no componente
- Ao clicar em "ENCONTRAR MATCH", mostrar spinner/loading no botão e desabilitá-lo até `joinQueue` resolver
- O botão mostra um `Loader2` animado enquanto a requisição está pendente

## 2. Loading no modal de match encontrado (`MatchmakingQueue.tsx`)
- Quando `status === "found"` mas `matchedPlayer` ainda é `null`, mostrar um skeleton/spinner no card do jogador ao invés do fallback "??"
- Só renderizar as informações do jogador quando `matchedPlayer` estiver carregado

## 3. Loading nos botões de ação (aceitar/recusar match)
- Adicionar estado `respondingMatch` para desabilitar botões e mostrar spinner enquanto a resposta está sendo processada

## 4. Remoção de amigo com cascata de conversa (`useChat.ts`)
- Atualizar `removeFriend` para:
  1. Identificar o `user_id` do amigo sendo removido
  2. Encontrar e ocultar/deletar conversas associadas a esse amigo
  3. Remover da lista local de `friends` E de `conversations`
  4. Limpar `activeConversation` se estava aberta com esse amigo

## 5. Melhoria da Sidebar do Chat (`FriendsSidebar.tsx`)
- Adicionar `framer-motion` para animações de entrada/saída dos itens da lista (stagger)
- Animação de transição entre abas (conversas ↔ amigos)
- Mostrar timestamp relativo na última mensagem (ex: "há 5 min")
- Mostrar Riot ID como subtítulo nas conversas quando disponível
- Indicador visual de "online" (status badge no avatar)
- Animação suave ao remover item da lista (exit animation)
- Hover effects mais polidos com scale sutil

## Arquivos modificados
- `src/hooks/useMatchmaking.ts` — sem mudanças
- `src/components/MatchmakingQueue.tsx` — loading states no botão e no card de match
- `src/hooks/useChat.ts` — cascata na remoção de amigo (remove conversas associadas)
- `src/components/FriendsSidebar.tsx` — animações, timestamps, visual melhorado

