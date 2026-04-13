const http = require('http');
const https = require('https');
const { URL } = require('url');
const pdfParse = require('pdf-parse');

const PORT = process.env.PORT || 3000;
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_MODEL = process.env.XAI_MODEL || 'grok-4-1-fast-reasoning';

// Lista de números permitidos (se vazio, responde a todos)
const ALLOWED_NUMBERS = process.env.ALLOWED_NUMBERS
  ? process.env.ALLOWED_NUMBERS.split(',').map(n => n.trim()).filter(Boolean)
  : [];

const conversationHistory = new Map();
const MAX_HISTORY = 20;

function last8(n) {
  // Pega os últimos 8 dígitos — ignora DDI, DDD e o "9" extra do celular BR
  return n.replace(/\D/g, '').slice(-8);
}

function isAllowed(number) {
  if (ALLOWED_NUMBERS.length === 0) return true;
  const incoming8 = last8(number);
  return ALLOWED_NUMBERS.some(n => last8(n) === incoming8);
}

// ============================================================
// BASE DE CONHECIMENTO COMPLETA
// ============================================================

const KNOWLEDGE_BASE = `
## BASE DE CONHECIMENTO — LICITAÇÕES PÚBLICAS

### O que é Licitação
Licitação é o procedimento administrativo pelo qual a Administração Pública seleciona a proposta mais vantajosa para contratar obras, serviços, compras e alienações. É obrigatória para todos os órgãos da administração direta e indireta da União, Estados, DF e Municípios.

### Legislação Vigente
- **Lei 14.133/2021** (Nova Lei de Licitações): vigente desde 01/04/2021, substituiu a Lei 8.666/93 a partir de 30/12/2023. PADRÃO ATUAL.
- **Lei 8.666/93** (revogada): ainda aplicável a processos iniciados antes de 30/12/2023.
- **LC 123/2006**: Estatuto da ME/EPP — tratamento diferenciado.
- **Decreto 10.024/2019**: Pregão Eletrônico federal.

### Modalidades (Lei 14.133/2021 — Art. 28)
1. **Pregão**: obrigatório para bens e serviços comuns. Preferencialmente eletrônico. Critério: menor preço/maior desconto.
2. **Concorrência**: qualquer contratação, obras e serviços de engenharia.
3. **Concurso**: trabalho técnico, científico ou artístico.
4. **Leilão**: alienação de bens.
5. **Diálogo Competitivo**: inovação tecnológica quando o objeto não pode ser definido precisamente.

### Prazos de Publicidade (Art. 55)
| Modalidade | Prazo mínimo |
|---|---|
| Pregão | 8 dias úteis |
| Concorrência — bens/serviços | 15 dias úteis |
| Concorrência — obras/engenharia | 25 dias úteis |
| Concurso | 35 dias úteis |
| Leilão | 15 dias úteis |
| Diálogo Competitivo | 25 dias úteis |

### Impugnação e Esclarecimentos
- **Impugnação**: até 3 dias úteis antes da abertura (Lei 14.133) / até 2 dias úteis (Lei 8.666)
- **Esclarecimentos**: até 3 dias úteis antes da abertura

### Documentos de Habilitação (Art. 62-70, Lei 14.133/2021)

**Habilitação Jurídica:**
- Contrato social com última alteração ou consolidação
- Documento de identidade do representante legal
- Procuração (se representante não for sócio)

**Regularidade Fiscal e Trabalhista:**
- CNPJ
- Certidão Conjunta Negativa (Receita Federal + INSS + Dívida Ativa) — validade 180 dias — emitir em: solucoes.receita.fazenda.gov.br
- CRF do FGTS — validade 30 dias — emitir em: consulta-crf.caixa.gov.br
- CND Estadual (SEFAZ do estado)
- CND Municipal (Prefeitura)
- CNDT (Certidão Negativa de Débitos Trabalhistas) — validade 180 dias — emitir em: tst.jus.br/certidao

**Qualificação Econômico-Financeira:**
- Balanço patrimonial do último exercício
- Certidão negativa de falência — validade 90 dias
- Índices contábeis: LG = (AC + RLP)/(PC + PNC) ≥ 1; LC = AC/PC ≥ 1; SG = AT/(PC + PNC) ≥ 1

**Qualificação Técnica:**
- Registro no conselho profissional (CREA, CAU, CRA conforme objeto)
- Atestados de capacidade técnica
- Indicação de equipe técnica

**Declarações Obrigatórias:**
- Não emprego de menores (Art. 7º, XXXIII, CF)
- Inexistência de fatos impeditivos
- Elaboração independente de proposta
- Declaração ME/EPP (se aplicável)

### Tratamento Diferenciado ME/EPP (LC 123/2006)
- **Empate ficto**: ME/EPP com proposta até 5% superior (pregão) ou 10% (demais) podem dar lance final
- **Regularidade fiscal**: prazo de 5 dias úteis para regularização após habilitação
- **Licitação exclusiva**: contratações até R$ 80.000,00
- **Cota reservada**: até 25% do objeto para ME/EPP

### Critérios de Julgamento (Art. 33)
1. Menor Preço (mais comum)
2. Maior Desconto (sobre tabela de referência)
3. Melhor Técnica ou Conteúdo Artístico
4. Técnica e Preço (ponderação)
5. Maior Lance (leilão)
6. Maior Retorno Econômico (contrato de eficiência)

### Contratação Direta (Art. 74-75)
- **Dispensa — obras/engenharia**: até R$ 100.000,00
- **Dispensa — outros serviços/compras**: até R$ 50.000,00
- **Inexigibilidade**: competição inviável (fornecedor exclusivo, serviço técnico singular)

### Sanções (Art. 155-163)
- Advertência → Multa → Impedimento de licitar (até 3 anos) → Declaração de inidoneidade (3 a 6 anos)

### Portais Oficiais
- **PNCP**: pncp.gov.br (todos os órgãos federais, estaduais e municipais)
- **Compras.gov.br**: gov.br/compras (governo federal)
- **BLL**: bll.org.br
- **Compras Paraná**: comprasparana.pr.gov.br

### Perguntas Frequentes
- **Certidão positiva com efeito de negativa**: tem o mesmo valor que certidão negativa — pode ser usada.
- **Licitação deserta x fracassada**: Deserta = ninguém apareceu. Fracassada = todos inabilitados/desclassificados.
- **SRP**: Sistema de Registro de Preços — registra preços para contratações futuras sem obrigação de contratar.
- **SICAF**: Sistema de cadastro federal — muitos editais aceitam documentos via SICAF.

---

## TEMPLATE — PROPOSTA COMERCIAL

Ao [ÓRGÃO CONTRATANTE] — Ref.: [MODALIDADE] nº [NÚMERO DO EDITAL] — Processo nº [NÚMERO]

**1. IDENTIFICAÇÃO DO PROPONENTE**
Razão Social: [RAZÃO SOCIAL] | CNPJ: [CNPJ] | Endereço: [ENDEREÇO] | Representante: [NOME] | CPF: [CPF]

**2. PROPOSTA DE PREÇOS**
| Item | Descrição | Unid. | Qtd. | Valor Unit. (R$) | Valor Total (R$) |
|---|---|---|---|---|---|
| 01 | [PREENCHER] | [UN] | [QTD] | [VALOR] | [VALOR] |
VALOR TOTAL: R$ [VALOR] ([POR EXTENSO])

**3. CONDIÇÕES**
- Validade: [PRAZO, MÍNIMO 60] dias corridos
- Prazo de entrega/execução: [PRAZO CONFORME EDITAL]
- Local: [CONFORME EDITAL]
- Pagamento: conforme edital

**4. DECLARAÇÕES** (incluir todas as declarações obrigatórias conforme edital)

[Cidade], [Data] — [Nome do Representante] / [Cargo] / CPF: [CPF]

*Proposta gerada com auxílio de IA — revisão humana obrigatória antes do envio.*

---

## CHECKLIST PADRÃO DE DOCUMENTOS

**Habilitação Jurídica:** Contrato social + RG do representante + Procuração (se necessário)
**Regularidade Fiscal:** CNPJ + CND Federal + CRF FGTS + CND Estadual + CND Municipal + CNDT
**Econômico-Financeira:** Balanço + Certidão de falência + Índices contábeis (LG, LC, SG ≥ 1)
**Qualificação Técnica:** Registro conselho + Atestados + Equipe técnica
**Declarações:** Não emprego menores + Fatos impeditivos + Elaboração independente + ME/EPP (se aplicável)
**Proposta:** Proposta comercial + Planilha de preços + Proposta técnica (se exigida)

Dicas: Verifique validade de todas as certidões. ME/EPP tem 5 dias úteis extras para regularização fiscal.
`;

