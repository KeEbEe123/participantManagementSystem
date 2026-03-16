#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🤖 WhatsApp Registration Bot Setup');
console.log('==================================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
  } else {
    console.log('❌ .env.example not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.log('❌ Node.js 18 or higher is required');
  console.log(`   Current version: ${nodeVersion}`);
  process.exit(1);
} else {
  console.log(`✅ Node.js version: ${nodeVersion}`);
}

// Check if package.json exists
if (fs.existsSync(path.join(__dirname, 'package.json'))) {
  console.log('✅ package.json found');
} else {
  console.log('❌ package.json not found');
  process.exit(1);
}

console.log('\n📋 Next Steps:');
console.log('1. Edit .env file with your configuration');
console.log('2. Run: npm install');
console.log('3. Run: npm start');
console.log('4. Scan QR code with WhatsApp');
console.log('5. Find your group ID using: node get-group-id.js');
console.log('6. Update WHATSAPP_GROUP_ID in .env');
console.log('7. Deploy to Render using render-deploy.md guide');

console.log('\n🔧 Configuration needed in .env:');
console.log('- NEXT_PUBLIC_SUPABASE_URL');
console.log('- SUPABASE_SERVICE_ROLE_KEY');
console.log('- WHATSAPP_GROUP_ID');

console.log('\n🚀 Ready to start!');