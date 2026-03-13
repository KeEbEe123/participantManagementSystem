# Participant Management Dashboard

A Next.js application for managing workshop registrations with payment verification and QR code generation.

## Features

- **View Pending Registrations**: See all participants waiting for approval
- **Payment Verification**: View payment screenshots uploaded by participants
- **Team Management**: Handle solo, duo, and trio registrations with team member details
- **QR Code Generation**: Automatically generate unique QR codes for approved participants
- **Email Integration**: Send confirmation emails with QR codes using Brevo API
- **Real-time Updates**: Dashboard updates automatically when registrations are approved

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
BREVO_API_KEY=your_brevo_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application expects the following Supabase tables:

- `workshops` - Workshop information
- `registrations` - Main registration data with payment screenshots and status
- `registration_members` - Team members for group registrations
- Storage bucket: `payment-screenshots` for payment verification images

## Usage

1. **View Registrations**: The dashboard shows all pending registrations with participant details
2. **Review Details**: Click "View Details" to see full participant information, team members, and payment screenshot
3. **QR Code Preview**: The modal shows a preview of the QR code that will be sent
4. **Approve Registration**: Click "Approve & Send QR Code" to:
   - Update registration status to 'confirmed'
   - Generate a unique QR code with the registration ID
   - Send confirmation email with QR code attachment via Brevo

## API Endpoints

- `POST /api/send-qr` - Generates QR code and sends confirmation email

## Technologies Used

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- Supabase (Database & Storage)
- QRCode library for QR generation
- Brevo API for email sending