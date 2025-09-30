'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import EventForm, { EventData } from '@/components/EventForm'
import { getEventByIdAction } from '@/server-actions/event'
import { toInputDateTime } from '@/lib/date'

// Type for events returned from getEventsAction
interface ServerEvent {
  id: string | number
  title: string
  description?: string
  date: string
  location: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELED'
  reminder?: string | null
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const eventId = params?.id
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return

    async function fetchEvent() {
      try {
        const event = await getEventByIdAction(Number(eventId))

        setEventData({
          id: Number(event.id),
          title: event.title,
          description: event.description,
          date: toInputDateTime(event.date),
          location: event.location,
          status: event.status as 'DRAFT' | 'PUBLISHED' | 'CANCELED',
        })
      } catch (err: any) {
        alert(err.message)
        router.push('/events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId, router])

  if (loading) return <div>Loading...</div>

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
        {eventData && (
          <EventForm
            initialData={eventData}
            onSuccess={() => router.push('/events')}
          />
        )}
      </div>
    </div>
  )
}
