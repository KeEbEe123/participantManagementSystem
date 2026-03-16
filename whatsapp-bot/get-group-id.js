const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Simple script to help find WhatsApp group IDs
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "group-id-finder"
  }),
  puppeteer: {
    headless: false // Set to true for headless mode
  }
});

client.on('qr', (qr) => {
  console.log('QR Code received, scan with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('WhatsApp client is ready!');
  
  try {
    // Get all chats
    const chats = await client.getChats();
    
    // Filter group chats
    const groups = chats.filter(chat => chat.isGroup);
    
    console.log('\n📱 Available WhatsApp Groups:');
    console.log('================================');
    
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.name}`);
      console.log(`   ID: ${group.id._serialized}`);
      console.log(`   Participants: ${group.participants.length}`);
      console.log('');
    });
    
    console.log('Copy the ID of your desired group and use it as WHATSAPP_GROUP_ID in your .env file');
    
  } catch (error) {
    console.error('Error getting groups:', error);
  }
});

client.on('message', async (message) => {
  // Log message details to help identify group IDs
  if (message.from.includes('@g.us')) {
    const chat = await message.getChat();
    console.log(`\n📨 Message from group: ${chat.name}`);
    console.log(`   Group ID: ${message.from}`);
    console.log(`   Message: ${message.body}`);
  }
});

console.log('Starting WhatsApp client to find group IDs...');
console.log('Send a message in your target group to see its ID in the logs.');
client.initialize();