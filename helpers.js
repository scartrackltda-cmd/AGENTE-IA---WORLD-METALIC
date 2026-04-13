/**
 * World Metalic IA — Funções Utilitárias
 */

/**
 * Formata número de telefone para padrão WhatsApp
 * @param {string} phone - Número do telefone
 * @returns {string} Número formatado (ex: 5541984659663)
 */
function formatPhoneNumber(phone) {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');
  
  // Adiciona código do país se não tiver
  if (cleaned.length === 11) {
    cleaned = '55' + cleaned;
  } else if (cleaned.length === 10) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

/**
 * Formata valor em Reais
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado (ex: R$ 1.234,56)
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Converte valor numérico para extenso em português
 * @param {number} value - Valor numérico
 * @returns {string} Valor por extenso
 */
function numberToWords(value) {
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (value === 0) return 'zero reais';
  if (value === 100) return 'cem';

  const intPart = Math.floor(value);
  const decPart = Math.round((value - intPart) * 100);

  let result = '';

  if (intPart >= 1000000) {
    const millions = Math.floor(intPart / 1000000);
    result += millions === 1 ? 'um milhão' : numberToWords(millions).replace(' reais', '') + ' milhões';
    const remainder = intPart % 1000000;
    if (remainder > 0) result += ' e ' + numberToWords(remainder).replace(' reais', '');
  } else if (intPart >= 1000) {
    const thousands = Math.floor(intPart / 1000);
    result += thousands === 1 ? 'mil' : numberToWords(thousands).replace(' reais', '') + ' mil';
    const remainder = intPart % 1000;
    if (remainder > 0) result += (remainder < 100 ? ' e ' : ' ') + numberToWords(remainder).replace(' reais', '');
  } else if (intPart >= 100) {
    const h = Math.floor(intPart / 100);
    result += intPart === 100 ? 'cem' : hundreds[h];
    const remainder = intPart % 100;
    if (remainder > 0) result += ' e ' + numberToWords(remainder).replace(' reais', '');
  } else if (intPart >= 20) {
    const t = Math.floor(intPart / 10);
    result += tens[t];
    const u = intPart % 10;
    if (u > 0) result += ' e ' + units[u];
  } else if (intPart >= 10) {
    result += teens[intPart - 10];
  } else if (intPart > 0) {
    result += units[intPart];
  }

  if (intPart > 0) {
    result += intPart === 1 ? ' real' : ' reais';
  }

  if (decPart > 0) {
    if (intPart > 0) result += ' e ';
    result += numberToWords(decPart).replace(' reais', '').replace(' real', '');
    result += decPart === 1 ? ' centavo' : ' centavos';
  }

  return result;
}

/**
 * Formata data para padrão brasileiro
 * @param {Date|string} date
 * @returns {string} Data formatada (ex: 13/04/2026)
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata data por extenso
 * @param {Date|string} date
 * @returns {string} Data por extenso (ex: 13 de abril de 2026)
 */
function formatDateExtended(date) {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Calcula dias úteis entre duas datas
 * @param {Date} start
 * @param {Date} end
 * @returns {number} Número de dias úteis
 */
function businessDaysBetween(start, end) {
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Verifica se está dentro do horário de atendimento
 * @returns {boolean}
 */
function isBusinessHours() {
  const now = new Date();
  const brasiliaOffset = -3;
  const utcHours = now.getUTCHours();
  const brasiliaHours = utcHours + brasiliaOffset;
  const day = now.getDay();
  
  // Segunda a sexta, 8h às 18h
  return day >= 1 && day <= 5 && brasiliaHours >= 8 && brasiliaHours < 18;
}

/**
 * Valida CNPJ
 * @param {string} cnpj
 * @returns {boolean}
 */
function isValidCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i]) * weight[i];
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj[12]) !== digit) return false;

  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i]) * weight[i];
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cnpj[13]) === digit;
}

/**
 * Formata CNPJ
 * @param {string} cnpj
 * @returns {string} CNPJ formatado (ex: 12.345.678/0001-90)
 */
function formatCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, '');
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Detecta intenção do cliente baseado em palavras-chave
 * @param {string} message
 * @returns {string} Intenção detectada
 */
function detectIntent(message) {
  const text = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  const intents = {
    'analise_edital': ['edital', 'analisar', 'analise', 'pdf', 'documento', 'ler edital'],
    'gerar_proposta': ['proposta', 'preco', 'tecnica', 'montar', 'gerar', 'elaborar proposta'],
    'monitorar': ['monitorar', 'buscar', 'encontrar', 'editais', 'oportunidade', 'novos editais'],
    'duvida_legal': ['lei', 'prazo', 'impugnar', 'recurso', 'habilitacao', 'juridico', 'legal'],
    'saudacao': ['ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi'],
    'ajuda': ['ajuda', 'help', 'menu', 'opcoes', 'como funciona']
  };

  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(kw => text.includes(kw))) {
      return intent;
    }
  }

  return 'geral';
}

/**
 * Calcula índices contábeis
 */
function calcularIndices(dados) {
  const { ativoCirculante, realizavelLP, passivoCirculante, passivoNaoCirculante, ativoTotal } = dados;
  
  return {
    liquidezGeral: ((ativoCirculante + realizavelLP) / (passivoCirculante + passivoNaoCirculante)).toFixed(2),
    liquidezCorrente: (ativoCirculante / passivoCirculante).toFixed(2),
    solvenciaGeral: (ativoTotal / (passivoCirculante + passivoNaoCirculante)).toFixed(2)
  };
}

module.exports = {
  formatPhoneNumber,
  formatCurrency,
  numberToWords,
  formatDate,
  formatDateExtended,
  businessDaysBetween,
  isBusinessHours,
  isValidCNPJ,
  formatCNPJ,
  detectIntent,
  calcularIndices
};
