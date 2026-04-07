

# Correção da Fila de Matchmaking — Apenas Jogadores Ativos

## Problema
Jogadores que saem da fila (fecham o navegador, perdem conexão, etc.) continuam com status "waiting" no banco, sendo contabilizados na contagem e podendo ser pareados com outros jogadores. O filtro de 10 minutos ajuda mas não resolve completamente.

## Solução

### 1. Limpeza automática ao sair da página (`useMatchmaking.ts`)
- Adicionar `beforeunload` event listener que cancela a entrada na fila quando o usuário fecha/sai da página
- Adicionar cleanup no `useEffect` de desmontagem do componente para cancelar a fila automaticamente
- Isso garante que ao navegar para outra página ou fechar o browser, o status muda para "cancelled"

### 2. Reduzir janela de tempo de 10min para 2min (`useMatchmaking.ts`)
- Mudar o filtro de contagem de `10 minutos` para `2 minutos` — entradas mais velhas que 2 minutos sem atividade são provavelmente abandonadas
- Aplicar o mesmo filtro de tempo ao buscar oponentes na `joinQueue`, garantindo que só tente parear com jogadores que entraram recentemente

### 3. Validação antes de criar match (`useMatchmaking.ts`)
- Antes de criar o match, re-verificar que o oponente ainda está com status "waiting" (evitar race condition)
- Se o oponente já foi pareado ou cancelou, pular para o próximo

### 4. Limpeza de entradas antigas no banco
- Executar uma migration/query para marcar como "expired" todas as entradas "waiting" com mais de 2 minutos de criação (limpeza pontual dos dados atuais)

### Arquivos modificados
- `src/hooks/useMatchmaking.ts` — cleanup ao sair, filtro de tempo mais agressivo, validação de oponente

