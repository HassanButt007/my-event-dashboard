'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getEventByIdAction } from '@/server-actions/event'
import ReminderDialog from '@/components/ReminderDialog'
import { deleteReminderAction } from '@/server-actions/reminder'
import { toast, Toaster } from "sonner"
import { FaEdit, FaTrashAlt } from 'react-icons/fa'
import { useSession } from 'next-auth/react'
import { format } from "date-fns"

interface ServerEvent {
  id: string | number
  title: string
  description?: string
  date: string
  location: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELED'
  reminder?: string | null
  reminderId?: number | null
  userId: number
}

export default function ViewEventPage() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const eventId = params?.id
  const { data: session, status } = useSession()
  const [event, setEvent] = useState<ServerEvent | null>(null)
  const [loading, setLoading] = useState(true)

  // Convert session user ID to number
  const currentUserId = session?.user?.id ? Number(session.user.id) : null

  useEffect(() => {
    if (!eventId || status === 'loading') return

    async function fetchEvent() {
      try {
        const ev = await getEventByIdAction(Number(eventId))
        setEvent(ev ? { ...ev, status: ev.status as ServerEvent['status'] } : null)
      } catch (err: any) {
        toast.error(err.message || 'Failed to load event')
        router.push('/events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId, router, status])

  async function handleDelete(reminderId: number) {
    try {
      await toast.promise(deleteReminderAction(reminderId), {
        loading: 'Deleting reminder...',
        success: 'Reminder deleted!',
        error: 'Failed to delete reminder',
      })
      // Refresh event after deletion
      const ev = await getEventByIdAction(Number(eventId))
      setEvent(ev ? { ...ev, status: ev.status as ServerEvent['status'] } : null)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>
  if (!event) return null

  const hasReminder = !!event.reminderId

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Toaster position="top-right" />

      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-800"
      >
        ← Back
      </button>

      {/* Event Details */}
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <h1 className="text-3xl font-bold mb-4 text-indigo-600">{event.title}</h1>

        <div className="flex flex-col md:flex-row md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 font-semibold">Date & Time:</p>
            <p className="text-gray-800">
              {format(new Date(event.date), "M/d/yyyy, h:mm:ss a")}
            </p>
          </div>

          <div>
            <p className="text-gray-600 font-semibold">Location:</p>
            <p className="text-gray-800">{event.location}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 font-semibold mb-2">Description:</p>
          <p className="text-gray-800">{event.description || 'No description provided.'}</p>
        </div>

        <div className="mb-6 flex items-center space-x-4">
          <span
            className={`px-3 py-1 rounded-full text-white font-semibold ${event.status === 'PUBLISHED'
              ? 'bg-green-500'
              : event.status === 'DRAFT'
                ? 'bg-yellow-500'
                : 'bg-red-500'
              }`}
          >
            {event.status}
          </span>

          {hasReminder && (
            <span className="px-3 py-1 rounded-full bg-blue-500 text-white font-semibold">
              Reminder Set
            </span>
          )}
        </div>
      </div>

      {/* Reminder Section */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-indigo-600">Reminders</h2>

          {!hasReminder && currentUserId && (
            <ReminderDialog
              eventId={Number(eventId)}
              currentUserId={currentUserId}
              reminderId={undefined}
              onSuccess={async () => {
                const ev = await getEventByIdAction(Number(eventId))
                setEvent(ev ? { ...ev, status: ev.status as ServerEvent['status'] } : null)
              }}
            >
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                + Add Reminder
              </button>
            </ReminderDialog>
          )}
        </div>

        {!hasReminder ? (
          <p className="text-gray-500">No reminders for this event.</p>
        ) : (
          <ul className="space-y-2">
            <li className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-800 font-medium">
                {event.reminder ? new Date(event.reminder).toLocaleString() : 'No reminder time'}
              </span>
              {currentUserId === event.userId && event.reminderId && (
                <div className="flex space-x-2">
                  <ReminderDialog
                    eventId={Number(eventId)}
                    currentUserId={currentUserId}
                    reminderId={event.reminderId}
                    onSuccess={async () => {
                      const ev = await getEventByIdAction(Number(eventId))
                      setEvent(ev ? { ...ev, status: ev.status as ServerEvent['status'] } : null)
                    }}
                  >
                    <button className="text-blue-600 hover:underline flex items-center">
                      <FaEdit className="mr-1" />
                    </button>
                  </ReminderDialog>
                  <button
                    onClick={() => handleDelete(event.reminderId!)}
                    className="text-red-600 hover:underline flex items-center"
                  >
                    <FaTrashAlt className="mr-1" />
                  </button>
                </div>
              )}
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}
