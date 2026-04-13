# 🏭 World Metalic — Agência de IA para Licitações Públicas

## Visão Geral

Sistema de IA com 4 agentes especializados em assessoria para licitações públicas,
integrado via WhatsApp (Evolution API) e orquestrado pelo OpenClaw.

**Cliente:** World Metalic
**Segmento:** Licitações públicas — vários segmentos
**Stack:** OpenClaw + Evolution API + Groq/Llama

---

## Dados de Configuração

| Item | Valor |
|------|-------|
| Evolution API URL | `http://187.127.18.17:43654` |
| Evolution API Key | `q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6` |
| Instância | `WORLD METALIC` |
| WhatsApp | `+5541984659663` |
| OpenClaw URL | `http://187.127.18.17:48627` |
| Projeto OpenClaw | `openclaw-h3ur` |
| Modelo IA | Groq / Llama |

---

## Arquitetura

```
Cliente (WhatsApp +5541984659663)
        │
        ▼
  Evolution API (:43654)
        │
        ▼
  OpenClaw (:48627) — Orquestrador
        │
        ├── 🤖 Agente 1: Atendimento WhatsApp (Front)
        │       → Qualifica, roteia, responde dúvidas gerais
        │
        ├── 📄 Agente 2: Analista de Editais
        │       → Recebe PDF, extrai requisitos, prazos, checklist
        │
        ├── 📝 Agente 3: Gerador de Propostas
        │       → Monta proposta comercial/técnica
        │
        └── 🔍 Agente 4: Monitorador de Editais
                → Busca editais nos portais, filtra por relevância
```

---

## Estrutura do Projeto

```
world-metalic-ia/
├── README.md                          # Este arquivo
├── .env                               # Variáveis de ambiente
├── src/
│   ├── agents/                        # Prompts dos agentes
│   │   ├── 01-atendimento.md          # Agente de Atendimento WhatsApp
│   │   ├── 02-analista-editais.md     # Agente Analista de Editais
│   │   ├── 03-gerador-propostas.md    # Agente Gerador de Propostas
│   │   └── 04-monitorador-editais.md  # Agente Monitorador de Editais
│   ├── config/
│   │   ├── evolution-api.json         # Config da Evolution API
│   │   └── openclaw-config.json       # Config do OpenClaw
│   ├── flows/
│   │   ├── fluxo-atendimento.json     # Fluxo principal de atendimento
│   │   ├── fluxo-analise-edital.json  # Fluxo de análise de edital
│   │   └── fluxo-proposta.json        # Fluxo de geração de proposta
│   ├── knowledge/
│   │   ├── base-licitacoes.md         # Base de conhecimento sobre licitações
│   │   ├── lei-14133-resumo.md        # Resumo da Nova Lei de Licitações
│   │   └── lei-8666-resumo.md         # Resumo da Lei 8.666/93
│   ├── templates/
│   │   ├── proposta-comercial.md      # Template de proposta comercial
│   │   ├── proposta-tecnica.md        # Template de proposta técnica
│   │   └── checklist-documentos.md    # Checklist padrão de documentos
│   ├── services/
│   │   └── evolution-webhook.js       # Webhook para receber mensagens
│   └── utils/
│       └── helpers.js                 # Funções auxiliares
├── docs/
│   ├── guia-implantacao.md            # Guia passo a passo
│   └── guia-openclaw.md              # Como configurar no OpenClaw
└── scripts/
    └── setup.sh                       # Script de setup inicial
```

---

## Instalação Rápida

1. Clone ou copie este projeto para sua VPS
2. Configure o `.env` com suas credenciais
3. Siga o `docs/guia-implantacao.md` para configurar cada agente no OpenClaw
4. Teste pelo WhatsApp

---

## Agentes

### 1. Atendimento WhatsApp (Front)
Primeiro contato com o cliente. Qualifica a demanda e roteia para o agente correto.

### 2. Analista de Editais
Recebe PDF de edital e extrai: objeto, modalidade, critério de julgamento, documentos necessários, prazos e alertas.

### 3. Gerador de Propostas
Monta propostas comerciais e técnicas com base nos dados do edital e dados da empresa.

### 4. Monitorador de Editais
Busca editais relevantes em portais públicos e envia alertas por WhatsApp.
