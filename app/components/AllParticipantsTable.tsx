'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Download, Search, Filter, User, Users, Users2, CheckCircle, Clock } from 'lucide-react'
import { Registration, RegistrationMember, supabase } from '../../lib/supabase'

interface Participant {
  id: string
  name: string
  email: string
  mobile: string
  rollNo: string
  college: string
  registrationCode: string
  workshopName: string
  registrationType: 'solo' | 'duo' | 'trio'
  role: 'leader' | 'member'
  status: 'pending' | 'confirmed' | 'cancelled'
  totalPrice: number
  registeredAt: string
  registrationId: string
}

export default function AllParticipantsTable() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<keyof Participant>('registeredAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchAllParticipants()
  }, [])

  const fetchAllParticipants = async () => {
    try {
      setLoading(true)
      
      // Fetch all registrations with workshop names
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select(`
          *,
          workshops(name)
        `)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })

      if (regError) throw regError

      // Fetch all registration members
      const { data: members, error: membersError } = await supabase
        .from('registration_members')
        .select('*')

      if (membersError) throw membersError

      // Combine leaders and members into a single array
      const allParticipants: Participant[] = []

      // Add leaders
      registrations?.forEach((reg: any) => {
        allParticipants.push({
          id: reg.id,
          name: reg.full_name,
          email: reg.email_id,
          mobile: reg.mobile_number,
          rollNo: reg.roll_no,
          college: reg.college_name,
          registrationCode: reg.registration_code,
          workshopName: reg.workshops?.name || `Workshop ${reg.workshop_id}`,
          registrationType: reg.registration_type,
          role: 'leader',
          status: reg.status,
          totalPrice: reg.total_price,
          registeredAt: reg.created_at,
          registrationId: reg.id
        })
      })

      // Add team members
      members?.forEach((member: RegistrationMember) => {
        const registration = registrations?.find((r: any) => r.id === member.registration_id)
        if (registration) {
          allParticipants.push({
            id: member.id,
            name: member.full_name,
            email: member.email_id,
            mobile: member.mobile_number,
            rollNo: member.roll_no,
            college: member.college_name,
            registrationCode: registration.registration_code,
            workshopName: registration.workshops?.name || `Workshop ${registration.workshop_id}`,
            registrationType: registration.registration_type,
            role: 'member',
            status: registration.status,
            totalPrice: registration.total_price,
            registeredAt: registration.created_at,
            registrationId: registration.id
          })
        }
      })

      setParticipants(allParticipants)
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setLoading(false)
    }
  }

  const workshopStats = useMemo(() => {
    const stats: Record<string, number> = {}
    participants.forEach(p => {
      stats[p.workshopName] = (stats[p.workshopName] || 0) + 1
    })
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [participants])

  const filteredAndSortedParticipants = useMemo(() => {
    let filtered = participants.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.registrationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      const matchesType = typeFilter === 'all' || p.registrationType === typeFilter
      const matchesRole = roleFilter === 'all' || p.role === roleFilter

      return matchesSearch && matchesStatus && matchesType && matchesRole
    })

    return filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [participants, searchTerm, statusFilter, typeFilter, roleFilter, sortField, sortDirection])

  const handleSort = (field: keyof Participant) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Mobile', 'Roll No', 'College', 'Registration Code', 'Workshop', 'Type', 'Role', 'Status', 'Price', 'Registered At']
    const rows = filteredAndSortedParticipants.map(p => [
      p.name,
      p.email,
      p.mobile,
      p.rollNo,
      p.college,
      p.registrationCode,
      p.workshopName,
      p.registrationType,
      p.role,
      p.status,
      p.totalPrice,
      format(parseISO(p.registeredAt), 'yyyy-MM-dd HH:mm:ss')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `participants_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'solo': return <User className="w-4 h-4" />
      case 'duo': return <Users className="w-4 h-4" />
      case 'trio': return <Users2 className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading participants...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Workshop Statistics */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop Participation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workshopStats.map((stat) => (
            <div key={stat.name} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stat.count}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.count === 1 ? 'participant' : 'participants'}
                  </p>
                </div>
                <div className="ml-4">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, roll no, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="solo">Solo</option>
              <option value="duo">Duo</option>
              <option value="trio">Trio</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="leader">Leaders</option>
              <option value="member">Members</option>
            </select>
          </div>
        </div>

        {/* Stats and Export */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredAndSortedParticipants.length}</span> of <span className="font-semibold text-gray-900">{participants.length}</span> participants
          </div>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortField === 'name' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('rollNo')}
                >
                  Roll No
                  {sortField === 'rollNo' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('college')}
                >
                  College
                  {sortField === 'college' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('workshopName')}
                >
                  Workshop
                  {sortField === 'workshopName' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  Role
                  {sortField === 'role' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sortField === 'status' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('registeredAt')}
                >
                  Registered
                  {sortField === 'registeredAt' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedParticipants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {participant.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {participant.registrationCode}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{participant.email}</div>
                    <div className="text-xs text-gray-500">{participant.mobile}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {participant.rollNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {participant.college}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {participant.workshopName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(participant.registrationType)}
                      <span className="text-sm text-gray-900 capitalize">
                        {participant.registrationType}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      participant.role === 'leader' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {participant.role === 'leader' ? 'Leader' : 'Member'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(participant.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(participant.registeredAt), 'MMM dd, yyyy')}
                    <div className="text-xs text-gray-400">
                      {format(parseISO(participant.registeredAt), 'HH:mm')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedParticipants.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  )
}
