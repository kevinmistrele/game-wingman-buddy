

# Plano: Auto-aceite mútuo, loading no chat, lista de bloqueados, fix layout, logo/fonte navbar

## 1. Auto-aceite quando ambos enviaram solicitação

**Arquivo:** `src/hooks/useFriendRequests.ts` - função `sendRequest`

Antes de inserir nova solicitação, verificar se existe solicitação pendente do `receiverId` para o `user.id`. Se existir:
- Aceitar essa solicitação automaticamente (update status "accepted")
- Criar friendship + conversa
- Toast: "Vocês se adicionaram mutuamente!"
- Retornar sem criar nova solicitação

## 2. Loading ao enviar solicitação via chat

**Arquivo:** `src/components/ChatPanel.tsx`

- Adicionar estado `sendingRequest: boolean`
- No botão "Adicionar", setar `true`, chamar `onSendFriendRequest` com `await`, setar `false`
- Alterar tipo de `onSendFriendRequest` para retornar `Promise<void>`
- Mostrar `Loader2` com `animate-spin` enquanto loading, desabilitar botão

## 3. Lista de bloqueados nas Configurações (paginada, max 50)

**Arquivo:** `src/pages/Settings.tsx`

Nova seção "Usuários Bloqueados" entre Privacidade e Conta:
- Buscar `blocked_users` com `.eq("blocker_id", user.id)` paginado (10 por vez) via `range(offset, offset+9)`
- Buscar perfil de cada `blocked_id` para exibir username/avatar
- Lista com avatar, username e botão "Desbloquear"
- Desbloquear: `DELETE FROM blocked_users WHERE id = <id>` + toast (sem re-adicionar amigo)
- Paginação: botões "Anterior"/"Próximo" com contagem total
- Mostrar total / 50

## 4. Fix layout — elementos saindo da tela

**Arquivo:** `src/components/FriendsSidebar.tsx`

- Adicionar `overflow-hidden` no container principal
- Nos nomes dos amigos, adicionar `truncate` ao `<p>` do username
- Container de ações: `flex-shrink-0` para não comprimir ícones

## 5. Logo maior e fonte menor na Navbar

**Arquivo:** `src/components/Navbar.tsx`

- Ícone/logo: de `h-8 w-8` para `h-10 w-10`
- Texto "MATCHGAMING": de `text-xl` para `text-lg`
- Ficam proporcionais: logo maior, fonte menor

## Arquivos modificados
- `src/hooks/useFriendRequests.ts` — auto-aceite mútuo
- `src/components/ChatPanel.tsx` — loading no botão adicionar + tipo async
- `src/pages/Settings.tsx` — seção de bloqueados paginada com desbloquear
- `src/components/FriendsSidebar.tsx` — fix overflow/truncate
- `src/components/Navbar.tsx` — logo maior, fonte menor

