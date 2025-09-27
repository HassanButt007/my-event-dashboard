'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUnseenDueRemindersForUser, markRemindersAsSeenForUser } from '@/server-actions/reminder';
import { useSession } from 'next-auth/react';
import { FaBell } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import Dropdown from './ui/dropdown-menu';

type BellItem = {
  id: number;
  eventTitle: string;
  reminderTime: string;
  userId: number;
};

export default function ReminderBell() {
  const { data: session } = useSession();
  const [items, setItems] = useState<BellItem[]>([]);
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const fetchUnseen = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getUnseenDueRemindersForUser(userId);
      const mapped = res.map((r: any) => {
        const reminderTime =
          r.reminderTime instanceof Date ? r.reminderTime.toISOString() : r.reminderTime;
        return {
          id: r.id,
          eventTitle: r.eventTitle ?? r.event?.title ?? 'Untitled Event',
          reminderTime,
          userId: r.userId,
        } as BellItem;
      });

      // Build logs as required and keep list for dropdown
      mapped.forEach((rem) => {
        const relativeTime = formatDistanceToNow(new Date(rem.reminderTime), { addSuffix: true });
        const log = `[REMINDER] Event: ${rem.eventTitle}, User: ${rem.userId}, Time: ${relativeTime}`;
        console.log(log);
      });

      setItems(mapped);
    } catch (err) {
      console.error('Failed to fetch unseen reminders:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchUnseen();
    // Poll occasionally (optional) to update badge
    const interval = setInterval(fetchUnseen, 30_000); // 30s
    return () => clearInterval(interval);
  }, [fetchUnseen]);

  // Called when dropdown opens)
  async function handleOpenChange(open: boolean) {
    if (!open) return;
    if (!userId) {
      setItems([]);
      return;
    }

    try {
      const res = await markRemindersAsSeenForUser(userId);
      if ((res as any).success) {
        // clear client badge
        setItems([]);
      } else {
        // clear the UI count
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to mark seen:', err);
      setItems([]);
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
          ? items.map((r) => (
              <div key={r.id} className="px-3 py-2">
                <div className="font-mono text-xs text-gray-800">{`[REMINDER] Event: ${r.eventTitle}`}</div>
                <div className="text-xs text-gray-500">{new Date(r.reminderTime).toLocaleString()}</div>
              </div>
            ))
          : [<div key="empty" className="px-3 py-2 text-gray-500 text-sm">No reminders</div>]
      }
    />
  );
}
