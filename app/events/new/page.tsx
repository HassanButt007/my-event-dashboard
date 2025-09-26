'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import EventForm from '@/components/EventForm'

export default function NewEventPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl p-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Event</h1>
        <EventForm
          onSuccess={() => router.push('/events')}
        />
      </div>
    </div>
  )
}
