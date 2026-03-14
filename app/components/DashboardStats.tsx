'use client'

import { Users, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { Registration } from '../../lib/supabase'

interface DashboardStatsProps {
  registrations: Registration[]
}

export default function DashboardStats({ registrations }: DashboardStatsProps) {
  const totalRegistrations = registrations.length
  const pendingCount = registrations.filter(r => r.status === 'pending').length
  const confirmedCount = registrations.filter(r => r.status === 'confirmed').length
  const totalRevenue = registrations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.total_price, 0)

  const stats = [
    {
      title: 'Total Registrations',
      value: totalRegistrations,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Approval',
      value: pendingCount,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Confirmed',
      value: confirmedCount,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-gray-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}