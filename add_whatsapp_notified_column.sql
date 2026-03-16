-- Add whatsapp_notified column to registrations table
ALTER TABLE registrations 
ADD COLUMN whatsapp_notified BOOLEAN DEFAULT FALSE;

-- Update existing confirmed registrations to true to avoid spam
UPDATE registrations 
SET whatsapp_notified = TRUE 
WHERE status = 'confirmed';