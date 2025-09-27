'use client'

import { useEffect, useState } from 'react'
import { getRemindersForUser } from '@/server-actions/reminder'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Reminder {
  id: number
  eventId: number
  eventTitle?: string
  reminderTime: string
}

export default function ReminderNotifier() {
  const { data: session } = useSession()
  const userId = session?.user?.id ? Number(session.user.id) : null
  const [shownReminders, setShownReminders] = useState<number[]>([])

  useEffect(() => {
    if (!userId) return

    const checkReminders = async () => {
      try {
        const rawReminders = await getRemindersForUser(userId)
        const reminders: Reminder[] = rawReminders.map((reminder: any) => ({
          ...reminder,
          reminderTime: typeof reminder.reminderTime === 'string'
            ? reminder.reminderTime
            : reminder.reminderTime.toISOString(),
        }))

        reminders.forEach((reminder) => {
          const reminderTime = new Date(reminder.reminderTime).getTime()
          const now = Date.now()

          // Show within a 1-minute window and only once
          if (
            reminderTime <= now &&
            reminderTime + 60000 > now &&
            !shownReminders.includes(reminder.id)
          ) {
            toast.info(`[REMINDER] ${reminder.eventTitle || 'Untitled Event'}`, {
              description: `Time: ${new Date(reminder.reminderTime).toLocaleString()}`,
            })
            setShownReminders((prev) => [...prev, reminder.id])
          }
        })
      } catch (err) {
        console.error('Error checking reminders:', err)
      }
    }

    // Run immediately and then every 30s
    checkReminders()
    const interval = setInterval(checkReminders, 30_000)
    return () => clearInterval(interval)
  }, [userId, shownReminders])

  return null
}
