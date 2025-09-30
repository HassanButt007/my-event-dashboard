'use client'

import React, { FormEvent, useState, useEffect } from 'react'
import { createEventAction, updateEventAction } from '@/server-actions/event'
import { toast } from 'sonner';
import { toInputDateTime, fromInputDateTime } from '@/lib/date'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [date, setDate] = useState(initialData?.date ? toInputDateTime(initialData.date) : '')
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

    // Simple client-side validation
    if (!title.trim() || !location.trim() || !date) {
      toast.error('Title, Date and Location are required.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        date: fromInputDateTime(date),
        location: location.trim(),
        status,
      }

      if (initialData?.id) {
        await updateEventAction(initialData.id, payload)
        toast.success('Event updated successfully!'); 
      } else {
        await createEventAction(payload)
        toast.success('Event created successfully!')
      }

      onSuccess?.()
    } catch (err: any) {
      toast.error(err?.message || String(err) || 'Failed to save event. Please check your input.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-gray-700 mb-2">Title</label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          placeholder="Event title"
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-gray-700 mb-2">Description</label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="Event description"
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Date & Time */}
      <div>
        <label htmlFor="date" className="block text-gray-700 mb-2">Date & Time</label>
        <input
          id="date"
          name="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-gray-700 mb-2">Location</label>
        <input
          id="location"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          placeholder="e.g., New York, NY"
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-gray-700 mb-2">Status</label>
        <select
          id="status"
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

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>}
          {initialData?.id ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  )
}
