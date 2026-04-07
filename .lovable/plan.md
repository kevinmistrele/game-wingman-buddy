

# Plano: Rank via API Riot + Abas e Gráficos no Perfil

## Contexto

A edge function `riot-matches` já implementa o fluxo correto (Account-V1 → Summoner-V4 → League-V4) para buscar o rank. O rank já é retornado no campo `summoner.ranked`. O `ProfileCard` já consome esse dado e atualiza o perfil automaticamente. Portanto, **não há mudanças necessárias no backend para obter o rank** — já funciona.

O foco principal é **reestruturar a página de perfil** com abas de navegação e gráficos de desempenho.

---

## 1. Reestruturar a página de Perfil com abas

**Arquivo:** `src/pages/Profile.tsx`

Substituir o layout atual (ProfileCard + RiotProfileSection lado a lado) por um sistema de abas no painel direito:

- **Aba "Visão Geral"** — Resumo com card de rank (Solo/Duo e Flex), estatísticas gerais (KDA, WR, CS/min), top campeões, e streak
- **Aba "Partidas"** — Histórico completo de partidas (MatchHistoryCard)
- **Aba "Estatísticas"** — Gráficos de desempenho
- **Aba "Campeões"** — Desempenho detalhado por campeão

Usar o componente `Tabs` do shadcn/ui existente.

## 2. Criar componente de gráficos

**Novo arquivo:** `src/components/ProfileCharts.tsx`

Instalar `recharts` como dependência.

Gráficos planejados:
- **Win Rate ao longo das partidas** — Line chart mostrando % de vitórias acumuladas
- **KDA por partida** — Bar chart com kills/deaths/assists empilhados
- **Dano por partida** — Area chart com damage dealt
- **CS/min por partida** — Line chart
- **Distribuição de campeões** — Pie chart (top 5 campeões jogados)

Todos os gráficos usam dados já retornados pela API (`recentMatches`), sem chamadas extras.

## 3. Separar componentes do LolProfile

Refatorar `src/components/LolProfile.tsx` para extrair:

- **`OverviewTab`** — Rank, stats médias, performance, streak (seção existente do LolProfile reorganizada)
- **`MatchesTab`** — Lista de MatchHistoryCard
- **`StatsTab`** — ProfileCharts (gráficos)
- **`ChampionsTab`** — Tabela de desempenho por campeão + maestrias

Esses componentes serão definidos inline ou em arquivos separados conforme complexidade.

## 4. Manter o ProfileCard intacto

O `ProfileCard` à esquerda permanece como está — já mostra rank automaticamente via API ou manual.

---

## Arquivos modificados

| Arquivo | Ação |
|---|---|
| `package.json` | Adicionar `recharts` |
| `src/pages/Profile.tsx` | Adicionar sistema de abas |
| `src/components/LolProfile.tsx` | Refatorar em sub-componentes por aba |
| `src/components/ProfileCharts.tsx` | Novo — gráficos com recharts |
| `src/components/RiotProfileSection.tsx` | Adaptar para passar dados às abas |

## Detalhes técnicos

- `recharts` já é compatível com React 18 e Tailwind
- Os gráficos usam cores do tema (CSS variables via `hsl(var(--primary))`)
- Responsivo: abas empilham em mobile, gráficos usam `ResponsiveContainer`
- Nenhuma chamada extra à API — todos os dados vêm do `useRiotProfile` existente

