'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

interface MobileMenuProps {
  activeView: string
  onViewChange: (view: string) => void
}

export default function MobileMenu({ activeView, onViewChange }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleViewChange = (view: string) => {
    onViewChange(view)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="relative">
            <Sidebar activeView={activeView} onViewChange={handleViewChange} />
          </div>
        </div>
      )}
    </>
  )
}