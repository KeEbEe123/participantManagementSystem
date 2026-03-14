'use client'

import React, { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Registration } from '../../lib/supabase'

interface FilterPanelProps {
  registrations: Registration[]
  onFilterChange: (filtered: Registration[]) => void
}

export default function FilterPanel({ registrations, onFilterChange }: FilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWorkshop, setSelectedWorkshop] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)

  // Get unique workshops
  const workshops = Array.from(new Set(registrations.map(r => r.workshop_name || `Workshop ${r.workshop_id}`)))
  
  // Get unique registration types
  const types = Array.from(new Set(registrations.map(r => r.registration_type)))

  const applyFilters = () => {
    let filtered = registrations

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.mobile_number.includes(searchTerm) ||
        reg.registration_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.college_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Workshop filter
    if (selectedWorkshop) {
      filtered = filtered.filter(reg => 
        (reg.workshop_name || `Workshop ${reg.workshop_id}`) === selectedWorkshop
      )
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(reg => reg.registration_type === selectedType)
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(reg => reg.status === selectedStatus)
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(reg => 
        new Date(reg.created_at) >= new Date(dateRange.start)
      )
    }
    if (dateRange.end) {
      filtered = filtered.filter(reg => 
        new Date(reg.created_at) <= new Date(dateRange.end + 'T23:59:59')
      )
    }

    onFilterChange(filtered)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedWorkshop('')
    setSelectedType('')
    setSelectedStatus('')
    setDateRange({ start: '', end: '' })
    onFilterChange(registrations)
  }

  // Apply filters whenever any filter changes
  React.useEffect(() => {
    applyFilters()
  }, [searchTerm, selectedWorkshop, selectedType, selectedStatus, dateRange])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Search Bar - Always visible */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name, email, phone, registration code, or college..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Workshop Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workshop</label>
            <select
              value={selectedWorkshop}
              onChange={(e) => setSelectedWorkshop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Workshops</option>
              {workshops.map(workshop => (
                <option key={workshop} value={workshop}>{workshop}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      {(searchTerm || selectedWorkshop || selectedType || selectedStatus || dateRange.start || dateRange.end) && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}