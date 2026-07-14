# Variáveis de Ambiente — ONLY FANGS

Levantamento feito direto no código (`server/_core/env.ts` + busca por `process.env` em todo `server/`), não é lista genérica de template.

## Essenciais para o app subir

| Variável | Para que serve | Onde conseguir |
|---|---|---|
| `DATABASE_URL` | Conexão com o banco MySQL | Gerado automaticamente pelo Railway ao criar o banco |
| `NODE_ENV` | Define modo produção | Definir manualmente como `production` |
| `PORT` | Porta que o servidor escuta | Railway define automaticamente, não precisa configurar |
| `JWT_SECRET` | Assina os cookies de sessão | Gere uma string aleatória longa (ex: `openssl rand -base64 32`) |

## Pagamento (Stripe)

| Variável | Para que serve | Onde conseguir |
|---|---|---|
| `STRIPE_SECRET_KEY` | Chave secreta da API do Stripe | Painel do Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Valida que webhooks vêm mesmo do Stripe | Painel do Stripe → Developers → Webhooks (criar endpoint apontando pra URL de produção) |

## E-mail

| Variável | Para que serve | Onde conseguir |
|---|---|---|
| `RESEND_API_KEY` | Envio de e-mail transacional (confirmação, notificação) | Painel do Resend |

## ⚠️ Dependentes do Manus (ver aviso no RAILWAY_DEPLOYMENT_GUIDE.md)

| Variável | Para que serve | Situação |
|---|---|---|
| `OAUTH_SERVER_URL` | URL do serviço de OAuth (login Google/Facebook/etc) | Hoje só existe dentro do ecossistema Manus — login não funciona sem isso, e não há substituto próprio configurado ainda |
| `BUILT_IN_FORGE_API_URL` | URL do servidor intermediário do Manus para storage/IA | Idem — upload de arquivo depende disso |
| `BUILT_IN_FORGE_API_KEY` | Chave de autenticação do Forge (Manus) | Idem |
| `VITE_APP_ID` | Identificador do app dentro do ecossistema Manus | Só relevante enquanto usar infraestrutura do Manus |
| `OWNER_OPEN_ID` | ID do "dono" do app no sistema do Manus | Idem |

## Variáveis usadas mas não confirmadas como críticas

Durante a varredura, alguns módulos (`imageGeneration.ts`, `voiceTranscription.ts`, `map.ts`) também dependem de `BUILT_IN_FORGE_API_URL`/`KEY`, mas não ficou confirmado se essas funcionalidades específicas (geração de imagem por IA, transcrição de voz, mapa) são realmente usadas em alguma tela do ONLY FANGS hoje, ou se são sobra do template original do Manus nunca removida. Vale confirmar antes de investir tempo substituindo — se não forem usadas por nenhuma feature real, podem simplesmente ser removidas do código em vez de recriadas em outro provedor.
