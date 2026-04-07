

# Plano: Preferência de Rotas no Matchmaking (Final)

## 1. Database — Migration

```sql
ALTER TABLE public.matchmaking_queue
  ADD COLUMN my_role text DEFAULT NULL
    CHECK (my_role IN ('top','jungle','mid','adc','support') OR my_role IS NULL),
  ADD COLUMN desired_duo_role text DEFAULT NULL
    CHECK (desired_duo_role IN ('top','jungle','mid','adc','support') OR desired_duo_role IS NULL);
```

## 2. Constantes (`src/lib/eloUtils.ts`)

Adicionar `ROLES` array e tipo `Role`.

## 3. Lógica de matching (`src/hooks/useMatchmaking.ts`)

### `joinQueue(mode, myRole?, desiredDuoRole?)`
- Modos não ranqueados: forçar `my_role = null`, `desired_duo_role = null`
- Ranqueados: salvar valores informados

### Timer com reset garantido
```typescript
useEffect(() => {
  if (status !== "searching") return;
  setSearchPhase("strict"); // sempre reseta ao iniciar busca
  const timer = setTimeout(() => setSearchPhase("expanded"), 30000);
  return () => clearTimeout(timer);
}, [status]);
```

### Lógica de matching (linear e explícita)
```typescript
// 1. Rank é obrigatório
if (!rankCompatible) return false;

// 2. Fase expandida ignora rotas
if (searchPhase === "expanded") return true;

// 3. Conflito de mesma rota
const sameRoleConflict =
  player.my_role && opponent.my_role
  && player.my_role === opponent.my_role
  && (player.desired_duo_role || opponent.desired_duo_role);
if (sameRoleConflict) return false;

// 4. Compatibilidade de rotas
const rolesOk =
  (!player.desired_duo_role || opponent.my_role === player.desired_duo_role)
  && (!opponent.desired_duo_role || player.my_role === opponent.desired_duo_role);
return rolesOk;
```

### Estado exposto ao UI
- `searchPhase: "strict" | "expanded"`

## 4. UI (`src/components/MatchmakingQueue.tsx`)

- Dois selects opcionais ("Sua rota", "Rota do duo"), visíveis apenas em Solo/Duo e Flex
- Default: "Qualquer" (null)
- Feedback durante busca:
  - Fase 1: `✔ Mesmo nível (Ouro) · ✔ Rota desejada (Mid)`
  - Fase 2: `✔ Mesmo nível (Ouro) · ⚠ Qualquer rota`
- Match encontrado: mostrar rota do oponente (se informada)

## Arquivos modificados

| Arquivo | Ação |
|---|---|
| Migration SQL | `my_role`, `desired_duo_role` com CHECK |
| `src/lib/eloUtils.ts` | `ROLES`, `Role` type |
| `src/hooks/useMatchmaking.ts` | Rotas, matching linear, timer com reset |
| `src/components/MatchmakingQueue.tsx` | Selects, badges, feedback de fase |

