# 📋 Boletim Orçamentário Federal — AEB

Newsletter automática sobre **LOA, LDO e PPA**, gerada por IA com busca em tempo real
e enviada por e-mail. Roda 100% no Vercel — sem servidor, sem GitHub Actions.

**Elaborado por:** Divisão de Planejamento Orçamentário e Financeiro  
**Órgão:** Agência Espacial Brasileira — AEB

---

## Como funciona

```
⏰ Vercel Cron (07:30 BRT, dias úteis)
        ↓
🔍 Claude busca manchetes na web (LOA, LDO, PPA...)
        ↓
✍️  IA organiza, prioriza e analisa as notícias
        ↓
📧 SendGrid envia e-mail personalizado para cada destinatário
```

Há também um **dashboard web** (`/`) para disparar o boletim manualmente a qualquer momento.

---

## Estrutura

```
newsletter-orcamento/
├── app/
│   ├── layout.tsx             # Layout raiz (Next.js App Router)
│   ├── globals.css            # Estilos globais
│   ├── page.tsx               # Dashboard de controle
│   └── api/
│       └── newsletter/
│           └── route.ts       # Endpoint GET (cron) + POST (manual)
├── lib/
│   ├── newsletter.ts          # Claude web search + HTML do e-mail
│   └── sendgrid.ts            # Envio via SendGrid
├── package.json
├── next.config.mjs
├── vercel.json                # Configuração do cron job
├── tsconfig.json
├── .env.local.example         # Template de variáveis de ambiente
└── README.md
```

---

## Configuração — passo a passo

### 1. Obtenha as chaves de API

**Claude (Anthropic)**
1. Acesse https://console.anthropic.com/settings/keys
2. Clique em **Create Key** → copie a chave (`sk-ant-...`)

**SendGrid (gratuito até 100 e-mails/dia)**
1. Crie conta em https://sendgrid.com
2. Vá em **Settings → API Keys → Create API Key**
3. Permissão: **Restricted Access → Mail Send**
4. Copie a chave (`SG.xxx...`)
5. Verifique seu remetente em **Settings → Sender Authentication → Single Sender Verification**

---

### 2. Publique no Vercel

1. Envie o repositório para o GitHub (privado recomendado)
2. Acesse https://vercel.com/new e importe o repositório
3. O Vercel detecta automaticamente que é um projeto Next.js

---

### 3. Configure as variáveis de ambiente no Vercel

Em **Settings → Environment Variables**, adicione:

| Variável            | Valor                                                        | Exemplo                                        |
|---------------------|--------------------------------------------------------------|------------------------------------------------|
| `ANTHROPIC_API_KEY` | Chave da API do Claude                                       | `sk-ant-api03-...`                             |
| `SENDGRID_API_KEY`  | Chave do SendGrid                                            | `SG.xxxxxxxxxxxx`                              |
| `FROM_EMAIL`        | E-mail remetente verificado no SendGrid                      | `boletim@aeb.gov.br`                           |
| `FROM_NAME`         | Nome do remetente (opcional)                                 | `Boletim Orçamentário AEB`                     |
| `RECIPIENTS`        | Destinatários no formato `email:Nome` separados por vírgula  | `joao@aeb.gov.br:João,maria@aeb.gov.br:Maria`  |
| `TOPICS`            | Temas monitorados, separados por vírgula                     | `LOA,LDO,PPA`                                  |
| `CRON_SECRET`       | String aleatória para autenticar o cron                      | `minha-senha-secreta-123`                       |

> **Dica:** Gere um `CRON_SECRET` seguro com `openssl rand -hex 32` no terminal.

---

### 4. Ative o cron job

O arquivo `vercel.json` já define o agendamento:

```json
{
  "crons": [
    {
      "path": "/api/newsletter",
      "schedule": "30 10 * * 1-5"
    }
  ]
}
```

Isso corresponde a **07:30 BRT (10:30 UTC) de segunda a sexta**.

> ⚠️ **Cron jobs requerem o plano Pro do Vercel** (~US$ 20/mês).  
> No plano gratuito, use o dashboard para disparar manualmente, ou mantenha o GitHub Actions chamando a URL `/api/newsletter` com o header `Authorization: Bearer <CRON_SECRET>`.

Para ajustar o horário, edite a linha `schedule` usando o formato cron (UTC):

| Horário BRT | schedule (UTC)         |
|-------------|------------------------|
| 06:00       | `0 9 * * 1-5`          |
| 07:00       | `0 10 * * 1-5`         |
| 07:30       | `30 10 * * 1-5`        |
| 08:00       | `0 11 * * 1-5`         |
| 09:00       | `0 12 * * 1-5`         |
| 12:00       | `0 15 * * 1-5`         |

---

### 5. Teste

1. Após o deploy, acesse a URL do seu projeto Vercel
2. Clique em **Gerar e Enviar Agora** no dashboard
3. Aguarde ~30–60 segundos e verifique os e-mails

---

## Alternativa: GitHub Actions chamando o Vercel (plano gratuito)

Se não quiser o plano Pro, mantenha o GitHub Actions apenas para agendar — ele chama a URL do Vercel no horário certo:

```yaml
# .github/workflows/newsletter.yml
name: Disparar Newsletter
on:
  schedule:
    - cron: '30 10 * * 1-5'
  workflow_dispatch:

jobs:
  disparar:
    runs-on: ubuntu-latest
    steps:
      - name: Chamar endpoint do Vercel
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://SEU-PROJETO.vercel.app/api/newsletter
```

Adicione `CRON_SECRET` como secret no GitHub também.

---

## Estimativa de custos

| Serviço           | Plano gratuito               | Custo estimado (22 dias úteis) |
|-------------------|------------------------------|--------------------------------|
| Vercel (Hobby)    | Functions ilimitadas         | **gratuito** (sem cron)        |
| Vercel (Pro)      | Cron jobs inclusos           | ~US$ 20/mês                    |
| GitHub Actions    | 2.000 min/mês gratuitos      | ~15 min/mês — **gratuito**     |
| SendGrid          | 100 e-mails/dia gratuitos    | até 22 envios — **gratuito**   |
| Anthropic API     | Pago por uso                 | ~R$ 1,50 a R$ 4,00/mês         |

---

## Suporte

Em caso de dúvidas, entre em contato com a  
**Divisão de Planejamento Orçamentário e Financeiro — AEB**.
