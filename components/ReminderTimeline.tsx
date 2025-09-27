'use client'

import { useEffect, useState } from 'react'
import { getRemindersForUser } from '@/server-actions/reminder'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'

type ReminderItem = {
  id: number
  eventId: number
  eventTitle: string
  reminderTime: string
}

export default function ReminderTimeline() {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const { data: session } = useSession()
  const userId = session?.user?.id ? Number(session.user.id) : null

  useEffect(() => {
    if (!userId) return

    async function fetchReminders() {
      try {
        const res = await getRemindersForUser(userId!)
        const formatted = res.map((reminder: any) => {
          const reminderTime =
            reminder.reminderTime instanceof Date
              ? reminder.reminderTime.toISOString()
              : reminder.reminderTime

          return {
            id: reminder.id,
            eventId: reminder.eventId,
            eventTitle: reminder.eventTitle ?? 'Untitled Event',
            reminderTime,
          }
        })

        setReminders(formatted)

        // Log notifications in requested format
        formatted.forEach((rem) => {
          const relativeTime = formatDistanceToNow(new Date(rem.reminderTime), {
            addSuffix: true,
          })
          console.log(
            `[REMINDER] Event: ${rem.eventTitle}, User: ${userId}, Time: ${relativeTime}`
          )
        })
      } catch (err) {
        console.error(err)
      }
    }

    fetchReminders()
  }, [userId])

  if (!reminders.length)
    return <p className="text-gray-500 text-center">No upcoming reminders.</p>

  return (
    <div className="p-4 bg-white rounded-xl shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Upcoming Reminders</h2>
      <div className="relative border-l-2 border-blue-500 pl-6">
        {reminders.map((reminder, index) => {
          const isLast = index === reminders.length - 1
          const timeDiff = formatDistanceToNow(new Date(reminder.reminderTime), {
            addSuffix: true,
          })

          return (
            <div key={reminder.id} className="mb-8 relative">
              {/* Timeline Dot */}
              <span className="absolute -left-3 top-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {index + 1}
              </span>

              {/* Reminder Info */}
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{reminder.eventTitle}</h3>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                  {timeDiff}
                </span>
                <p className="text-sm text-gray-500">Event ID: {reminder.eventId}</p>
              </div>

              {/* Vertical line */}
              {!isLast && (
                <div className="absolute left-0 top-6 w-0.5 h-full bg-blue-300"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
