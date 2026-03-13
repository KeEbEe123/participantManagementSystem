import { supabase } from './supabase'

export const getPaymentScreenshotUrl = async (filename: string): Promise<string> => {
  try {
    // Use environment variable directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/payment-screenshots/${filename}`
    
    // Test if public URL works
    const response = await fetch(publicUrl, { method: 'HEAD' })
    if (response.ok) {
      return publicUrl
    }
    
    // If public URL doesn't work, get signed URL
    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .createSignedUrl(filename, 3600) // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error)
      return publicUrl // Fallback to public URL
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Error getting payment screenshot URL:', error)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    return `${supabaseUrl}/storage/v1/object/public/payment-screenshots/${filename}`
  }
}

export const preloadImage = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}