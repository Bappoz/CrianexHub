#!/usr/bin/env bash
# Teste RNF09 — Controle de acesso por linha (RLS)
# Acessa DIRETAMENTE o banco (PostgREST/Supabase) com uma credencial NÃO
# autorizada — a chave pública (anon/publishable) — e verifica que toda tabela
# com dados sensíveis (crm_columns, clients, client_cards, notifications)
# bloqueia leitura e escrita. Um acesso 200 com dados = FALHA (vazamento de RLS).
#
# Lê SUPABASE_URL e PUBLIC_SUPABASE_PUBLISHABLE_KEY do .env na raiz do projeto.
# Uso: ./scripts/test-rnf09-rls.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${1:-$SCRIPT_DIR/../.env}"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
PASSED=0; FAILED=0

get_env() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d $'"\'\r'; }

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Erro: .env não encontrado em $ENV_FILE${NC}"; exit 1
fi

SUPABASE_URL="$(get_env SUPABASE_URL)"
[ -z "$SUPABASE_URL" ] && SUPABASE_URL="$(get_env PUBLIC_SUPABASE_URL)"
ANON_KEY="$(get_env PUBLIC_SUPABASE_PUBLISHABLE_KEY)"

if [ -z "$SUPABASE_URL" ] || [ -z "$ANON_KEY" ]; then
  echo -e "${RED}Erro: SUPABASE_URL ou PUBLIC_SUPABASE_PUBLISHABLE_KEY ausentes no .env${NC}"; exit 1
fi

echo "========================================"
echo " RNF09 — Row Level Security (acesso direto)"
echo " Alvo      : $SUPABASE_URL/rest/v1"
echo " Credencial: chave PÚBLICA (anon) — perfil NÃO autorizado"
echo " Esperado  : leitura/escrita BLOQUEADA em toda tabela sensível"
echo "========================================"
echo ""

# Considera "bloqueado" = status != 200  OU  (200 e corpo vazio '[]')
check_read() {
  local table="$1"
  printf "  SELECT %-16s (anon)  " "$table"
  local resp status body
  resp=$(curl -s -w $'\n%{http_code}' \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    "$SUPABASE_URL/rest/v1/$table?select=*&limit=1")
  status=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d' | tr -d '[:space:]')

  if [ "$status" != "200" ]; then
    echo -e "${GREEN}✅ BLOQUEADO → HTTP $status${NC}"
    PASSED=$((PASSED + 1))
  elif [ "$body" = "[]" ]; then
    echo -e "${GREEN}✅ BLOQUEADO → 200 mas 0 linhas (RLS filtrou)${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}❌ VAZOU → HTTP 200 com dados: ${body:0:60}...${NC}"
    FAILED=$((FAILED + 1))
  fi
}

check_write() {
  local table="$1" payload="$2"
  printf "  INSERT %-16s (anon)  " "$table"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$SUPABASE_URL/rest/v1/$table")

  if [ "$status" != "201" ] && [ "$status" != "200" ]; then
    echo -e "${GREEN}✅ BLOQUEADO → HTTP $status${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}❌ ESCREVEU → HTTP $status (RLS não bloqueou!)${NC}"
    FAILED=$((FAILED + 1))
  fi
}

echo "── Leitura direta com credencial não autorizada ──"
check_read "crm_columns"
check_read "clients"
check_read "client_cards"
check_read "notifications"

echo ""
echo "── Escrita direta com credencial não autorizada ──"
check_write "crm_columns" '{"title":"Coluna Invasora RNF09"}'
check_write "clients"     '{"nome":"Invasor RNF09","email":"hack@rnf09.com"}'

echo ""
echo "========================================"
echo -e " Resultado: ${GREEN}$PASSED passou(ram)${NC} / ${RED}$FAILED falhou(ram)${NC}"
echo "========================================"

if [ "$FAILED" -eq 0 ]; then
  echo -e " ${GREEN}RNF09 VALIDADO ✅  (RLS bloqueia acesso direto não autorizado)${NC}"; exit 0
else
  echo -e " ${RED}RNF09 FALHOU ❌  (dados sensíveis expostos)${NC}"; exit 1
fi
