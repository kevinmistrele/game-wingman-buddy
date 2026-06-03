# Game Wingman Buddy — Documentação de Produto

## Visão Geral

**Game Wingman Buddy** (nome de mercado: **MatchGaming**) é uma plataforma web de matchmaking social voltada para jogadores de **League of Legends**. O objetivo é conectar jogadores compatíveis por elo, função e estilo de jogo, permitindo que eles formem duplas (duo) e se comuniquem em tempo real dentro da própria plataforma.

O produto resolve um problema concreto: encontrar um parceiro de jogo confiável e de nível compatível é frustrante nos canais tradicionais (Reddit, Discord genérico, redes sociais). O MatchGaming torna esse processo estruturado, rápido e integrado com os dados oficiais da Riot Games.

---

## Público-Alvo

Jogadores de League of Legends, principalmente no servidor brasileiro (BR1), que buscam:

- Um duo para subir de elo no ranqueado
- Um parceiro para jogar modos normais ou ARAM
- Uma forma de expandir a rede de amigos dentro do jogo

---

## Funcionalidades Principais

### Autenticação e Onboarding

O cadastro é feito por email/senha ou Google OAuth via Supabase Auth. Após o registro, o usuário passa por uma etapa de onboarding onde escolhe um nome de usuário e, opcionalmente, vincula seu Riot ID. Usuários que entram via Google e não personalizaram o nome são redirecionados automaticamente para o onboarding.

Após o cadastro por email, o usuário recebe um email de verificação e é direcionado para uma tela dedicada de confirmação, com opção de reenvio com cooldown de 30 segundos.

### Matchmaking

O coração do produto. O usuário entra na fila escolhendo um dos quatro modos disponíveis:

- **Normal Game** — sem restrição de elo, casual
- **ARAM** — sem restrição de elo, modo especial
- **Solo/Duo Ranked** — segue as regras oficiais da Riot: respeita a diferença de tier, exclui Mestre/Grão-Mestre/Desafiante de duplas
- **Flex Ranked** — permite até 2 tiers de diferença entre os jogadores

Nos modos ranqueados, o usuário também pode informar sua função principal e a função que deseja no duo. O sistema aplica compatibilidade de funções durante a fase estrita (primeiros 30 segundos). Após 30 segundos sem match, expande os critérios e passa a considerar apenas o elo.

Quando um match é encontrado, ambos os jogadores veem um modal de confirmação e precisam aceitar. Se ambos aceitam, uma conversa privada é criada automaticamente e eles são redirecionados para o chat.

### Chat em Tempo Real

O chat é alimentado por Supabase Realtime com assinaturas em tempo real. Cada conversa é entre dois usuários e pode ser originada de um match ou iniciada pelo usuário diretamente com um amigo. O usuário pode ocultar conversas sem deletá-las.

### Sistema de Amizades

O usuário pode enviar, aceitar ou recusar pedidos de amizade. A lista de amigos é exibida em uma sidebar lateral na tela de chat. Amigos aparecem com indicador de status online/offline.

O matchmaking exclui automaticamente amigos e usuários bloqueados da fila de potenciais parceiros, para que o sistema sempre ofereça novas conexões.

### Perfil e Integração Riot

Cada usuário tem um perfil público com:

- Nome de usuário e avatar
- Riot ID vinculado
- Elo atual (obtido via Riot API ou informado manualmente)
- Histórico de partidas recentes
- Campeões mais jogados e maestria
- Estatísticas gerais (KDA, win rate, etc.)

O perfil é dividido em abas: Visão Geral, Estatísticas, Campeões e Partidas. Os dados são buscados em tempo real via Supabase Edge Function que consome a Riot API.

### Configurações

A tela de configurações permite ao usuário:

- Alternar entre tema claro e escuro
- Ativar ou desativar sons do sistema (notificações de match, mensagens)
- Definir função preferida e função desejada no duo para pré-preencher a fila
- Baixar todos os dados da conta (conformidade com privacidade)
- Gerenciar usuários bloqueados (listar e desbloquear, com paginação)
- Deletar permanentemente a conta

### Controle de Sessão

O sistema detecta sessões simultâneas da mesma conta. Se o usuário abrir a aplicação em outro dispositivo ou aba, é apresentado um modal perguntando se deseja assumir a sessão. Isso evita conflitos de status online e de matchmaking.

---

## Fluxo Principal do Usuário

1. Usuário acessa a landing page e se autentica
2. Completa o onboarding (nome de usuário e Riot ID opcional)
3. Acessa a tela de Matchmaking, escolhe o modo e as funções (se ranqueado)
4. Entra na fila e aguarda o sistema encontrar um parceiro compatível
5. Confirma o match via modal de aceitação
6. É redirecionado para o chat com o parceiro
7. Combinam detalhes, adicionam como amigos se quiserem, e jogam

---

## Status e Indicadores Online

O status online de cada usuário é atualizado a cada 60 segundos via `last_seen`. Um indicador visual na interface mostra quais amigos estão online. Usuários são considerados online se o `last_seen` foi atualizado nos últimos 2 minutos.

---

## Jogos Suportados

Atualmente a plataforma suporta exclusivamente **League of Legends** no servidor **BR1**. A estrutura do banco de dados e do matchmaking foi projetada com o campo `game` para suportar futura expansão para outros títulos da Riot (Valorant estava planejado mas não está ativo).

---

## Identidade Visual

A interface usa um tema gaming com paleta escura, cores primárias em teal/ciano com efeito glow, tipografia display em letras maiúsculas rastreadas e animações fluidas via Framer Motion. O design é responsivo e suporta tema claro e escuro.
