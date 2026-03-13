import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Registration = {
  id: string
  registration_code: string
  workshop_id: number
  registration_type: 'solo' | 'duo' | 'trio'
  total_price: number
  full_name: string
  roll_no: string
  college_name: string
  mobile_number: string
  email_id: string
  payment_screenshot_url: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
  workshop_name?: string
}

export type RegistrationMember = {
  id: string
  registration_id: string
  full_name: string
  roll_no: string
  college_name: string
  mobile_number: string
  email_id: string
  created_at: string
}