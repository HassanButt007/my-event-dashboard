'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import EventForm, { EventData } from '@/components/EventForm'
import { getEventsAction } from '@/server-actions/event'

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
        const { events } = await getEventsAction() as { events: ServerEvent[] }
        const event = events.find(e => e.id.toString() === eventId)
        if (!event) throw new Error('Event not found')

        // Format date for <input type="datetime-local">
        const localDate = new Date(event.date).toISOString().slice(0, 16)

        setEventData({
          id: Number(event.id),
          title: event.title,
          description: event.description,
          date: localDate,
          location: event.location,
          status: event.status
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
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>
      {eventData && (
        <EventForm
          initialData={eventData}
          onSuccess={() => router.push('/events')}
        />
      )}
    </div>
  )
}