// ============================================================
// SYSTEM PROMPT PRINCIPAL
// ============================================================

const SYSTEM_PROMPT = `Você é a WM Assistente, assistente virtual da World Metalic, empresa especializada em assessoria para licitações públicas em diversos segmentos.

## Sua Personalidade
- Profissional, objetiva e acolhedora
- Linguagem clara e acessível — sem juridiquês desnecessário
- Trate o cliente pelo nome após ele se identificar
- Use emojis com moderação (máximo 1-2 por mensagem)
- Responda sempre em português brasileiro

## Menu de Boas-vindas (use na primeira mensagem de cada contato)
"Olá! 👋 Sou a assistente virtual da World Metalic, especializada em licitações públicas.

Posso te ajudar com:
1️⃣ Monitorar editais para sua empresa
2️⃣ Analisar um edital específico
3️⃣ Montar uma proposta comercial ou técnica
4️⃣ Tirar dúvidas sobre licitações

Como posso te ajudar hoje?"

## Suas Capacidades

### Atendimento e Qualificação
- Para monitoramento: colete nome, CNPJ, CNAEs, palavras-chave, região, faixa de valor
- Para análise de edital: peça o link do edital ou PDF
- Para proposta: peça edital + dados completos da empresa (razão social, CNPJ, endereço, representante)
- Para dúvidas: use a base de conhecimento abaixo

### Análise de Editais
Ao receber link ou conteúdo de edital, produza análise estruturada com:
1. **RESUMO EXECUTIVO** — objeto, órgão, número, valor estimado, recomendação (PARTICIPAR ✅ / AVALIAR COM CAUTELA ⚠️ / NÃO RECOMENDADO ❌)
2. **DADOS BÁSICOS** — modalidade, critério de julgamento, lei aplicável, exclusividade ME/EPP
3. **PRAZOS CRÍTICOS** — impugnação, esclarecimentos, abertura, validade da proposta, execução
4. **REQUISITOS DE HABILITAÇÃO** — jurídica, fiscal, econômica, técnica (liste cada documento)
5. **ALERTAS** ⚠️ — cláusulas restritivas, exigências desproporcionais, prazos curtos, inconsistências
6. **CHECKLIST** — lista completa com [ ] para cada documento necessário
7. **RECOMENDAÇÃO FINAL** — com justificativa objetiva

### Geração de Propostas
- Use o template da base de conhecimento como estrutura
- Marque [PREENCHER] em todos os campos que dependem de dados do cliente
- Inclua todas as declarações obrigatórias citadas no edital
- NUNCA invente dados da empresa — solicite ao cliente
- Sempre inclua: "Proposta gerada com auxílio de IA — revisão humana obrigatória antes do envio"

### Análise de PDF
Quando o cliente enviar um PDF de edital:
- Analise o conteúdo e produza a análise estruturada completa (igual ao item acima)
- Confirme o recebimento e informe que está analisando

## Regras Absolutas
- NUNCA forneça parecer jurídico definitivo — sempre diga que é análise preliminar
- NUNCA invente dados, prazos ou valores
- Mensagens de áudio → peça para reformular por escrito
- Horário de atendimento humano: Segunda a Sexta, 8h às 18h (Brasília)
- Fora do horário → informe que a equipe retorna no próximo dia útil
- Máximo 4096 caracteres por mensagem — divida se necessário

${KNOWLEDGE_BASE}`;

