# Guia de Implantação — World Metalic IA

## Pré-requisitos

- VPS com OpenClaw rodando em `http://187.127.18.17:48627`
- Evolution API rodando em `http://187.127.18.17:43654`
- Instância "WORLD METALIC" conectada ao WhatsApp `+5541984659663`
- Cursor IDE instalado e conectado à VPS
- Conta no Groq (https://console.groq.com) com API Key

---

## Passo 1: Configurar Groq API

1. Acesse https://console.groq.com
2. Gere uma API Key
3. No arquivo `.env`, substitua `sua_groq_api_key_aqui` pela chave real
4. Modelo recomendado: `llama-3.3-70b-versatile`

---

## Passo 2: Configurar Webhook na Evolution API

1. Acesse o painel da Evolution: http://187.127.18.17:43654/manager/login
2. Selecione a instância "WORLD METALIC"
3. Vá em **Configurações → Webhook**
4. Configure:
   - **URL do Webhook**: `http://187.127.18.17:48627/webhook/evolution`
     (ajuste a porta conforme seu setup no OpenClaw)
   - **Eventos habilitados**:
     - ✅ messages.upsert (mensagens recebidas)
     - ✅ messages.update (status de mensagens)
     - ✅ connection.update (status da conexão)
   - **Webhook By Events**: Habilitado
5. Salve as configurações

### Testar o Webhook
Envie uma mensagem de teste para o WhatsApp `+5541984659663` e verifique nos logs se o webhook está recebendo.

---

## Passo 3: Configurar Agentes no OpenClaw

### 3.1 Acessar OpenClaw
1. Abra http://187.127.18.17:48627
2. Acesse o projeto `openclaw-h3ur`

### 3.2 Criar Agente de Atendimento
1. Clique em "Novo Agente" ou equivalente
2. **Nome**: WM Assistente
3. **Descrição**: Agente de atendimento front — qualifica e roteia
4. **Modelo**: Groq / llama-3.3-70b-versatile
5. **System Prompt**: Copie o conteúdo de `src/agents/01-atendimento.md` (bloco entre ```)
6. **Temperatura**: 0.3
7. **Max Tokens**: 1024
8. Salve

### 3.3 Criar Agente Analista de Editais
1. **Nome**: WM Analista
2. **Modelo**: Groq / llama-3.3-70b-versatile
3. **System Prompt**: Copie de `src/agents/02-analista-editais.md`
4. **Temperatura**: 0.1
5. **Max Tokens**: 4096
6. Salve

### 3.4 Criar Agente Gerador de Propostas
1. **Nome**: WM Propostas
2. **Modelo**: Groq / llama-3.3-70b-versatile
3. **System Prompt**: Copie de `src/agents/03-gerador-propostas.md`
4. **Temperatura**: 0.2
5. **Max Tokens**: 4096
6. Salve

### 3.5 Criar Agente Monitorador
1. **Nome**: WM Monitor
2. **Modelo**: Groq / llama-3.3-70b-versatile
3. **System Prompt**: Copie de `src/agents/04-monitorador-editais.md`
4. **Temperatura**: 0.1
5. **Max Tokens**: 2048
6. Salve

---

## Passo 4: Configurar Base de Conhecimento (RAG)

### No OpenClaw:
1. Vá em "Base de Conhecimento" ou "Knowledge Base"
2. Faça upload dos seguintes arquivos:
   - `src/knowledge/base-licitacoes.md`
   - `src/knowledge/lei-14133-resumo.md`
   - `src/knowledge/lei-8666-resumo.md`
3. Faça upload dos templates:
   - `src/templates/proposta-comercial.md`
   - `src/templates/proposta-tecnica.md`
   - `src/templates/checklist-documentos.md`
4. Vincule a base de conhecimento aos agentes:
   - Agente Atendimento → todas as bases
   - Agente Analista → leis + base licitações
   - Agente Propostas → templates + base licitações
   - Agente Monitor → base licitações

---

## Passo 5: Configurar Fluxo de Atendimento

### No OpenClaw:
1. Vá em "Fluxos" ou "Flows"
2. Crie um novo fluxo baseado em `src/flows/fluxo-atendimento.json`
3. Configure o trigger como webhook da Evolution API
4. Mapeie os passos conforme o JSON do fluxo
5. Teste com uma mensagem real

---

## Passo 6: Teste Completo

### Teste 1: Atendimento Básico
1. Envie "Olá" para o WhatsApp
2. Verifique se recebe o menu de boas-vindas
3. Escolha uma opção e veja se o roteamento funciona

### Teste 2: Análise de Edital
1. Envie um PDF de edital para o WhatsApp
2. Verifique se recebe a mensagem "Analisando..."
3. Aguarde a análise completa
4. Verifique se contém: resumo, prazos, checklist

### Teste 3: Proposta
1. Peça para gerar uma proposta
2. Forneça os dados quando solicitado
3. Verifique o output

### Teste 4: Monitoramento
1. Peça para monitorar editais
2. Forneça CNAEs e palavras-chave
3. Verifique se os filtros são configurados corretamente

---

## Passo 7: Ajustes e Otimização

### Prompts
- Observe as primeiras 20-30 conversas reais
- Ajuste os prompts conforme necessidade
- Adicione exemplos de conversas boas ao prompt (few-shot)

### Performance
- Se as respostas estiverem lentas, considere usar `llama-3.1-8b-instant` como fallback
- Para análises longas, considere dividir em etapas

### Monitoramento
- Configure logs no OpenClaw
- Monitore taxa de respostas corretas
- Acompanhe feedback dos clientes

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Webhook não recebe mensagens | Verificar URL do webhook e firewall da VPS |
| Bot não responde | Verificar status da instância na Evolution API |
| Respostas muito lentas | Verificar latência do Groq / considerar modelo menor |
| PDF não é processado | Verificar se o OpenClaw tem acesso ao arquivo |
| Mensagens cortadas | Implementar split de mensagens (máx 4096 chars) |
| Instância desconectou | Reconectar via painel da Evolution API |

---

## Contatos

- **Evolution API Docs**: https://doc.evolution-api.com
- **Groq Console**: https://console.groq.com
- **PNCP API**: https://pncp.gov.br/api
