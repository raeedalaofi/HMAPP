#!/bin/bash

# ========================================
# HMAPP - Fix Supabase API Keys
# Date: 22 Nov 2025
# ========================================

echo "🔧 HMAPP API Keys Fix Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup existing .env.local
if [ -f .env.local ]; then
    echo "📦 Backing up existing .env.local..."
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓${NC} Backup created"
    echo ""
fi

echo "⚠️  CRITICAL: Invalid Supabase API Keys Detected"
echo ""
echo "The SERVICE_ROLE_KEY in your .env.local is invalid."
echo "This is blocking all authentication functionality."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 ACTION REQUIRED:"
echo ""
echo "1. Open Supabase Dashboard:"
echo "   ${YELLOW}https://supabase.com/dashboard/project/cnckjkicdybgvmkofwok/settings/api${NC}"
echo ""
echo "2. Copy the following keys:"
echo "   - Project URL (should be: https://cnckjkicdybgvmkofwok.supabase.co)"
echo "   - anon/public key"
echo "   - service_role/secret key"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Press Enter when you have the keys ready..."

echo ""
echo "🔑 Enter the new keys below:"
echo ""

# Get Supabase URL
read -p "Supabase URL [https://cnckjkicdybgvmkofwok.supabase.co]: " SUPABASE_URL
SUPABASE_URL=${SUPABASE_URL:-https://cnckjkicdybgvmkofwok.supabase.co}

# Get Anon Key
echo ""
echo "Paste the ANON/PUBLIC key:"
read -p "ANON_KEY: " ANON_KEY

# Get Service Role Key
echo ""
echo "Paste the SERVICE_ROLE/SECRET key:"
read -p "SERVICE_ROLE_KEY: " SERVICE_ROLE_KEY

# Validate inputs
if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo ""
    echo -e "${RED}❌ Error: Keys cannot be empty${NC}"
    exit 1
fi

# Create new .env.local
echo ""
echo "📝 Creating new .env.local file..."

cat > .env.local << EOF
# ========================================
# Supabase Configuration
# Project: cnckjkicdybgvmkofwok
# Updated: $(date +"%Y-%m-%d %H:%M:%S")
# ========================================

# Supabase URL
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL

# Anon Key (Public - safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY

# Service Role Key (Secret - NEVER expose to client!)
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF

echo -e "${GREEN}✓${NC} .env.local file created"
echo ""

# Verify keys work
echo "🔍 Testing keys..."
echo ""

# Test Anon Key
ANON_TEST=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $ANON_KEY" "$SUPABASE_URL/rest/v1/")
if [ "$ANON_TEST" = "200" ]; then
    echo -e "${GREEN}✓${NC} ANON_KEY: Valid"
else
    echo -e "${RED}✗${NC} ANON_KEY: Invalid (HTTP $ANON_TEST)"
fi

# Test Service Role Key
SERVICE_TEST=$(curl -s -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/auth/v1/health" 2>&1)

if echo "$SERVICE_TEST" | grep -q "version"; then
    echo -e "${GREEN}✓${NC} SERVICE_ROLE_KEY: Valid"
else
    echo -e "${RED}✗${NC} SERVICE_ROLE_KEY: Invalid"
    echo "   Response: $SERVICE_TEST"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Kill any running dev servers:"
echo "   ${YELLOW}lsof -ti:3000 | xargs kill -9${NC}"
echo ""
echo "2. Start the development server:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Test authentication:"
echo "   - Signup: http://localhost:3000/signup"
echo "   - Login: http://localhost:3000/login"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""

# Prompt to restart server
read -p "Start development server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting server..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    npm run dev
fi
