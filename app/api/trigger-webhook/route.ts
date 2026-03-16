import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { registrationId, message, registrationData } = await request.json()

    // Get the n8n webhook URL from environment
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

    if (!n8nWebhookUrl) {
      console.log('N8N_WEBHOOK_URL not configured, skipping notification')
      return NextResponse.json({ 
        success: true, 
        message: 'n8n webhook not configured' 
      })
    }

    // Prepare webhook payload
    const webhookPayload = {
      type: 'manual_notification',
      registration_id: registrationId,
      message: message || `Registration ${registrationId} notification`,
      registration_data: registrationData,
      timestamp: new Date().toISOString()
    }

    // Send notification to n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    })

    if (!response.ok) {
      throw new Error(`n8n webhook responded with status: ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({ 
      success: true, 
      message: 'n8n webhook triggered successfully',
      result 
    })

  } catch (error) {
    console.error('Error triggering n8n webhook:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger n8n webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}