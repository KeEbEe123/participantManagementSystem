'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns'
import { Registration } from '../../lib/supabase'

interface RegistrationChartProps {
  registrations: Registration[]
}

export default function RegistrationChart({ registrations }: RegistrationChartProps) {
  // Daily registrations for the last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  })

  const dailyData = last7Days.map(day => {
    const dayStart = startOfDay(day)
    const dayRegistrations = registrations.filter(reg => {
      const regDate = startOfDay(parseISO(reg.created_at))
      return regDate.getTime() === dayStart.getTime()
    })

    return {
      date: format(day, 'MMM dd'),
      registrations: dayRegistrations.length,
      confirmed: dayRegistrations.filter(r => r.status === 'confirmed').length,
      pending: dayRegistrations.filter(r => r.status === 'pending').length
    }
  })

  // Workshop type distribution
  const workshopData = registrations.reduce((acc, reg) => {
    const workshop = reg.workshop_name || `Workshop ${reg.workshop_id}`
    acc[workshop] = (acc[workshop] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const workshopChartData = Object.entries(workshopData).map(([name, count]) => ({
    name,
    value: count
  }))

  // Registration type distribution
  const typeData = registrations.reduce((acc, reg) => {
    acc[reg.registration_type] = (acc[reg.registration_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const typeChartData = Object.entries(typeData).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }))

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Daily Registrations */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Registrations (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="registrations" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Total"
            />
            <Line 
              type="monotone" 
              dataKey="confirmed" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Confirmed"
            />
            <Line 
              type="monotone" 
              dataKey="pending" 
              stroke="#F59E0B" 
              strokeWidth={2}
              name="Pending"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Workshop Distribution */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={workshopChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {workshopChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Registration Type Distribution */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Types</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={typeChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Overview */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Confirmed', value: registrations.filter(r => r.status === 'confirmed').length },
                { name: 'Pending', value: registrations.filter(r => r.status === 'pending').length }
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#10B981" />
              <Cell fill="#F59E0B" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}