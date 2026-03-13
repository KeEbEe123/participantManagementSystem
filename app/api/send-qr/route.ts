import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { BrevoClient } from '@getbrevo/brevo'

export async function POST(request: NextRequest) {
  try {
    const { registrationCode, email, name, workshopName } = await request.json()

    console.log('Received request:', { registrationCode, email, name, workshopName })

    // Validate required fields
    if (!registrationCode || !email || !name || !workshopName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate API key
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY not found in environment variables')
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      )
    }

    console.log('Generating QR code...')
    // Generate QR code
    const qrCodeData = `Registration Code: ${registrationCode}`
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      type: 'png',
      width: 300,
      margin: 2,
    })

    // Convert buffer to base64
    const qrCodeBase64 = qrCodeBuffer.toString('base64')
    console.log('QR code generated, size:', qrCodeBase64.length)

    // Setup Brevo client
    console.log('Initializing Brevo client...')
    const brevo = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY
    })

    const emailData = {
      subject: `Registration Confirmed - ${workshopName}`,
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50;">Registration Confirmed!</h2>
              
              <p>Dear ${name},</p>
              
              <p>Congratulations! Your registration for <strong>${workshopName}</strong> has been confirmed.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #495057;">Registration Details:</h3>
                <p><strong>Registration Code:</strong> ${registrationCode}</p>
                <p><strong>Workshop:</strong> ${workshopName}</p>
                <p><strong>Participant:</strong> ${name}</p>
              </div>
              
              <p>Please find your QR code attached to this email. You'll need to present this QR code at the workshop venue for entry.</p>
              
              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Important:</strong> Please save this QR code and bring it with you to the workshop. You can either print it or show it on your mobile device.</p>
              </div>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>
              CIE MLRIT<br>
              cie@mlrinstitutions.ac.in <br>
              </p>
            </div>
          </body>
        </html>
      `,
      sender: {
        name: "CIE MLRIT",
        email: "cie@mlrinstitutions.ac.in"
      },
      to: [{
        email: email,
        name: name
      }],
      attachment: [{
        content: qrCodeBase64,
        name: `qr-code-${registrationCode}.png`
      }]
    }

    console.log('Sending email to:', email)
    console.log('Email payload:', JSON.stringify({
      ...emailData,
      attachment: [{ name: emailData.attachment[0].name, contentLength: emailData.attachment[0].content.length }]
    }, null, 2))

    // Send email with QR code attachment
    const result = await brevo.transactionalEmails.sendTransacEmail(emailData)
    
    console.log('Brevo response:', result)
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      message: 'QR code sent successfully' 
    })

  } catch (error) {
    console.error('Error sending QR code:', error)
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send QR code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}