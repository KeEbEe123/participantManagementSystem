// Google Sheets API integration using Google Apps Script Web App
// This is the simplest approach - uses a Google Apps Script as a proxy

interface ParticipantData {
  name: string
  email: string
  mobile: string
  rollNo: string
  college: string
  registrationCode: string
  workshopName: string
  registrationType: string
  status: string
  totalPrice: number
  approvedAt: string
}

export async function appendToGoogleSheet(participant: ParticipantData) {
  try {
    // Use Google Apps Script Web App URL (you'll need to create this)
    const webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL
    
    if (!webAppUrl) {
      console.log('Google Sheets Web App URL not configured, skipping sheet update')
      return { success: false, error: 'Web App URL not configured' }
    }
    
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'append',
        sheetName: 'AllParticipants',
        data: participant
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Google Sheets update error:', error)
      return { success: false, error }
    }
    
    const result = await response.json()
    console.log('Successfully updated Google Sheet:', result)
    return { success: true, result }
    
  } catch (error) {
    console.error('Error updating Google Sheet:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
