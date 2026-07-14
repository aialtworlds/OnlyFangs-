# Guia de Deploy — Railway

## ⚠️ Leia antes de migrar: duas funcionalidades ainda dependem do Manus

Migrar a hospedagem para o Railway resolve a parte de **build, execução e domínio**, mas **duas funcionalidades reais do app continuam presas ao Manus** mesmo depois da migração, porque o código chama a infraestrutura interna dele (variáveis `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY`):

1. **Login (OAuth Google/Facebook/Microsoft/Apple)** — `server/_core/oauth.ts` usa um SDK do Manus como intermediário, não fala direto com os provedores.
2. **Upload de conteúdo** (fotos, música, capítulos de livro) — `server/storage.ts` usa o servidor do Manus como intermediário para gerar URL assinada da AWS S3.

**Sem resolver isso, ao migrar pro Railway:** o site sobe e funciona (build, rotas, banco de dados), mas login e upload de arquivo vão falhar, porque as credenciais do Manus não existem fora do ambiente dele.

**Duas opções:**
- **Curto prazo:** continuar usando as credenciais do Manus (`BUILT_IN_FORGE_API_URL`/`KEY`) mesmo hospedando no Railway — tecnicamente possível se o Manus permitir gerar essas chaves sem manter o projeto ativo lá, mas mantém uma dependência dele.
- **Correto/definitivo:** substituir os dois sistemas por versão própria — criar um OAuth App direto no Google Cloud Console / Meta for Developers, e usar AWS S3 com sua própria conta (o pacote `@aws-sdk/client-s3` já está instalado, só não é usado ainda). Isso é trabalho de reengenharia separado, não incluído neste guia.

---

## Passo a passo — Deploy do que já funciona hoje

### 1. Criar conta no Railway
Acesse [railway.app](https://railway.app) e crie conta (dá para usar login do GitHub direto).

### 2. Criar novo projeto a partir do GitHub
No painel do Railway: **New Project → Deploy from GitHub repo** → selecione `aialtworlds/OnlyFangs-`.

O Railway detecta o `Dockerfile` automaticamente (configurado via `railway.json` neste repositório) e usa ele para o build.

### 3. Adicionar banco de dados MySQL
No mesmo projeto: **New → Database → Add MySQL**.

O Railway cria o banco e gera automaticamente uma variável `DATABASE_URL` — copie o valor gerado.

### 4. Configurar variáveis de ambiente
Vá em **Settings → Variables** do serviço da aplicação (não do banco) e adicione as variáveis listadas em `ENV_VARIABLES.md`. No mínimo, para o app subir:

- `DATABASE_URL` (copiado do passo 3)
- `NODE_ENV=production`
- `JWT_SECRET` (gere uma string aleatória longa)
- `STRIPE_SECRET_KEY` (sua chave real do Stripe)

As demais variáveis (OAuth, Forge/storage) estão detalhadas em `ENV_VARIABLES.md`, com a ressalva sobre a dependência do Manus explicada acima.

### 5. Rodar as migrações do banco
Depois do primeiro deploy, conecte via Railway CLI e rode:
```bash
railway run pnpm run db:push
```
Isso cria as tabelas no banco novo (que começa vazio).

### 6. Configurar o domínio
Em **Settings → Networking → Custom Domain**, adicione `onlyfangs.social`. O Railway vai fornecer um registro CNAME para você apontar no Porkbun (mesmo processo que fizemos antes para o Manus — trocar o valor do CNAME/ALIAS existente pelo novo que o Railway fornecer).

### 7. Verificar que subiu
Depois do deploy, acesse a URL temporária que o Railway fornece (antes de trocar o domínio) e confirme que a home carrega. Login e upload de arquivo **não vão funcionar** até a dependência do Manus (passo descrito no aviso acima) ser resolvida — isso é esperado, não é erro de configuração do Railway.

---

## O que este guia NÃO resolve (fica para depois)

- Substituição do OAuth do Manus por OAuth direto
- Substituição do storage do Manus por S3 direto
- Migração de dados reais (não é necessário agora — o banco atual está vazio, sem criadores/patrons reais)
