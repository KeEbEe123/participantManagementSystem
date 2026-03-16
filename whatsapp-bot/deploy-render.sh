#!/bin/bash

echo "🚀 WhatsApp Bot Render Deployment Helper"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the whatsapp-bot directory."
    exit 1
fi

echo "✅ Found package.json"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create it from .env.example"
    exit 1
fi

echo "✅ Found .env file"

# Check if Dockerfile.render exists
if [ ! -f "Dockerfile.render" ]; then
    echo "❌ Error: Dockerfile.render not found"
    exit 1
fi

echo "✅ Found Dockerfile.render"

echo ""
echo "📋 Pre-deployment Checklist:"
echo "1. ✅ All files are present"
echo "2. 🔄 Checking environment variables..."

# Check critical env vars
if grep -q "your_group_id@g.us" .env; then
    echo "   ⚠️  WHATSAPP_GROUP_ID still has placeholder value"
    echo "   📝 You'll need to update this after getting your group ID"
else
    echo "   ✅ WHATSAPP_GROUP_ID appears to be configured"
fi

if grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env; then
    echo "   ✅ Supabase credentials found"
else
    echo "   ❌ SUPABASE_SERVICE_ROLE_KEY not found in .env"
fi

echo ""
echo "🔧 Render Deployment Instructions:"
echo "1. Go to https://render.com and create a new Web Service"
echo "2. Connect your GitHub repository"
echo "3. Use these settings:"
echo "   - Runtime: Docker"
echo "   - Dockerfile Path: Dockerfile.render"
echo "   - Root Directory: whatsapp-bot"
echo "4. Add environment variables from your .env file"
echo "5. Deploy and check logs for QR code"

echo ""
echo "📱 After deployment:"
echo "1. Check logs for QR code and scan with WhatsApp"
echo "2. Run: node get-group-id.js locally to find your group ID"
echo "3. Update WHATSAPP_GROUP_ID in Render environment variables"
echo "4. Test with: curl https://your-app.onrender.com/health"

echo ""
echo "🎉 Ready for deployment!"