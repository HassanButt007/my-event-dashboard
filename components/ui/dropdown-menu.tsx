'use client'

import React, { useState, useRef, useEffect } from 'react'

interface DropdownProps {
  trigger: React.ReactNode
  items: React.ReactNode[] // allow JSX
  onOpenChange?: (open: boolean) => void // 🔥 NEW PROP
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, items, onOpenChange }) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
        onOpenChange?.(false) // 🔥 notify parent
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onOpenChange])

  // Toggle function
  const toggleDropdown = () => {
    const newOpen = !open
    setOpen(newOpen)
    onOpenChange?.(newOpen) // 🔥 notify parent
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger button */}
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown content */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          <ul className="divide-y divide-gray-100">
            {items.map((item, index) => (
              <li
                key={index}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Dropdown
