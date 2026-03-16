require('dotenv').config();

async function testN8nWebhook() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  
  console.log('Testing n8n webhook...');
  console.log('URL:', webhookUrl);
  
  if (!webhookUrl) {
    console.error('N8N_WEBHOOK_URL not found in environment variables');
    return;
  }

  const testPayload = {
    type: 'test',
    message: 'Test from registration system',
    timestamp: new Date().toISOString()
  };

  try {
    console.log('Sending test payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed');
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Make sure n8n is running on localhost:5678');
    }
  }
}

testN8nWebhook();