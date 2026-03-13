'use client'

import { useState, useEffect } from 'react'
import { supabase, type Registration, type RegistrationMember } from '../lib/supabase'
import { generateQRCode } from '../lib/qr-utils'
import { getPaymentScreenshotUrl } from '../lib/storage-utils'

export default function Dashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [teamMembers, setTeamMembers] = useState<RegistrationMember[]>([])
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [paymentImageUrl, setPaymentImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')
  const [pendingRegistrations, setPendingRegistrations] = useState<Registration[]>([])
  const [approvedRegistrations, setApprovedRegistrations] = useState<Registration[]>([])

  useEffect(() => {
    console.log('Component mounted, checking Supabase config...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      console.log('Fetching registrations...')
      
      // First, test a simple query without joins
      const { data: simpleData, error: simpleError } = await supabase
        .from('registrations')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })

      console.log('Simple query result:', { simpleData, simpleError })

      if (simpleError) {
        console.error('Simple query failed:', simpleError)
        throw simpleError
      }

      // If simple query works, try with workshops join
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          workshops(name)
        `)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })

      console.log('Join query result:', { data, error })

      if (error) {
        console.error('Join query failed, falling back to simple data:', error)
        // Fallback to simple data without workshop names
        const formattedData = simpleData?.map(reg => ({
          ...reg,
          workshop_name: `Workshop ${reg.workshop_id}` // Fallback name
        })) || []

        const pending = formattedData.filter(reg => reg.status === 'pending')
        const confirmed = formattedData.filter(reg => reg.status === 'confirmed')
        
        setPendingRegistrations(pending)
        setApprovedRegistrations(confirmed)
        setRegistrations(activeTab === 'pending' ? pending : confirmed)
        return
      }

      const formattedData = data?.map(reg => ({
        ...reg,
        workshop_name: reg.workshops?.name || `Workshop ${reg.workshop_id}`
      })) || []

      console.log('Formatted data:', formattedData)

      const pending = formattedData.filter(reg => reg.status === 'pending')
      const confirmed = formattedData.filter(reg => reg.status === 'confirmed')
      
      console.log('Filtered data:', { pending: pending.length, confirmed: confirmed.length })
      
      setPendingRegistrations(pending)
      setApprovedRegistrations(confirmed)
      setRegistrations(activeTab === 'pending' ? pending : confirmed)
    } catch (error) {
      console.error('Error fetching registrations:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', Object.keys(error || {}))
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setRegistrations(activeTab === 'pending' ? pendingRegistrations : approvedRegistrations)
  }, [activeTab, pendingRegistrations, approvedRegistrations])

  const fetchTeamMembers = async (registrationId: string) => {
    try {
      const { data, error } = await supabase
        .from('registration_members')
        .select('*')
        .eq('registration_id', registrationId)

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const generateQRPreview = async (registrationCode: string) => {
    try {
      const qrData = `Registration Code: ${registrationCode}`
      const qrCodeDataURL = await generateQRCode(qrData)
      setQrCodePreview(qrCodeDataURL)
    } catch (error) {
      console.error('Error generating QR preview:', error)
    }
  }

  const approveRegistration = async (registration: Registration) => {
    try {
      setSendingEmail(true)
      
      // Generate and send QR code (this will also update the status)
      await generateAndSendQR(registration)

      // Refresh the list
      fetchRegistrations()
      setSelectedRegistration(null)
      setQrCodePreview(null)
    } catch (error) {
      console.error('Error approving registration:', error)
      alert('Error approving registration')
    } finally {
      setSendingEmail(false)
    }
  }

  const generateAndSendQR = async (registration: Registration) => {
    try {
      const response = await fetch('/api/send-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationCode: registration.registration_code,
          registrationId: registration.id,
          email: registration.email_id,
          name: registration.full_name,
          workshopName: registration.workshop_name
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send QR code')
      }

      if (result.warning) {
        alert(`${result.message}\n\nWarning: ${result.warning}`)
      } else {
        alert('Registration confirmed and QR code sent!')
      }
    } catch (error) {
      console.error('Error sending QR code:', error)
      alert('Failed to send QR code: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    }
  }

  const viewDetails = async (registration: Registration) => {
    setSelectedRegistration(registration)
    setQrCodePreview(null)
    setPaymentImageUrl(null)
    setImageLoading(false)
    
    if (registration.registration_type !== 'solo') {
      fetchTeamMembers(registration.id)
    }
    
    // Generate QR preview
    await generateQRPreview(registration.registration_code)
    
    // Load payment screenshot
    if (registration.payment_screenshot_url) {
      setImageLoading(true)
      try {
        const imageUrl = await getPaymentScreenshotUrl(registration.payment_screenshot_url)
        setPaymentImageUrl(imageUrl)
      } catch (error) {
        console.error('Error loading payment screenshot:', error)
      } finally {
        setImageLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Participant Management Dashboard
        </h1>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending ({pendingRegistrations.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Confirmed ({approvedRegistrations.length})
              </button>
            </nav>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-700 text-lg">
              {activeTab === 'pending' ? 'No pending registrations' : 'No confirmed registrations'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {registrations.map((registration) => (
              <div key={registration.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {registration.full_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        registration.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {registration.status === 'confirmed' ? 'CONFIRMED' : registration.status.toUpperCase()}
                      </span>
                      {registration.registration_code && (
                        <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                          {registration.registration_code}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 font-medium">{registration.email_id}</p>
                    <p className="text-gray-700">{registration.mobile_number}</p>
                    <div className="mt-2 flex gap-4 text-sm text-gray-800">
                      <span className="font-medium">Workshop: {registration.workshop_name}</span>
                      <span className="font-medium">Type: {registration.registration_type}</span>
                      <span className="font-medium">Price: ₹{registration.total_price}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewDetails(registration)}
                      className="px-4 py-2 bg-blue-700 text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
                    >
                      View Details
                    </button>
                    {activeTab === 'pending' && (
                      <button
                        onClick={() => approveRegistration(registration)}
                        className="px-4 py-2 bg-green-700 text-white font-medium rounded-md hover:bg-green-800 transition-colors"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for viewing details */}
        {selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
                  <button
                    onClick={() => {
                      setSelectedRegistration(null)
                      setQrCodePreview(null)
                    }}
                    className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h3 className="font-bold text-gray-900 mb-3">Primary Participant</h3>
                      <div className="space-y-2 text-gray-800">
                        <p><span className="font-semibold">Name:</span> {selectedRegistration.full_name}</p>
                        <p><span className="font-semibold">Roll No:</span> {selectedRegistration.roll_no}</p>
                        <p><span className="font-semibold">College:</span> {selectedRegistration.college_name}</p>
                        <p><span className="font-semibold">Email:</span> {selectedRegistration.email_id}</p>
                        <p><span className="font-semibold">Mobile:</span> {selectedRegistration.mobile_number}</p>
                      </div>
                    </div>

                    {teamMembers.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-bold text-gray-900 mb-3">Team Members</h3>
                        {teamMembers.map((member, index) => (
                          <div key={member.id} className="mb-3 p-3 bg-white rounded border">
                            <p className="font-semibold text-gray-900">Member {index + 1}: {member.full_name}</p>
                            <div className="text-gray-800 text-sm mt-1 space-y-1">
                              <p><span className="font-medium">Roll No:</span> {member.roll_no}</p>
                              <p><span className="font-medium">College:</span> {member.college_name}</p>
                              <p><span className="font-medium">Email:</span> {member.email_id}</p>
                              <p><span className="font-medium">Mobile:</span> {member.mobile_number}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedRegistration.payment_screenshot_url && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h3 className="font-bold text-gray-900 mb-3">Payment Screenshot</h3>
                        <div className="bg-white p-2 rounded border">
                          {imageLoading ? (
                            <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                              <div className="text-gray-600">Loading image...</div>
                            </div>
                          ) : paymentImageUrl ? (
                            <img
                              src={paymentImageUrl}
                              alt="Payment Screenshot"
                              className="max-w-full h-auto rounded border shadow-sm"
                              onError={(e) => {
                                console.error('Image failed to load:', paymentImageUrl)
                                const errorDiv = e.currentTarget.nextElementSibling as HTMLElement
                                e.currentTarget.style.display = 'none'
                                if (errorDiv) errorDiv.style.display = 'block'
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                              <div className="text-gray-600">No image available</div>
                            </div>
                          )}
                          <div className="hidden text-red-700 bg-red-50 p-4 rounded border border-red-200 mt-2">
                            <p className="font-semibold">Failed to load payment screenshot</p>
                            <p className="text-sm">File: {selectedRegistration.payment_screenshot_url}</p>
                            <div className="mt-3 space-y-2">
                              <p className="text-sm">
                                <a 
                                  href={`https://aikpzlzcqqwtlqfxlcer.supabase.co/storage/v1/object/public/payment-screenshots/${selectedRegistration.payment_screenshot_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 underline hover:text-blue-900 font-medium"
                                >
                                  Try opening public URL in new tab
                                </a>
                              </p>
                              <p className="text-sm">
                                <button
                                  onClick={async () => {
                                    try {
                                      const { data, error } = await supabase.storage
                                        .from('payment-screenshots')
                                        .createSignedUrl(selectedRegistration.payment_screenshot_url!, 3600)
                                      
                                      if (error) {
                                        alert('Error creating signed URL: ' + error.message)
                                      } else {
                                        window.open(data.signedUrl, '_blank')
                                      }
                                    } catch (err) {
                                      alert('Error: ' + err)
                                    }
                                  }}
                                  className="text-blue-700 underline hover:text-blue-900 font-medium cursor-pointer"
                                >
                                  Try signed URL in new tab
                                </button>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {qrCodePreview && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="font-bold text-gray-900 mb-3">QR Code Preview</h3>
                        <div className="bg-white p-4 rounded border text-center">
                          <img
                            src={qrCodePreview}
                            alt="QR Code Preview"
                            className="mx-auto mb-3 border rounded"
                          />
                          <p className="text-sm text-gray-700 font-medium">
                            This QR code will be sent to the participant
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                  {selectedRegistration.status === 'pending' ? (
                    <button
                      onClick={() => approveRegistration(selectedRegistration)}
                      disabled={sendingEmail}
                      className="px-6 py-3 bg-green-700 text-white font-semibold rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingEmail ? 'Sending...' : 'Confirm & Send QR Code'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 font-semibold rounded-md">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Registration Confirmed
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setSelectedRegistration(null)
                      setQrCodePreview(null)
                    }}
                    className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Register Button */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">CIE MLRIT Workshop Registration</h3>
              <p className="text-gray-400 mt-1">Join our exciting workshops and enhance your skills</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => window.open('/register', '_blank')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                Register Now
              </button>
              <button
                onClick={() => fetchRegistrations()}
                className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
              >
                Refresh Dashboard
              </button>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400">
            <p>&copy; 2024 CIE MLRIT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}