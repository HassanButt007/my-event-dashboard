'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUnseenDueRemindersForUser, markRemindersAsSeenForUser } from '@/server-actions/reminder';
import { useSession } from 'next-auth/react';
import { FaBell } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import Dropdown from './ui/dropdown-menu';
import { useRouter } from 'next/navigation';

type BellItem = {
  id: number;
  eventId: number;
  eventTitle: string;
  reminderTime: string;
  userId: number;
};

export default function ReminderBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<BellItem[]>([]);
  const userId = session?.user?.id ? Number(session.user.id) : null;

  // Fetch unseen reminders
  const fetchUnseen = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await getUnseenDueRemindersForUser(userId);

      const mapped = res.map((r: any) => {
        const reminderTime =
          r.reminderTime instanceof Date ? r.reminderTime.toISOString() : r.reminderTime;
        return {
          id: r.id,
          eventId: r.eventId,
          eventTitle: r.eventTitle ?? r.event?.title ?? 'Untitled Event',
          reminderTime,
          userId: r.userId,
        } as BellItem;
      });

      mapped.forEach((rem) => {
        const relativeTime = formatDistanceToNow(new Date(rem.reminderTime), { addSuffix: true });
        console.log(`[REMINDER] Event: ${rem.eventTitle}, User: ${rem.userId}, Time: ${relativeTime}`);
      });

      setItems(mapped);
    } catch (err) {
      console.error('Failed to fetch unseen reminders:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchUnseen();
    const interval = setInterval(fetchUnseen, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnseen]);

  // Handle dropdown open/close
  async function handleOpenChange(open: boolean) {
    if (!open) return;
  }

  // Handle clicking a reminder
  async function handleClick(reminder: BellItem) {
    try {
      await markRemindersAsSeenForUser(userId!, [reminder.id]); 
      setItems((prev) => prev.filter((item) => item.id !== reminder.id));
      router.push(`/events/view/${reminder.eventId}`);
    } catch (err) {
      console.error('Failed to mark reminder as seen:', err);
      router.push(`/events/view/${reminder.eventId}`);
    }
  }

  return (
    <Dropdown
      trigger={
        <div className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer">
          <FaBell className="w-6 h-6 text-gray-700" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
              {items.length}
            </span>
          )}
        </div>
      }
      items={
        items.length > 0
          ? items.map((r) => {
              const relativeTime = formatDistanceToNow(
                new Date(r.reminderTime),
                { addSuffix: true }
              );
              return (
                <div
                  key={r.id}
                  onClick={() => handleClick(r)}
                  className="px-3 py-2 border-b last:border-none cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="font-mono text-xs text-gray-800">
                    [REMINDER] Event: {r.eventTitle}, User: {r.userId}, Time:{" "}
                    {relativeTime}
                  </div>
                </div>
              );
            })
          : [
              <div
                key="empty"
                className="px-3 py-2 text-gray-500 text-sm"
              >
                No reminders
              </div>,
            ]
      }
      onOpenChange={handleOpenChange}
    />
  );
}
