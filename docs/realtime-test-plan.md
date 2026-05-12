# Plano de Testes — Realtime / Sockets (MatchGaming)

Objetivo: garantir que todos os canais Supabase Realtime usados no app funcionem de forma confiável, mesmo com perda de pacotes, recargas, mudanças de aba e reconexões.

## Canais usados

| Canal | Hook/Componente | Tabela | Eventos |
|---|---|---|---|
| `matches-realtime-{userId}` | `useMatchmaking` | `matches` | INSERT/UPDATE |
| `messages-{conversationId}` | `useChat` | `messages` (filtrado) | INSERT |
| `conversations-realtime` | `useChat` | `conversations` | INSERT |
| `friendships-realtime` | `useChat` | `friendships` | INSERT/DELETE |
| `friend_requests-*` | `useFriendRequests` | `friend_requests` | INSERT/UPDATE/DELETE |

Mudanças de hardening aplicadas:
- `REPLICA IDENTITY FULL` em `matches`, `conversations`, `messages`, `matchmaking_queue`, `friend_requests`, `friendships` (payloads completos).
- `friendships` adicionado à publication `supabase_realtime`.
- `matches-realtime` agora usa channel name único por usuário (evita conflito quando duas abas do mesmo browser abrem).
- Polling fallback de 2s em `useMatchmaking` quando `status === "found"`: detecta `bothAccepted` mesmo se o evento UPDATE for perdido.
- Logs de subscription status + payloads no console (`[realtime:matches]`).

## Cenários — Matchmaking

1. **A aceita primeiro, B aceita depois (caminho feliz)** — ambos vão para `/chat?convo=<id>`, mesmo `convo`.
2. **B aceita primeiro, A aceita depois** — idem.
3. **Aceitação quase simultânea** — apenas 1 conversation criada (constraint única ou retry).
4. **Realtime caído para B** — desconectar wifi de B logo após match found, B aceita; o polling de 2s deve redirecionar B em até ~4s após A aceitar (sem reconexão precisa do socket).
5. **B troca de aba antes de aceitar** — Chrome pode pausar o socket; ao voltar, clicar Aceitar deve funcionar (polling cobre o gap).
6. **B recarrega a página com `status="found"`** — match é perdido (esperado); usuário volta para idle.
7. **A recusa, B ainda aguardando** — B vê toast e volta para idle via polling/realtime.
8. **A aceita, B expira (timeout futuro)** — B volta para idle.
9. **Duas abas do mesmo usuário em queue** — apenas 1 entry ativa; não duplica match.

## Cenários — Chat

10. **A envia mensagem com B no mesmo chat** — aparece em B em <1s sem recarregar.
11. **A envia mensagem com B em outro chat** — sidebar de B atualiza (poll 60s ou ao trocar de chat).
12. **B remove A da lista de amigos** — sidebar de A atualiza instantaneamente (canal `friendships-realtime`).
13. **A envia friend request para B** — badge de B atualiza em tempo real.
14. **A aceita friend request de B** — amizade aparece em ambos sem reload.
15. **Chat aberto, conexão cai e volta** — Supabase Realtime reconecta automaticamente; mensagens novas continuam chegando.

## Cenários — Reconexão / Resiliência

16. **Toggle wifi off/on por 10s** — verificar logs `[realtime:matches] subscription status: SUBSCRIBED` após reconectar.
17. **Mobile background 30s** — voltar e mandar mensagem; deve entregar.
18. **Múltiplas instâncias (3 abas) do mesmo user** — sem warning `tried to subscribe multiple times`.

## Critérios de aprovação

- Em todos os cenários 1–9, ambos jogadores chegam ao mesmo `convo` em ≤5s do segundo Aceitar.
- Em 10–15, propagação realtime ≤2s.
- Em 16–18, recuperação ≤10s, sem necessidade de reload manual.
- Console mostra `subscription status: SUBSCRIBED` para cada canal montado.

## Como executar localmente

1. Abrir 2 navegadores (ex.: Chrome + Firefox) ou 2 perfis com 2 contas.
2. Ambos completam onboarding, têm Riot ID válido.
3. DevTools aberto nos dois (Network + Console) para inspecionar WS e logs `[realtime:*]`.
4. Para simular queda de socket: DevTools → Network → throttling Offline por 5–10s.
