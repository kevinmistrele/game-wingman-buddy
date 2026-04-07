

# Plano: Tela de Verificação de Email + Email Personalizado

## Parte 0 — Corrigir erros de build (lp prop)

Os erros reportados indicam que `lp` ainda está sendo passado ao `RankBadge`, mas a inspeção dos arquivos mostra que já foram removidos. Isso é cache de build obsoleto. A implementação abaixo vai gerar um novo build que resolve automaticamente. Caso persista, forçar rebuild.

---

## Parte 1 — Tela de Verificação de Email

### Novo arquivo: `src/pages/VerifyEmail.tsx`

Página dedicada exibida após cadastro, com visual consistente com `Auth.tsx` (gradient, blur, grid).

**Conteúdo:**
- Logo MatchGaming + ícone de email animado (motion)
- Título: "QUASE LÁ, JOGADOR!"
- Email do usuário exibido: "Enviamos um email para: user@email.com"
- Mensagem: "Confirme seu email para entrar na arena"
- Dica: "Verifique também a pasta de spam/lixo eletrônico"
- Seção de destaques do produto (3 cards):
  - 🎯 Matchmaking por rank e rota
  - 💬 Chat em tempo real com seu duo
  - 🏆 Encontre players do seu nível
- Botão "Abrir meu email" (abre mailto:)
- Botão "Reenviar email" com cooldown de 30s e feedback via toast
- Link "Voltar para login"

**Lógica:**
- Recebe email via `useLocation().state.email`
- Fallback caso email não esteja disponível (exibe mensagem genérica)
- Reenvio via `supabase.auth.resend({ type: 'signup', email })`
- Cooldown com countdown visual (30, 29, 28...)

### Edição: `src/pages/Auth.tsx`

Após signup com sucesso, redirecionar:
```typescript
navigate("/verify-email", { state: { email } });
```
Remover o toast de "verifique seu email" (a página nova cumpre esse papel).

### Edição: `src/App.tsx`

Adicionar rota pública:
```typescript
<Route path="/verify-email" element={<VerifyEmail />} />
```

---

## Parte 2 — Email de Verificação Personalizado

Para personalizar o template do email (botão, visual, texto), é necessário configurar um domínio de email primeiro. Sem domínio, o sistema envia emails com template padrão.

Após aprovação do plano, vou apresentar o diálogo de configuração de domínio de email. Depois do domínio configurado, posso criar templates personalizados com a identidade visual do MatchGaming (cores teal/dark, logo, tom gaming).

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/VerifyEmail.tsx` | Criar |
| `src/pages/Auth.tsx` | Redirect após signup |
| `src/App.tsx` | Adicionar rota `/verify-email` |

