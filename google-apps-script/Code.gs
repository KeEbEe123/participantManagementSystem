// Google Apps Script to update Google Sheets
// Deploy this as a Web App and use the URL in your .env file

// Your spreadsheet ID
const SPREADSHEET_ID = '1j06u-DDDwcfSURWnkXEJxBAUKZyrCuouHf3kJ9WZZuo';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'append' && data.sheetName === 'AllParticipants') {
      const participant = data.data;
      
      // Open the spreadsheet
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(data.sheetName);
      
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Sheet not found: ' + data.sheetName
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Prepare row data
      const rowData = [
        participant.name,
        participant.email,
        participant.mobile,
        participant.rollNo,
        participant.college,
        participant.registrationCode,
        participant.workshopName,
        participant.registrationType,
        participant.status,
        participant.totalPrice,
        participant.approvedAt
      ];
      
      // Append the row
      sheet.appendRow(rowData);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Participant added successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function
function testAppend() {
  const testData = {
    action: 'append',
    sheetName: 'AllParticipants',
    data: {
      name: 'Test User',
      email: 'test@example.com',
      mobile: '1234567890',
      rollNo: 'TEST123',
      college: 'Test College',
      registrationCode: 'TEST-CODE-123',
      workshopName: 'Test Workshop',
      registrationType: 'solo',
      status: 'confirmed',
      totalPrice: 100,
      approvedAt: new Date().toISOString()
    }
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(e);
  Logger.log(result.getContent());
}
