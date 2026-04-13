#!/bin/bash

# ============================================
# World Metalic IA — Script de Setup
# ============================================
# Execute com: chmod +x setup.sh && ./setup.sh

echo "============================================"
echo "  World Metalic IA — Setup Inicial"
echo "============================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar .env
echo -e "${YELLOW}[1/6] Verificando arquivo .env...${NC}"
if [ -f .env ]; then
    source .env
    if [ "$GROQ_API_KEY" == "sua_groq_api_key_aqui" ]; then
        echo -e "${RED}⚠️  GROQ_API_KEY não configurada no .env${NC}"
        echo "   Acesse https://console.groq.com e gere uma API Key"
        echo "   Depois edite o arquivo .env"
    else
        echo -e "${GREEN}✅ .env configurado${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "   Copie o .env.example para .env e configure"
    exit 1
fi

# Verificar conectividade Evolution API
echo ""
echo -e "${YELLOW}[2/6] Verificando Evolution API...${NC}"
EVOLUTION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $EVOLUTION_API_KEY" \
    "$EVOLUTION_API_URL/instance/connectionState/WORLD%20METALIC" 2>/dev/null)

if [ "$EVOLUTION_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Evolution API acessível${NC}"
    
    # Verificar status da instância
    INSTANCE_STATE=$(curl -s \
        -H "apikey: $EVOLUTION_API_KEY" \
        "$EVOLUTION_API_URL/instance/connectionState/WORLD%20METALIC" 2>/dev/null)
    echo "   Status da instância: $INSTANCE_STATE"
else
    echo -e "${RED}❌ Evolution API não acessível (HTTP $EVOLUTION_STATUS)${NC}"
    echo "   URL: $EVOLUTION_API_URL"
    echo "   Verifique se o serviço está rodando"
fi

# Verificar OpenClaw
echo ""
echo -e "${YELLOW}[3/6] Verificando OpenClaw...${NC}"
OPENCLAW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$OPENCLAW_URL" 2>/dev/null)

if [ "$OPENCLAW_STATUS" == "200" ] || [ "$OPENCLAW_STATUS" == "301" ] || [ "$OPENCLAW_STATUS" == "302" ]; then
    echo -e "${GREEN}✅ OpenClaw acessível${NC}"
else
    echo -e "${RED}❌ OpenClaw não acessível (HTTP $OPENCLAW_STATUS)${NC}"
    echo "   URL: $OPENCLAW_URL"
fi

# Verificar Groq API
echo ""
echo -e "${YELLOW}[4/6] Verificando Groq API...${NC}"
if [ "$GROQ_API_KEY" != "sua_groq_api_key_aqui" ]; then
    GROQ_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $GROQ_API_KEY" \
        "https://api.groq.com/openai/v1/models" 2>/dev/null)
    
    if [ "$GROQ_STATUS" == "200" ]; then
        echo -e "${GREEN}✅ Groq API acessível${NC}"
    else
        echo -e "${RED}❌ Groq API retornou HTTP $GROQ_STATUS${NC}"
        echo "   Verifique sua API Key"
    fi
else
    echo -e "${YELLOW}⏭️  Groq API não testada (API Key não configurada)${NC}"
fi

# Listar arquivos do projeto
echo ""
echo -e "${YELLOW}[5/6] Estrutura do projeto:${NC}"
echo ""
find . -type f -not -path './node_modules/*' -not -path './.git/*' | sort | head -30

# Resumo
echo ""
echo -e "${YELLOW}[6/6] Resumo da configuração:${NC}"
echo "============================================"
echo "  Empresa:    $EMPRESA_NOME"
echo "  WhatsApp:   $WHATSAPP_NUMBER"
echo "  Evolution:  $EVOLUTION_API_URL"
echo "  OpenClaw:   $OPENCLAW_URL"
echo "  Projeto:    $OPENCLAW_PROJECT"
echo "  Modelo:     $GROQ_MODEL"
echo "============================================"
echo ""
echo -e "${GREEN}Setup concluído!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Configure a GROQ_API_KEY no .env (se ainda não fez)"
echo "  2. Configure os agentes no OpenClaw (ver docs/guia-openclaw.md)"
echo "  3. Configure o webhook da Evolution API (ver docs/guia-implantacao.md)"
echo "  4. Teste enviando uma mensagem para o WhatsApp"
echo ""
