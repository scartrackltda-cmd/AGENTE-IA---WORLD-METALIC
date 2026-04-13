/**
 * World Metalic — Webhook Evolution API
 * 
 * Este arquivo processa as mensagens recebidas via WhatsApp (Evolution API)
 * e encaminha para o OpenClaw para processamento pelos agentes de IA.
 * 
 * Configuração:
 * - Registrar este webhook na Evolution API
 * - URL: http://SUA_VPS:PORTA/webhook/evolution
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://187.127.18.17:43654';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'q6bOgsmWkvMTh4Cz7odqKqa2CG2KFia6';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'WORLD METALIC';
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://187.127.18.17:48627';

/**
 * Envia mensagem de texto via WhatsApp (Evolution API)
 */
async function sendWhatsAppMessage(number, text) {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: number,
          text: text
        })
      }
    );

    const data = await response.json();
    console.log(`[WhatsApp] Mensagem enviada para ${number}:`, data);
    return data;
  } catch (error) {
    console.error(`[WhatsApp] Erro ao enviar mensagem:`, error);
    throw error;
  }
}

/**
 * Envia documento via WhatsApp (Evolution API)
 */
async function sendWhatsAppDocument(number, documentUrl, fileName, caption) {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendMedia/${encodeURIComponent(EVOLUTION_INSTANCE)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: number,
          mediatype: 'document',
          media: documentUrl,
          fileName: fileName,
          caption: caption || ''
        })
      }
    );

    const data = await response.json();
    console.log(`[WhatsApp] Documento enviado para ${number}:`, data);
    return data;
  } catch (error) {
    console.error(`[WhatsApp] Erro ao enviar documento:`, error);
    throw error;
  }
}

/**
 * Verifica status da instância
 */
async function checkInstanceStatus() {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${encodeURIComponent(EVOLUTION_INSTANCE)}`,
      {
        headers: { 'apikey': EVOLUTION_API_KEY }
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Status] Erro ao verificar instância:', error);
    return null;
  }
}

/**
 * Processa mensagem recebida do webhook
 * Esta função é chamada quando a Evolution API envia um evento
 */
async function processIncomingMessage(webhookData) {
  const event = webhookData.event;
  
  // Só processa mensagens novas
  if (event !== 'messages.upsert') {
    console.log(`[Webhook] Evento ignorado: ${event}`);
    return;
  }

  const message = webhookData.data;
  
  // Ignora mensagens do próprio bot
  if (message.key.fromMe) {
    return;
  }

  const senderNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
  const senderName = message.pushName || 'Cliente';
  const messageType = getMessageType(message);
  
  console.log(`[Webhook] Nova mensagem de ${senderName} (${senderNumber}): tipo=${messageType}`);

  try {
    switch (messageType) {
      case 'text':
        const textContent = message.message?.conversation || 
                           message.message?.extendedTextMessage?.text || '';
        await handleTextMessage(senderNumber, senderName, textContent);
        break;

      case 'document':
        const docInfo = message.message?.documentMessage;
        await handleDocumentMessage(senderNumber, senderName, docInfo);
        break;

      case 'audio':
        await sendWhatsAppMessage(senderNumber, 
          'Desculpe, no momento só consigo processar mensagens de texto e documentos PDF. 📝\n\nPoderia enviar sua solicitação por escrito?'
        );
        break;

      case 'image':
        await sendWhatsAppMessage(senderNumber,
          'Recebi sua imagem! 📷\n\nPara análise de editais, por favor envie o documento em formato PDF.'
        );
        break;

      default:
        await sendWhatsAppMessage(senderNumber,
          'Desculpe, não consigo processar esse tipo de mensagem. Por favor, envie texto ou documento PDF.'
        );
    }
  } catch (error) {
    console.error('[Webhook] Erro ao processar mensagem:', error);
    await sendWhatsAppMessage(senderNumber,
      'Desculpe, estamos com uma instabilidade momentânea. 🔧\nSua solicitação foi registrada e nossa equipe entrará em contato em breve.'
    );
  }
}

/**
 * Identifica o tipo da mensagem
 */
function getMessageType(message) {
  if (message.message?.conversation || message.message?.extendedTextMessage) return 'text';
  if (message.message?.documentMessage) return 'document';
  if (message.message?.audioMessage) return 'audio';
  if (message.message?.imageMessage) return 'image';
  if (message.message?.videoMessage) return 'video';
  if (message.message?.stickerMessage) return 'sticker';
  return 'unknown';
}

/**
 * Processa mensagem de texto → envia para agente de atendimento
 */
async function handleTextMessage(number, name, text) {
  console.log(`[Handler] Processando texto de ${name}: "${text.substring(0, 50)}..."`);

  // Aqui você integra com o OpenClaw
  // O OpenClaw vai rotear para o agente correto baseado no conteúdo

  const openclawPayload = {
    project: 'openclaw-h3ur',
    agent: 'atendimento',
    input: {
      sender_number: number,
      sender_name: name,
      message: text,
      type: 'text',
      timestamp: new Date().toISOString()
    }
  };

  // Envia para OpenClaw processar
  const response = await fetch(`${OPENCLAW_URL}/api/v1/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(openclawPayload)
  });

  const result = await response.json();
  
  // Envia resposta do agente de volta via WhatsApp
  if (result.output) {
    await sendWhatsAppMessage(number, result.output);
  }
}

/**
 * Processa documento (PDF) → envia para agente analista
 */
async function handleDocumentMessage(number, name, docInfo) {
  console.log(`[Handler] Processando documento de ${name}: ${docInfo.fileName}`);

  // Verifica se é PDF
  if (docInfo.mimetype !== 'application/pdf') {
    await sendWhatsAppMessage(number,
      `Recebi o arquivo "${docInfo.fileName}", mas só consigo analisar documentos em formato PDF.\n\nPor favor, envie o edital em PDF.`
    );
    return;
  }

  // Notifica o cliente que está analisando
  await sendWhatsAppMessage(number,
    `📄 Recebi o edital "${docInfo.fileName}"!\n\nEstou analisando o documento. Isso pode levar alguns minutos, dependendo do tamanho. Aguarde...`
  );

  // Envia para OpenClaw — agente analista
  const openclawPayload = {
    project: 'openclaw-h3ur',
    agent: 'analista',
    input: {
      sender_number: number,
      sender_name: name,
      document_url: docInfo.url,
      document_name: docInfo.fileName,
      mime_type: docInfo.mimetype,
      type: 'document',
      timestamp: new Date().toISOString()
    }
  };

  const response = await fetch(`${OPENCLAW_URL}/api/v1/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(openclawPayload)
  });

  const result = await response.json();

  // Envia análise de volta
  if (result.output) {
    // WhatsApp tem limite de ~4096 caracteres por mensagem
    const chunks = splitMessage(result.output, 4000);
    for (const chunk of chunks) {
      await sendWhatsAppMessage(number, chunk);
      await sleep(1000); // Intervalo entre mensagens
    }
  }
}

/**
 * Divide mensagem longa em partes
 */
function splitMessage(text, maxLength) {
  if (text.length <= maxLength) return [text];
  
  const chunks = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    
    let splitIndex = remaining.lastIndexOf('\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }
    
    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trim();
  }
  
  return chunks;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exporta funções para uso no OpenClaw ou servidor Express
module.exports = {
  processIncomingMessage,
  sendWhatsAppMessage,
  sendWhatsAppDocument,
  checkInstanceStatus,
  handleTextMessage,
  handleDocumentMessage,
  splitMessage
};
