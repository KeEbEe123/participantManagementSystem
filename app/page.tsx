'use client'

import { useState, useEffect } from 'react'
import { supabase, type Registration, type RegistrationMember } from '../lib/supabase'
import { generateQRCode } from '../lib/qr-utils'
import { getPaymentScreenshotUrl } from '../lib/storage-utils'
import Sidebar from './components/Sidebar'
import MobileMenu from './components/MobileMenu'
import DashboardStats from './components/DashboardStats'
import RegistrationChart from './components/RegistrationChart'
import FilterPanel from './components/FilterPanel'
import ParticipantTable from './components/ParticipantTable'
import AllParticipantsTable from './components/AllParticipantsTable'

export default function Dashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [teamMembers, setTeamMembers] = useState<RegistrationMember[]>([])
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [paymentImageUrl, setPaymentImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [activeView, setActiveView] = useState('dashboard')
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
        setRegistrations(formattedData)
        setFilteredRegistrations(formattedData)
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
      setRegistrations(formattedData)
      setFilteredRegistrations(formattedData)
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

  const getViewData = () => {
    switch (activeView) {
      case 'pending':
        return pendingRegistrations
      case 'approved':
        return approvedRegistrations
      case 'participants':
      case 'analytics':
      case 'dashboard':
      default:
        return filteredRegistrations
    }
  }

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Dashboard Overview'
      case 'participants':
        return 'All Participants'
      case 'analytics':
        return 'Analytics & Reports'
      case 'pending':
        return 'Pending Approvals'
      case 'approved':
        return 'Approved Participants'
      default:
        return 'Dashboard'
    }
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-medium text-gray-900">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  const currentViewData = getViewData()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu activeView={activeView} onViewChange={setActiveView} />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {getViewTitle()}
            </h1>
            <p className="text-gray-600 text-sm lg:text-base">
              Manage workshop registrations and participant data
            </p>
          </div>

          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <>
              <DashboardStats registrations={registrations} />
              <RegistrationChart registrations={registrations} />
              
              <div className="mb-6">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Recent Registrations</h2>
                <ParticipantTable 
                  registrations={registrations.slice(0, 10)} 
                  onViewDetails={viewDetails}
                  onApprove={approveRegistration}
                  showApproveButton={true}
                />
              </div>
            </>
          )}

          {/* Analytics View */}
          {activeView === 'analytics' && (
            <>
              <DashboardStats registrations={registrations} />
              <RegistrationChart registrations={registrations} />
            </>
          )}

          {/* Participants View */}
          {activeView === 'participants' && (
            <AllParticipantsTable />
          )}

          {/* Pending View */}
          {activeView === 'pending' && (
            <>
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        {pendingRegistrations.length} registrations awaiting approval
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Review payment screenshots and approve valid registrations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <ParticipantTable 
                registrations={pendingRegistrations} 
                onViewDetails={viewDetails}
                onApprove={approveRegistration}
                showApproveButton={true}
              />
            </>
          )}

          {/* Approved View */}
          {activeView === 'approved' && (
            <>
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        {approvedRegistrations.length} confirmed registrations
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        All participants have received their QR codes via email.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <ParticipantTable 
                registrations={approvedRegistrations} 
                onViewDetails={viewDetails}
                showApproveButton={false}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal for viewing details */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
                <button
                  onClick={() => {
                    setSelectedRegistration(null)
                    setQrCodePreview(null)
                  }}
                  className="text-gray-600 hover:text-gray-900 text-2xl font-bold rounded-lg p-2 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-xl border">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Primary Participant</h3>
                    <div className="space-y-3 text-gray-800">
                      <div className="flex justify-between">
                        <span className="font-semibold">Name:</span>
                        <span>{selectedRegistration.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Roll No:</span>
                        <span>{selectedRegistration.roll_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">College:</span>
                        <span className="text-right">{selectedRegistration.college_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Email:</span>
                        <span className="text-right">{selectedRegistration.email_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Mobile:</span>
                        <span>{selectedRegistration.mobile_number}</span>
                      </div>
                    </div>
                  </div>

                  {teamMembers.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <h3 className="font-bold text-gray-900 mb-4 text-lg">Team Members</h3>
                      {teamMembers.map((member, index) => (
                        <div key={member.id} className="mb-4 p-4 bg-white rounded-lg border">
                          <p className="font-semibold text-gray-900 mb-2">Member {index + 1}: {member.full_name}</p>
                          <div className="text-gray-800 text-sm space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Roll No:</span>
                              <span>{member.roll_no}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">College:</span>
                              <span className="text-right">{member.college_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Email:</span>
                              <span className="text-right">{member.email_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Mobile:</span>
                              <span>{member.mobile_number}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRegistration.payment_screenshot_url && (
                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                      <h3 className="font-bold text-gray-900 mb-4 text-lg">Payment Screenshot</h3>
                      <div className="bg-white p-4 rounded-lg border">
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
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <h3 className="font-bold text-gray-900 mb-4 text-lg">QR Code Preview</h3>
                      <div className="bg-white p-6 rounded-lg border text-center">
                        <img
                          src={qrCodePreview}
                          alt="QR Code Preview"
                          className="mx-auto mb-4 border rounded"
                        />
                        <p className="text-sm text-gray-700 font-medium">
                          This QR code will be sent to the participant
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200 mt-8">
                {selectedRegistration.status === 'pending' ? (
                  <button
                    onClick={() => approveRegistration(selectedRegistration)}
                    disabled={sendingEmail}
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingEmail ? 'Sending...' : 'Confirm & Send QR Code'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 font-semibold rounded-lg">
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
                  className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
         </div>
  )
}