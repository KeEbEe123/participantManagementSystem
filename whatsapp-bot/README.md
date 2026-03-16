# WhatsApp Registration Bot

A Node.js bot that monitors Supabase for approved registrations and sends notifications to a WhatsApp group.

## Features

- Monitors Supabase database for newly approved registrations
- Sends formatted WhatsApp messages to a specified group
- Health check endpoints for monitoring
- Docker support for easy deployment on Render
- Persistent WhatsApp session storage

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WhatsApp Configuration
WHATSAPP_GROUP_ID=your_group_id@g.us

# Server Configuration
PORT=3001
NODE_ENV=production
```

### 2. Getting WhatsApp Group ID

1. Add the bot to your WhatsApp group
2. Send a message in the group
3. Check the bot logs to find the group ID
4. Update the `WHATSAPP_GROUP_ID` in your environment variables

### 3. Local Development

```bash
npm install
npm run dev
```

### 4. Docker Deployment

```bash
# Build the image
docker build -t whatsapp-bot .

# Run the container
docker run -d \
  --name whatsapp-bot \
  -p 3001:3001 \
  --env-file .env \
  whatsapp-bot
```

## Deployment on Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the following settings:
   - **Build Command**: `cd whatsapp-bot && npm install`
   - **Start Command**: `cd whatsapp-bot && npm start`
   - **Environment**: Add all environment variables from `.env`

## API Endpoints

- `GET /health` - Health check
- `GET /status` - Bot status and statistics
- `POST /test-message` - Send a test message to the group

## WhatsApp Authentication

On first run, the bot will generate a QR code. Scan it with WhatsApp to authenticate. The session will be saved and reused on subsequent runs.

## Message Format

The bot sends formatted messages with registration details:

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
```

## Monitoring

The bot checks for new approved registrations every 30 seconds and maintains a list of processed registrations to avoid duplicates.