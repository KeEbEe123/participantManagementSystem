import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { registrationId, message } = await request.json()

    // Get the WhatsApp service URL from environment
    const whatsappServiceUrl = process.env.WHATSAPP_SERVICE_URL

    if (!whatsappServiceUrl) {
      console.log('WHATSAPP_SERVICE_URL not configured, skipping WhatsApp notification')
      return NextResponse.json({ 
        success: true, 
        message: 'WhatsApp service not configured' 
      })
    }

    // Send notification to WhatsApp service
    const response = await fetch(`${whatsappServiceUrl}/test-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message || `Registration ${registrationId} has been approved! ✅`
      })
    })

    if (!response.ok) {
      throw new Error(`WhatsApp service responded with status: ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({ 
      success: true, 
      message: 'WhatsApp notification sent successfully',
      result 
    })

  } catch (error) {
    console.error('Error sending WhatsApp notification:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send WhatsApp notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}