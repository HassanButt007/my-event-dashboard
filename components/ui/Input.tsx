import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const Input: React.FC<InputProps> = ({ label, id, value, onChange, ...props }) => {
  const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="flex flex-col">
      <label
        className="mb-1 text-sm font-medium text-gray-700"
        htmlFor={inputId}
      >
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
    </div>
  )
}

export default Input
