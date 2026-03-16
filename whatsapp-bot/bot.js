const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');
const express = require('express');
require('dotenv').config();

// Global error handling
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// Initialize Express server for health checks
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    whatsappReady: client ? client.info : null
  });
});

// Supabase client setup
console.log('Setting up Supabase connection...');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
console.log('✅ Supabase client initialized');

// WhatsApp client setup
const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/opt/render/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome";
console.log('🚀 Bot startup - Chrome path:', chromePath);

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "workshop-registration-bot"
  }),
  puppeteer: {
    headless: true,
    executablePath: chromePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

// Track processed registrations to avoid duplicates
const processedRegistrations = new Set();

// WhatsApp client event handlers
client.on('qr', (qr) => {
  console.log('QR Code received, scan with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp client is ready!');
  console.log('Client info:', client.info);
  
  // Start monitoring for new approved registrations
  startRegistrationMonitoring();
});

client.on('message', async (message) => {
  // Optional: Handle incoming messages if needed
  if (message.body === '!ping') {
    message.reply('pong');
  }
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp disconnected:', reason);
  console.log('Reinitializing WhatsApp client...');
  client.initialize();
});

// Function to start monitoring registrations
function startRegistrationMonitoring() {
  console.log('Starting registration monitoring...');
  
  // Check for new approved registrations every 30 seconds
  setInterval(async () => {
    try {
      await checkForNewApprovedRegistrations();
    } catch (error) {
      console.error('Error checking registrations:', error);
    }
  }, 30000); // 30 seconds
  
  // Initial check
  checkForNewApprovedRegistrations();
}

// Function to check for new approved registrations
async function checkForNewApprovedRegistrations() {
  try {
    // Get all confirmed registrations that haven't been WhatsApp notified
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select(`
        id,
        registration_code,
        full_name,
        workshop_id,
        registration_type,
        total_price,
        college_name,
        mobile_number,
        email_id,
        status,
        created_at,
        updated_at,
        whatsapp_notified
      `)
      .eq('status', 'confirmed')
      .eq('whatsapp_notified', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching registrations:', error);
      return;
    }

    if (!registrations || registrations.length === 0) {
      return;
    }

    console.log(`📱 Found ${registrations.length} new registrations to notify`);

    // Process each new registration
    for (const registration of registrations) {
      await sendWhatsAppNotification(registration);
    }

  } catch (error) {
    console.error('Error in checkForNewApprovedRegistrations:', error);
  }
}

// Function to send WhatsApp notification
async function sendWhatsAppNotification(registration) {
  try {
    const groupId = process.env.WHATSAPP_GROUP_ID;
    
    if (!groupId || groupId === 'your_whatsapp_group_id_here') {
      console.error('WHATSAPP_GROUP_ID not configured properly');
      return;
    }

    // Format the message
    const message = formatRegistrationMessage(registration);
    
    // Send message to the group
    await client.sendMessage(groupId, message);
    
    console.log(`✅ WhatsApp notification sent for registration: ${registration.registration_code}`);
    
    // Mark as notified in Supabase
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ whatsapp_notified: true })
      .eq('id', registration.id);

    if (updateError) {
      console.error('Error updating whatsapp_notified status:', updateError);
    } else {
      console.log(`📝 Marked registration ${registration.registration_code} as WhatsApp notified`);
    }
    
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }
}

// Function to format the registration message
function formatRegistrationMessage(registration) {
  const registrationType = registration.registration_type.toUpperCase();
  const price = `₹${registration.total_price}`;
  
  return `🎉 *NEW REGISTRATION APPROVED* 🎉

📋 *Registration Code:* ${registration.registration_code}
👤 *Name:* ${registration.full_name}
🏫 *College:* ${registration.college_name}
📱 *Mobile:* ${registration.mobile_number}
📧 *Email:* ${registration.email_id}
👥 *Type:* ${registrationType}
💰 *Amount:* ${price}

✅ *Status:* CONFIRMED
📅 *Approved:* ${new Date(registration.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

The participant has been notified via email with their QR code.`;
}

// Endpoint to manually trigger a test message
app.post('/test-message', async (req, res) => {
  try {
    const { message } = req.body;
    const groupId = process.env.WHATSAPP_GROUP_ID;
    
    if (!groupId || groupId === 'your_whatsapp_group_id_here') {
      return res.status(400).json({ error: 'WHATSAPP_GROUP_ID not configured' });
    }
    
    await client.sendMessage(groupId, message || 'Test message from WhatsApp bot 🤖');
    res.json({ success: true, message: 'Test message sent' });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get bot status
app.get('/status', (req, res) => {
  res.json({
    whatsappReady: client.info ? true : false,
    clientInfo: client.info,
    uptime: process.uptime(),
    chromePath: chromePath
  });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`WhatsApp bot server running on port ${PORT}`);
});

// Initialize WhatsApp client
console.log('Initializing WhatsApp client...');
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});