# Google Sheets Integration Setup Guide

This guide will help you set up automatic updates to your Google Sheet when participants are approved.

## Option 1: Using Google Apps Script (Recommended - Simplest)

### Step 1: Create the Google Apps Script

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1j06u-DDDwcfSURWnkXEJxBAUKZyrCuouHf3kJ9WZZuo/edit
2. Click on **Extensions** → **Apps Script**
3. Delete any existing code in the editor
4. Copy the code from `google-apps-script/Code.gs` and paste it into the editor
5. Click **Save** (disk icon) and give it a name like "Participant Updater"

### Step 2: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Participant Sheet Updater"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click **Deploy**
5. You may need to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
6. Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/...../exec`)

### Step 3: Add to Environment Variables

1. Open your `.env` file
2. Add this line with your Web app URL:
   ```
   GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

### Step 4: Prepare Your Google Sheet

1. Make sure your sheet has a tab named **AllParticipants**
2. Add these column headers in the first row:
   - A1: Name
   - B1: Email
   - C1: Mobile
   - D1: Roll No
   - E1: College
   - F1: Registration Code
   - G1: Workshop
   - H1: Type
   - I1: Status
   - J1: Price
   - K1: Approved At

### Step 5: Test the Integration

1. Restart your Next.js development server:
   ```bash
   npm run dev
   ```
2. Approve a test registration
3. Check your Google Sheet - a new row should be added automatically!

---

## Option 2: Using n8n (Alternative - More Flexible)

If you prefer to use n8n (since you're already using it for WhatsApp):

### Step 1: Extend Your n8n Workflow

1. Open your n8n workflow at: https://tribhuvan-tech.mlritcie.in
2. Add a **Google Sheets** node after the webhook trigger
3. Configure it:
   - **Operation**: Append
   - **Spreadsheet ID**: `1j06u-DDDwcfSURWnkXEJxBAUKZyrCuouHf3kJ9WZZuo`
   - **Sheet Name**: `AllParticipants`
   - **Data Mode**: Map Each Column
   - Map the fields from the webhook payload to the columns

### Step 2: Connect Google Sheets to n8n

1. In n8n, create a Google Sheets credential
2. Follow the OAuth flow to authorize n8n to access your Google Sheets

### Benefits of n8n Approach:
- Visual workflow editor
- Can add additional logic (notifications, data transformation, etc.)
- Centralized automation management
- No code deployment needed

---

## Option 3: Supabase Edge Function (Most Scalable)

For production environments with high volume:

### Step 1: Create Edge Function

```bash
npx supabase functions new update-google-sheet
```

### Step 2: Set up Database Trigger

Create a database trigger that calls the edge function whenever a registration status changes to 'confirmed'.

### Benefits:
- Automatic triggers on database changes
- Serverless and scalable
- Isolated from your main application

---

## Recommended Approach

**For your use case, I recommend Option 1 (Google Apps Script)** because:
- ✅ Simplest to set up (5 minutes)
- ✅ No additional infrastructure needed
- ✅ Free and reliable
- ✅ Already integrated in your code
- ✅ Works immediately after deployment

**Use Option 2 (n8n)** if:
- You want to add more automation steps
- You prefer visual workflow management
- You want to centralize all automations

**Use Option 3 (Edge Function)** if:
- You expect very high volume (1000+ approvals/day)
- You need complex business logic
- You want complete isolation from your main app

---

## Troubleshooting

### Script not updating the sheet?

1. Check the Apps Script logs:
   - Open Apps Script editor
   - Click **Executions** (clock icon on left)
   - Look for errors

2. Verify the Web App URL in your `.env` file

3. Check your Next.js server logs for Google Sheets errors

### Permission errors?

- Make sure you deployed the script as "Execute as: Me"
- Re-authorize the script if needed

### Sheet not found error?

- Verify the sheet tab is named exactly **AllParticipants** (case-sensitive)
- Check the spreadsheet ID in the Apps Script code

---

## Current Implementation

The integration is already added to your code in:
- `lib/google-sheets.ts` - Helper function
- `app/api/send-qr/route.ts` - Integrated into approval flow

When a participant is approved:
1. ✅ QR code is generated and sent via email
2. ✅ Registration status is updated to 'confirmed'
3. ✅ Google Sheet is updated with participant data
4. ✅ n8n webhook is triggered for WhatsApp notification

All steps are non-blocking, so if Google Sheets fails, the approval still succeeds.