// ============================================================
// UTILITÁRIOS
// ============================================================

function log(module, msg) {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`[${ts}] [${module}] ${msg}`);
}

function makeRequest(urlStr, options, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function splitMessage(text, max) {
  if (text.length <= max) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= max) { chunks.push(remaining); break; }
    let i = remaining.lastIndexOf('\n', max);
    if (i < max * 0.5) i = remaining.lastIndexOf(' ', max);
    if (i === -1) i = max;
    chunks.push(remaining.substring(0, i));
    remaining = remaining.substring(i).trim();
  }
  return chunks;
}

function getTextContent(message) {
  return message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.ephemeralMessage?.message?.extendedTextMessage?.text || null;
}

// ============================================================
// xAI / GROK
// ============================================================

async function callGrok(number, userMessage, maxTokens = 1500) {
  const history = conversationHistory.get(number) || [];
  history.push({ role: 'user', content: userMessage });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-MAX_HISTORY)
  ];

  const res = await makeRequest('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`
    }
  }, { model: XAI_MODEL, messages, max_tokens: maxTokens, temperature: 0.3 });

  if (res.status !== 200) {
    log('xAI', `Erro ${res.status}: ${JSON.stringify(res.body).substring(0, 200)}`);
    throw new Error(`xAI API error: ${res.status}`);
  }

  const reply = res.body.choices[0].message.content;
  history.push({ role: 'assistant', content: reply });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  conversationHistory.set(number, history);

  return reply;
}

