# Guia de Configuração no OpenClaw — World Metalic IA

## Acesso

- **URL**: http://187.127.18.17:48627
- **Projeto**: openclaw-h3ur

---

## Estrutura de Agentes no OpenClaw

O OpenClaw funciona como orquestrador. Cada agente é um "nó" que recebe input,
processa com o LLM (Groq/Llama) e retorna output.

### Hierarquia de Roteamento

```
Mensagem WhatsApp (Evolution API)
    │
    ▼
┌─────────────────────────────────┐
│  AGENTE: WM Assistente (Front)  │  ← Recebe TODAS as mensagens
│  Temperatura: 0.3               │
│  Função: Qualificar + Rotear    │
└──────────┬──────────────────────┘
           │
     ┌─────┼─────────┬──────────────┐
     ▼     ▼         ▼              ▼
  Análise  Proposta  Monitor    Resposta
  Edital   Geração   Editais    Direta
     │       │         │            │
     ▼       ▼         ▼            ▼
  Agente   Agente   Agente     (próprio
  02       03       04         agente 01)
```

---

## Configuração Detalhada por Agente

### Agente 01: WM Assistente

**Onde criar**: Painel OpenClaw → Projeto openclaw-h3ur → Agentes → Novo

| Campo | Valor |
|-------|-------|
| Nome | WM Assistente |
| ID/Slug | wm-assistente |
| Descrição | Atendimento front via WhatsApp — qualifica demandas e roteia |
| Provider | Groq |
| Modelo | llama-3.3-70b-versatile |
| Temperatura | 0.3 |
| Max Tokens | 1024 |
| Top P | 0.9 |
| Stream | Sim |

**System Prompt**: Copiar conteúdo entre ``` do arquivo `src/agents/01-atendimento.md`

**Variáveis de Contexto** (se o OpenClaw suportar):
```json
{
  "empresa": "World Metalic",
  "segmento": "Licitações Públicas",
  "horario_atendimento": "Segunda a Sexta, 8h às 18h",
  "whatsapp": "+5541984659663"
}
```

**Ferramentas/Tools** (se disponível):
- Acesso à base de conhecimento (RAG)
- Envio de mensagem WhatsApp (via Evolution API)
- Roteamento para outros agentes

---

### Agente 02: WM Analista

| Campo | Valor |
|-------|-------|
| Nome | WM Analista |
| ID/Slug | wm-analista |
| Descrição | Analisa editais de licitação (PDF) e gera relatório estruturado |
| Provider | Groq |
| Modelo | llama-3.3-70b-versatile |
| Temperatura | 0.1 |
| Max Tokens | 4096 |
| Top P | 0.9 |
| Stream | Sim |

**System Prompt**: Copiar de `src/agents/02-analista-editais.md`

**Ferramentas/Tools**:
- Leitura de PDF
- Acesso à base de conhecimento (leis)
- Envio de mensagem WhatsApp

**Input esperado**:
```json
{
  "pdf_content": "texto extraído do edital",
  "sender_number": "5541984659663",
  "sender_name": "Nome do Cliente"
}
```

---

### Agente 03: WM Propostas

| Campo | Valor |
|-------|-------|
| Nome | WM Propostas |
| ID/Slug | wm-propostas |
| Descrição | Gera propostas comerciais e técnicas para licitações |
| Provider | Groq |
| Modelo | llama-3.3-70b-versatile |
| Temperatura | 0.2 |
| Max Tokens | 4096 |
| Top P | 0.9 |
| Stream | Sim |

**System Prompt**: Copiar de `src/agents/03-gerador-propostas.md`

**Ferramentas/Tools**:
- Acesso aos templates (proposta comercial e técnica)
- Acesso à base de conhecimento
- Envio de documento WhatsApp

**Input esperado**:
```json
{
  "edital_analise": "análise gerada pelo agente 02",
  "dados_empresa": {
    "razao_social": "",
    "cnpj": "",
    "endereco": "",
    "representante": ""
  },
  "tipo_proposta": "comercial|tecnica|ambas",
  "sender_number": "5541984659663"
}
```

---

### Agente 04: WM Monitor

| Campo | Valor |
|-------|-------|
| Nome | WM Monitor |
| ID/Slug | wm-monitor |
| Descrição | Monitora portais de licitação e envia alertas |
| Provider | Groq |
| Modelo | llama-3.3-70b-versatile |
| Temperatura | 0.1 |
| Max Tokens | 2048 |
| Top P | 0.9 |
| Stream | Não (execução batch) |

**System Prompt**: Copiar de `src/agents/04-monitorador-editais.md`

**Agendamento** (se o OpenClaw suportar cron):
```
# Monitoramento a cada 4 horas
0 */4 * * * → executar agente wm-monitor com ação "buscar_novos"

# Relatório diário às 8h
0 8 * * * → executar agente wm-monitor com ação "relatorio_diario"

# Verificação urgente a cada hora (prazos < 48h)
0 * * * * → executar agente wm-monitor com ação "verificar_urgentes"
```

---

## Configuração do Webhook (Evolution → OpenClaw)

### Opção A: Webhook direto no OpenClaw
Se o OpenClaw tiver endpoint de webhook nativo:

1. No painel Evolution API → Instância WORLD METALIC → Webhook
2. URL: `http://187.127.18.17:48627/api/v1/webhook`
3. Events: `messages.upsert`

