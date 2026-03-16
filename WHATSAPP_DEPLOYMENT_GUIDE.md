# WhatsApp Bot Deployment Guide

## 🚀 Quick Start

Your WhatsApp bot is ready for deployment! Here's everything you need to know.

## 📁 What Was Created

```
whatsapp-bot/
├── bot.js                 # Main bot application
├── package.json          # Dependencies and scripts
├── Dockerfile           # Docker configuration for Render
├── .env                 # Environment variables (configured)
├── .env.example         # Template for environment variables
├── get-group-id.js      # Helper to find WhatsApp group IDs
├── setup.js             # Setup verification script
├── README.md            # Detailed documentation
└── render-deploy.md     # Step-by-step Render deployment
```

## 🔧 Configuration Status

✅ **Supabase**: Already configured with your existing credentials  
⚠️ **WhatsApp Group ID**: Needs to be set (see steps below)  
✅ **Docker**: Ready for Render deployment  
✅ **Health Checks**: Configured for monitoring  

## 📱 Getting Your WhatsApp Group ID

### Method 1: Using the helper script (Recommended)
```bash
cd whatsapp-bot
npm install
node get-group-id.js
```
1. Scan the QR code with WhatsApp
2. The script will list all your groups with their IDs
3. Copy the ID of your target group

### Method 2: From bot logs
1. Deploy the bot first (with placeholder group ID)
2. Add the bot's phone number to your WhatsApp group
3. Send a message in the group
4. Check the logs to find the group ID
5. Update the environment variable

## 🚀 Deployment Options

### Option 1: Render (Recommended)
1. Follow the detailed guide in `whatsapp-bot/render-deploy.md`
2. **Important**: Use `Dockerfile.render` for better Chrome/Puppeteer support
3. If Docker fails, use Node runtime with build command: `npm install && npx puppeteer browsers install chrome`
4. The bot will run 24/7 (with paid plan) or sleep after 15 minutes (free tier)

### Option 2: Local Development
```bash
cd whatsapp-bot
npm install
npm run dev
```

### Option 3: Docker
```bash
cd whatsapp-bot
# Use the optimized Dockerfile
docker build -f Dockerfile.render -t whatsapp-bot .
docker run -d --name whatsapp-bot -p 3001:3001 --env-file .env whatsapp-bot
```

## 🔗 Integration with Your Next.js App

The bot automatically monitors your Supabase database for approved registrations. Additionally:

1. **Automatic notifications**: When you approve a registration via `/api/send-qr`, it will also send a WhatsApp message
2. **Manual notifications**: Use the new `/api/notify-whatsapp` endpoint
3. **Health monitoring**: Check bot status at `/health` and `/status` endpoints

## 📊 How It Works

1. **Database Monitoring**: Checks Supabase every 30 seconds for new `confirmed` registrations
2. **Duplicate Prevention**: Tracks processed registrations to avoid spam
3. **Message Formatting**: Sends rich, formatted messages with all registration details
4. **Error Handling**: Continues running even if WhatsApp or database is temporarily unavailable

## 🎯 Message Format

When a registration is approved, the group receives:

```
🎉 NEW REGISTRATION APPROVED 🎉

📋 Registration Code: REG001
👤 Name: John Doe
🏫 College: Example College
📱 Mobile: +91XXXXXXXXXX
📧 Email: john@example.com
👥 Type: SOLO
💰 Amount: ₹500

✅ Status: CONFIRMED
📅 Approved: 16/03/2026, 10:30:00 AM

The participant has been notified via email with their QR code.
```

## 🔧 Environment Variables Needed

Update `whatsapp-bot/.env`:

```env
# Already configured from your main app
NEXT_PUBLIC_SUPABASE_URL=https://iszvepiattpqlvorovpr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# You need to set this
WHATSAPP_GROUP_ID=120363XXXXXXXXXX@g.us

# Optional
PORT=3001
NODE_ENV=production
```

## 🔍 Testing

1. **Health Check**: `curl https://your-bot.onrender.com/health`
2. **Send Test Message**: 
   ```bash
   curl -X POST https://your-bot.onrender.com/test-message \
     -H "Content-Type: application/json" \
     -d '{"message": "Test message! 🤖"}'
   ```
3. **Check Status**: `curl https://your-bot.onrender.com/status`

## 🚨 Important Notes

1. **WhatsApp Authentication**: You'll need to scan a QR code on first run
2. **Session Persistence**: The bot saves WhatsApp session data automatically
3. **Group Permissions**: Make sure the bot number can send messages to your group
4. **Rate Limits**: WhatsApp has rate limits - the bot respects them automatically
5. **Render Free Tier**: Bot sleeps after 15 minutes of inactivity (upgrade for 24/7)

## 🆘 Troubleshooting

- **Chrome/Puppeteer Issues**: Use `Dockerfile.render` instead of `Dockerfile`, or try Node runtime with `npm install && npx puppeteer browsers install chrome`
- **QR Code Issues**: Check Puppeteer dependencies in Docker
- **Group Messages Not Sending**: Verify group ID format and permissions
- **Database Connection**: Check Supabase credentials and network access
- **Bot Sleeping**: Upgrade Render plan or implement keep-alive pings

## 📞 Support

Check the logs in your deployment platform for detailed error messages. The bot includes comprehensive logging for debugging.

---

**Ready to deploy?** Start with `whatsapp-bot/render-deploy.md` for step-by-step instructions!