// ============================================================
// EVOLUTION API
// ============================================================

async function sendWhatsApp(number, text) {
  const chunks = splitMessage(text, 4000);
  for (const chunk of chunks) {
    await makeRequest(
      `${EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY }
      },
      { number, text: chunk }
    );
    if (chunks.length > 1) await sleep(1200);
  }
  log('WhatsApp', `Enviado para ${number} (${chunks.length} parte(s))`);
}

async function downloadMedia(mediaUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(mediaUrl);
    const lib = url.protocol === 'https:' ? https : http;
    const chunks = [];
    lib.get(url, (res) => {
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ============================================================
// HANDLERS
// ============================================================

async function handleTextMessage(number, name, text) {
  log('Handler', `Texto de ${name} (${number}): "${text.substring(0, 80)}"`);
  const input = name !== 'Cliente' ? `[${name}]: ${text}` : text;
  const reply = await callGrok(number, input);
  await sendWhatsApp(number, reply);
}

async function getPdfBase64(msgKey) {
  const endpoints = [
    {
      url: `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${encodeURIComponent(EVOLUTION_INSTANCE)}`,
      body: { message: { key: msgKey }, convertToMp4: false }
    },
    {
      url: `${EVOLUTION_API_URL}/message/getBase64/${encodeURIComponent(EVOLUTION_INSTANCE)}`,
      body: { key: msgKey }
    }
  ];

  for (const ep of endpoints) {
    try {
      log('PDF', `Tentando ${ep.url.split('/').slice(-1)[0]} com key=${JSON.stringify(ep.body.message?.key || ep.body.key)}`);
      const res = await makeRequest(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY }
      }, ep.body);
      const b64 = res.body?.base64 || res.body?.data?.base64 || res.body?.mediaUrl;
      log('PDF', `Status=${res.status} b64=${b64 ? b64.length + ' chars' : 'null'} body_keys=${Object.keys(res.body || {}).join(',')}`);
      if ((res.status === 200 || res.status === 201) && b64 && b64.length > 100) {
        log('PDF', `Base64 obtido via ${ep.url.split('/').pop()} (${Math.round(b64.length / 1024)}KB)`);
        return b64;
      }
    } catch (err) {
      log('PDF', `Endpoint falhou (${ep.url.split('/').pop()}): ${err.message}`);
    }
  }
  return null;
}

async function extractPdfText(base64) {
  try {
    const buffer = Buffer.from(base64, 'base64');
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    log('PDF', `Falha ao extrair texto: ${err.message}`);
    return '';
  }
}

async function callGrokWithDocument(number, fileName, base64) {
  const history = conversationHistory.get(number) || [];

  log('PDF', `Extraindo texto de "${fileName}"...`);
  const pdfText = await extractPdfText(base64);

  let userText;
  if (pdfText && pdfText.trim().length > 50) {
    log('PDF', `Texto extraído: ${pdfText.length} caracteres`);
    userText =
      `Analise este documento ("${fileName}") na íntegra e responda de forma completa e direta.\n\n` +
      `— Se for *edital de licitação*: produza a análise estruturada completa (resumo executivo, dados básicos, prazos críticos, habilitação, alertas ⚠️, checklist e recomendação final).\n` +
      `— Se for *convocação de diligência de habilitação*: identifique o que está sendo solicitado, quais documentos devem ser providenciados, prazos e como obter cada documento.\n` +
      `— Se for *contrato, ata, termo ou outro documento*: resuma os pontos principais, obrigações, prazos e alertas relevantes.\n` +
      `— Para qualquer tipo: seja objetivo e prático.\n\n` +
      `=== CONTEÚDO DO DOCUMENTO ===\n${pdfText}\n=== FIM DO DOCUMENTO ===`;
  } else {
    log('PDF', `Texto não extraível (PDF escaneado/imagem). Enviando base64 para visão.`);
    userText =
      `Analise este documento ("${fileName}") que pode ser escaneado (imagem). Extraia todas as informações visíveis.\n\n` +
      `— Se for *edital de licitação*: produza análise completa.\n` +
      `— Se for *convocação de diligência de habilitação*: identifique documentos solicitados e prazos.\n` +
      `— Para qualquer tipo: seja objetivo e prático.\n\n` +
      `[Documento escaneado — realize OCR visual e analise todo conteúdo visível]`;
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10),
    { role: 'user', content: userText }
  ];

  const res = await makeRequest('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`
    }
  }, { model: XAI_MODEL, messages, max_tokens: 4000, temperature: 0.1 });

  if (res.status !== 200) {
    log('PDF', `xAI retornou ${res.status}: ${JSON.stringify(res.body).substring(0, 300)}`);
    throw new Error(`xAI error ${res.status}`);
  }

  const reply = res.body.choices[0].message.content;

  // Salva no histórico
  history.push({ role: 'user', content: `[enviou documento: ${fileName}]` });
  history.push({ role: 'assistant', content: reply });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  conversationHistory.set(number, history);

  return reply;
}