### Opção B: Webhook intermediário (Node.js)
Se precisar de processamento intermediário:

1. Use o arquivo `src/services/evolution-webhook.js`
2. Rode como serviço na VPS:
```bash
# Instalar dependências
npm init -y
npm install express dotenv

# Criar servidor (server.js)
# que importa evolution-webhook.js
# e expõe endpoint POST /webhook/evolution

# Rodar com PM2
pm2 start server.js --name "wm-webhook"
```

### Opção C: Conexão nativa OpenClaw + Evolution
Se o OpenClaw já tiver integração com Evolution API:

1. Vá em Integrações → Evolution API
2. Configure:
   - URL: `http://187.127.18.17:43654`
   - API Key: `q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6`
   - Instância: `WORLD METALIC`
3. Mapeie o trigger de mensagem para o Agente WM Assistente

---

## Configuração da Base de Conhecimento (RAG)

### No OpenClaw:

1. Acesse **Knowledge Base** ou **Base de Conhecimento**
2. Crie uma nova base chamada "Licitações"
3. Faça upload dos arquivos:

| Arquivo | Descrição | Vincular a |
|---------|-----------|-----------|
| `base-licitacoes.md` | FAQ e conceitos gerais | Todos os agentes |
| `lei-14133-resumo.md` | Nova Lei de Licitações | Analista, Atendimento |
| `lei-8666-resumo.md` | Lei antiga (processos legados) | Analista, Atendimento |
| `proposta-comercial.md` | Template proposta comercial | Propostas |
| `proposta-tecnica.md` | Template proposta técnica | Propostas |
| `checklist-documentos.md` | Checklist completo | Analista, Propostas |

4. Configure o **chunk size** (tamanho do trecho para busca):
   - Recomendado: 500-1000 tokens
   - Overlap: 100 tokens

5. Teste fazendo perguntas como:
   - "Quais documentos preciso para habilitação?"
   - "Qual o prazo para impugnar um edital de pregão?"
   - "Como funciona o empate ficto para ME/EPP?"

---

## Fluxo de Conversa no OpenClaw

### Se o OpenClaw usar fluxo visual (drag-and-drop):

```
[Trigger: Webhook Evolution]
    │
    ▼
[Condição: Tipo de mensagem]
    ├── Texto → [Agente: WM Assistente]
    ├── PDF   → [Agente: WM Analista]
    └── Outro → [Resposta: "Envie texto ou PDF"]
    │
    ▼
[Agente processa e identifica intenção]
    │
    ▼
[Condição: Qual intenção?]
    ├── Análise    → [Agente: WM Analista]
    ├── Proposta   → [Agente: WM Propostas]
    ├── Monitor    → [Agente: WM Monitor]
    └── Dúvida     → [Resposta direta do Assistente]
    │
    ▼
[Ação: Enviar resposta via Evolution API]
    │
    ▼
[Ação: Salvar histórico]
```

### Se o OpenClaw usar JSON/código:
Use o arquivo `src/flows/fluxo-atendimento.json` como referência.

---

## Testando a Integração

### Teste 1: Conectividade
```bash
# Verificar Evolution API
curl -X GET "http://187.127.18.17:43654/instance/connectionState/WORLD%20METALIC" \
  -H "apikey: q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6"

# Verificar OpenClaw
curl -X GET "http://187.127.18.17:48627/api/health"
```

### Teste 2: Enviar mensagem de teste
```bash
curl -X POST "http://187.127.18.17:43654/message/sendText/WORLD%20METALIC" \
  -H "Content-Type: application/json" \
  -H "apikey: q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6" \
  -d '{
    "number": "5541984659663",
    "text": "Teste de integração World Metalic IA ✅"
  }'
```

### Teste 3: Simular webhook
```bash
curl -X POST "http://187.127.18.17:48627/webhook/evolution" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "data": {
      "key": {
        "remoteJid": "5541999999999@s.whatsapp.net",
        "fromMe": false
      },
      "pushName": "Cliente Teste",
      "message": {
        "conversation": "Olá, quero analisar um edital"
      },
      "messageTimestamp": 1700000000
    }
  }'
```

---

## Monitoramento e Logs

### Verificar logs no OpenClaw
- Acesse o painel → Logs / Histórico
- Filtre por projeto `openclaw-h3ur`
- Verifique erros e tempos de resposta

### Métricas importantes
- Tempo médio de resposta do agente
- Taxa de roteamento correto
- Quantidade de mensagens processadas/dia
- Erros de processamento de PDF
- Satisfação do cliente (implementar pesquisa)

---

## Próximos Passos Após Implantação

1. **Semana 1-2**: Monitorar conversas e ajustar prompts
2. **Semana 3**: Adicionar mais dados à base de conhecimento
3. **Mês 2**: Implementar dashboard de métricas
4. **Mês 3**: Automatizar monitoramento de editais (scraping/API PNCP)
5. **Mês 4+**: Escalar para novos clientes
