# Deploying WhatsApp Bot to Render

## Step-by-Step Deployment Guide

### 1. Prepare Your Repository

1. Push the `whatsapp-bot` folder to your GitHub repository
2. Ensure all files are committed and pushed

### 2. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up or log in with your GitHub account

### 3. Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your repository from the list

### 4. Configure Service Settings

**Basic Settings:**
- **Name**: `whatsapp-registration-bot`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `whatsapp-bot`

**Build & Deploy:**
- **Runtime**: `Docker`
- **Dockerfile Path**: `Dockerfile.render` (optimized for Render)
- **Build Command**: Leave empty (Docker handles this)
- **Start Command**: Leave empty (Docker handles this)

**Alternative (if Docker fails):**
- **Runtime**: `Node`
- **Build Command**: `npm install && npx puppeteer browsers install chrome`
- **Start Command**: `npm start`

### 5. Environment Variables

Add these environment variables in Render dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://iszvepiattpqlvorovpr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzenZlcGlhdHRwcWx2b3JvdnByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMxNzYwMywiZXhwIjoyMDg4ODkzNjAzfQ.QObxg2HnVkNQilYISOLPuhapbOszmSK5NBATmqkpOI8
WHATSAPP_GROUP_ID=your_group_id@g.us
PORT=3001
NODE_ENV=production
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### 6. Deploy

1. Click "Create Web Service"
2. Wait for the initial deployment to complete
3. Check the logs for any errors

### 7. WhatsApp Authentication

**First Time Setup:**

1. Go to your Render service logs
2. Look for the QR code in the logs (it will be displayed as ASCII art)
3. Scan the QR code with WhatsApp on your phone
4. The bot will authenticate and save the session

**Note**: The session data will persist across deployments on Render.

### 8. Get WhatsApp Group ID

**Method 1: Using the helper script locally**
```bash
cd whatsapp-bot
node get-group-id.js
```

**Method 2: From bot logs**
1. Add the bot phone number to your WhatsApp group
2. Send a test message in the group
3. Check the Render logs to find the group ID
4. Update the `WHATSAPP_GROUP_ID` environment variable

### 9. Test the Bot

1. Access your bot's health endpoint: `https://your-app.onrender.com/health`
2. Send a test message: 
   ```bash
   curl -X POST https://your-app.onrender.com/test-message \
     -H "Content-Type: application/json" \
     -d '{"message": "Test from Render deployment! 🚀"}'
   ```

### 10. Monitor

- **Health Check**: `GET /health`
- **Status**: `GET /status`
- **Logs**: Available in Render dashboard

## Troubleshooting

### Common Issues:

1. **Chrome/Puppeteer Issues**: 
   - Error: "Could not find Chrome" - Use `Dockerfile.render` instead of `Dockerfile`
   - If Docker fails, try Node runtime with build command: `npm install && npx puppeteer browsers install chrome`
   - Add environment variable: `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`

2. **QR Code not appearing**: Check if Puppeteer dependencies are installed
3. **WhatsApp session lost**: Re-authenticate by redeploying and scanning QR
4. **Group messages not sending**: Verify group ID format (`xxxxx@g.us`)
5. **Database connection issues**: Check Supabase credentials

### Render-Specific Notes:

- Free tier services sleep after 15 minutes of inactivity
- Upgrade to paid plan for 24/7 operation
- Session data persists in the container filesystem
- Logs are available for 7 days on free tier

## Scaling Considerations

For production use:
- Use Render's paid plans for better reliability
- Consider implementing Redis for session management
- Add proper error handling and retry logic
- Set up monitoring and alerting