async function handlePdfMessage(number, name, docInfo, msgKey) {
  const fileName = docInfo?.fileName || docInfo?.title || 'documento.pdf';
  log('Handler', `PDF de ${name} (${number}): ${fileName}`);

  // Avisa que está processando
  await sendWhatsApp(number, `📄 Recebi o arquivo *${fileName}*\n\nAnalisando o documento... ⏳`);

  // Tenta obter o base64 do PDF
  const base64 = await getPdfBase64(msgKey);

  if (base64) {
    try {
      const reply = await callGrokWithDocument(number, fileName, base64);
      const chunks = splitMessage(reply, 4000);
      for (const chunk of chunks) {
        await sendWhatsApp(number, chunk);
        if (chunks.length > 1) await sleep(1500);
      }
      log('PDF', `Análise concluída (${chunks.length} parte(s))`);
      return;
    } catch (err) {
      log('PDF', `Grok falhou com base64: ${err.message}`);
    }
  }

  // Se não conseguiu base64, pede o documento de outro jeito — mas de forma inteligente
  log('PDF', `Não obteve base64 para ${fileName} — solicitando ao cliente`);
  const fallbackPrompt = `Você recebeu a notificação de que o cliente ${name} enviou o documento "${fileName}" mas o arquivo não pôde ser carregado no momento.

Responda de forma natural e útil:
- Se o nome do arquivo sugere que é um edital (ex: contém "edital", "pregão", "concorrência", "licitação"): peça o link do edital no portal (PNCP, Compras.gov.br ou portal do órgão)
- Se sugere diligência de habilitação: explique que precisa ver o conteúdo e peça para copiar e colar o texto da convocação, ou reenviar o arquivo
- Para qualquer caso: seja breve, prestativo, não use o word "desculpe" nem se explique demais`;

  const reply = await callGrok(number, fallbackPrompt, 400);
  await sendWhatsApp(number, reply);
}

