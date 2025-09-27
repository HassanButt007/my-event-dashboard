'use client'

import React, { FormEvent, useState, useEffect } from 'react'
import { createEventAction, updateEventAction } from '@/server-actions/event'
import { toast } from 'sonner';
import { toInputDateTime, fromInputDateTime } from '@/lib/date'

export interface EventData {
  id: number
  title: string
  description?: string
  date: string
  location: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELED'
}

interface EventFormProps {
  initialData?: EventData
  onSuccess?: () => void
}

export default function EventForm({ initialData, onSuccess }: EventFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [date, setDate] = useState(
    initialData?.date ? toInputDateTime(initialData.date) : ''
  )
  const [location, setLocation] = useState(initialData?.location || '')
  const [status, setStatus] = useState<EventData['status']>(initialData?.status || 'DRAFT')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setDescription(initialData.description || '')
      setDate(toInputDateTime(initialData.date))
      setLocation(initialData.location)
      setStatus(initialData.status)
    }
  }, [initialData])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        title,
        description,
        date: fromInputDateTime(date),
        location,
        status,
      }

      if (initialData?.id) {
        await updateEventAction(initialData.id, payload)
        toast.success('Event updated successfully!')
      } else {
        await createEventAction(payload)
        toast.success('Event created successfully!')
      }

      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event. Please check your input.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-gray-700 mb-2">Title</label>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          placeholder="Event title"
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-2">Description</label>
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="Event description"
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-2">Date & Time</label>
        <input
          name="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-2">Location</label>
        <input
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          placeholder="e.g., New York, NY or US-NY: New York"
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-2">Status</label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as EventData['status'])}
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="CANCELED">CANCELED</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {initialData?.id ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  )
}