async function handleDocumentMessage(number, name, docInfo, msgKey) {
  const mime = docInfo?.mimetype || '';

  if (mime === 'application/pdf') {
    await handlePdfMessage(number, name, docInfo, msgKey);
    return;
  }

  await sendWhatsApp(number,
    `Recebi o arquivo *${docInfo?.fileName || 'documento'}*, mas só consigo analisar editais em formato PDF. 📄\n\nPode reenviar em PDF ou compartilhar o link do edital no portal?`
  );
}

// ============================================================
// WEBHOOK
// ============================================================

async function handleWebhook(body) {
  const event = body.event;
  if (event !== 'MESSAGES_UPSERT' && event !== 'messages.upsert') return;

  const data = body.data;
  if (!data) return;

  const messages = Array.isArray(data) ? data : [data];

  for (const msg of messages) {
    if (msg?.key?.fromMe) continue;

    const jid = msg?.key?.remoteJid || '';
    if (!jid.includes('@s.whatsapp.net')) continue;

    const number = jid.replace('@s.whatsapp.net', '');
    const senderName = msg.pushName || 'Cliente';
    const message = msg.message;

    if (!message) continue;

    // Verifica se o número está na lista de permitidos
    if (!isAllowed(number)) {
      log('Filtro', `Mensagem ignorada de ${senderName} (${number}) — número não permitido`);
      continue;
    }

    try {
      if (message.conversation || message.extendedTextMessage) {
        const text = getTextContent(message);
        if (text?.trim()) await handleTextMessage(number, senderName, text);

      } else if (message.documentMessage) {
        await handleDocumentMessage(number, senderName, message.documentMessage, msg.key);

      } else if (message.audioMessage || message.pttMessage) {
        await sendWhatsApp(number,
          'Recebi seu áudio! 🎙️\n\nNo momento só processo mensagens de texto e documentos PDF. Poderia escrever sua solicitação?'
        );

      } else if (message.imageMessage) {
        await sendWhatsApp(number,
          'Recebi sua imagem! 📷\n\nPara análise de editais, por favor envie o documento em PDF ou compartilhe o link do edital.'
        );
      }

    } catch (err) {
      log('Erro', `Falha ao processar mensagem de ${number}: ${err.message}`);
      await sendWhatsApp(number,
        'Desculpe, estamos com uma instabilidade momentânea. 🔧\nSua solicitação foi registrada e nossa equipe entrará em contato em breve.'
      ).catch(() => {});
    }
  }
}

// ============================================================
// SERVIDOR HTTP
// ============================================================

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'wm-bot',
      model: XAI_MODEL,
      instance: EVOLUTION_INSTANCE,
      uptime: Math.floor(process.uptime()) + 's'
    }));
    return;
  }

  if (req.method === 'POST' && req.url === '/webhook/evolution') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
      try {
        await handleWebhook(JSON.parse(body));
      } catch (err) {
        log('Erro', `Webhook parse error: ${err.message}`);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  log('Server', `WM Bot rodando na porta ${PORT}`);
  log('Server', `Modelo: ${XAI_MODEL} | Instância: ${EVOLUTION_INSTANCE}`);
  log('Server', `Base de conhecimento: licitações + leis + templates carregados ✅`);
  if (ALLOWED_NUMBERS.length > 0) {
    log('Server', `Filtro ativo: apenas ${ALLOWED_NUMBERS.length} número(s) permitido(s): ${ALLOWED_NUMBERS.join(', ')}`);
  } else {
    log('Server', `Filtro: DESATIVADO — respondendo a todos os números`);
  }
});
