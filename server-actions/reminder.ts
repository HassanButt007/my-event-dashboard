'use server';

import prisma from '@/lib/db';
import { getLoggedInUser } from './getLoggedInUser';
import { revalidatePath } from 'next/cache';

export type CreateReminderPayload = {
  reminderTime: string;
  eventId: number;
  userId: number;
};

type ActionResult<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

// ------------------
// Helpers
// ------------------
const MIN_MS = 15 * 60 * 1000; // 15 minutes
const MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Validate that reminderTime is between 15 minutes and 7 days before eventDate
function validateReminderTime(eventDate: Date, reminderTime: string) {
  const reminderDate = new Date(reminderTime);
  if (isNaN(reminderDate.getTime())) {
    return { valid: false, error: 'Invalid reminder time' };
  }

  const diff = eventDate.getTime() - reminderDate.getTime();
  if (diff < MIN_MS || diff > MAX_MS) {
    return {
      valid: false,
      error: 'Reminder must be 15 minutes to 7 days before event.',
    };
  }

  return { valid: true, date: reminderDate };
}

// Format reminder
function formatReminder(r: any) {
  return {
    id: r.id,
    eventId: r.eventId,
    eventTitle: r.event?.title ?? 'Unknown',
    reminderTime: r.reminderTime,
    userId: r.userId,
    seen: r.seen,
  };
}

// ------------------
// Actions
// ------------------

// Create
export async function createReminderAction(
  payload: CreateReminderPayload
): Promise<ActionResult> {
  try {
    // Ensure user is logged in
    const { eventId, userId, reminderTime } = payload;
    if (!eventId || !userId || !reminderTime) {
      return { success: false, error: 'Missing required fields' };
    }

    // Event check and permission
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: 'Event not found' };

    // Validate reminder time
    const { valid, date, error } = validateReminderTime(event.date, reminderTime);
    if (!valid) return { success: false, error: error! };

    // Check if reminder already exists for this user and event
    const existing = await prisma.reminder.findFirst({ where: { eventId, userId } });
    if (existing) {
      return { success: false, error: 'A reminder already exists for this event.' };
    }

    // Create the reminder
    const reminder = await prisma.reminder.create({
      data: { eventId, userId, reminderTime: date!, seen: false },
    });

    revalidatePath('/events');
    return { success: true, data: reminder };
  } catch (err: any) {
    console.error('[createReminderAction]', err);
    return { success: false, error: err?.message ?? 'Failed to create reminder' };
  }
}

// Update
export async function updateReminderAction(
  reminderId: number,
  payload: { eventId: number; reminderTime: string }
): Promise<ActionResult> {
  try {
    if (!reminderId) return { success: false, error: 'Invalid reminderId' };

    const user = await getLoggedInUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Fetch existing reminder
    const existing = await prisma.reminder.findUnique({ where: { id: reminderId } });
    if (!existing) return { success: false, error: 'Reminder not found' };
    if (existing.userId !== user.id) return { success: false, error: 'Not allowed' };

    const event = await prisma.event.findUnique({ where: { id: payload.eventId } });
    if (!event) return { success: false, error: 'Event not found' };

    const { valid, date, error } = validateReminderTime(event.date, payload.reminderTime);
    if (!valid) return { success: false, error: error! };

    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: { reminderTime: date!, eventId: payload.eventId, seen: false },
    });

    revalidatePath('/events');
    return { success: true, data: updated };
  } catch (err: any) {
    console.error('[updateReminderAction]', err);
    return { success: false, error: err?.message ?? 'Failed to update reminder' };
  }
}

// Delete
export async function deleteReminderAction(reminderId: number): Promise<ActionResult<null>> {
  try {
    
    if (!reminderId) return { success: false, error: 'Invalid reminderId' };

    const user = await getLoggedInUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Fetch existing reminder
    const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } });
    if (!reminder) return { success: false, error: 'Reminder not found' };
    if (reminder.userId !== user.id) return { success: false, error: 'Not allowed' };

    // Delete the reminder
    await prisma.reminder.delete({ where: { id: reminderId } });

    revalidatePath('/events');
    return { success: true, data: null };
  } catch (err: any) {
    console.error('[deleteReminderAction]', err);
    return { success: false, error: err?.message ?? 'Failed to delete reminder' };
  }
}

// ------------------
// Queries
// ------------------

// Get all reminders for a user
export async function getRemindersForUser(userId: number) {
  const reminders = await prisma.reminder.findMany({
    where: { userId },
    include: { event: { select: { title: true, date: true } } },
    orderBy: { reminderTime: 'asc' },
  });
  return reminders.map(formatReminder);
}

// Get due reminders for a user (reminderTime <= now)
export async function getDueRemindersForUser(userId: number) {
  const now = new Date();
  const reminders = await prisma.reminder.findMany({
    where: { userId, reminderTime: { lte: now } },
    include: { event: { select: { id: true, title: true } } },
    orderBy: { reminderTime: 'asc' },
  });
  return reminders.map(formatReminder);
}

// Get unseen due reminders for a user
export async function getUnseenDueRemindersForUser(userId: number) {
  const now = new Date();
  const reminders = await prisma.reminder.findMany({
    where: { userId, reminderTime: { lte: now }, seen: false },
    include: { event: { select: { id: true, title: true } } },
    orderBy: { reminderTime: 'asc' },
  });
  return reminders.map(r => ({
    id: r.id,
    eventId: r.eventId,
    eventTitle: r.event?.title ?? 'Unknown',
    reminderTime: r.reminderTime,
    userId: r.userId,
  }));
}

// Mark due reminders as seen for a user
export async function markRemindersAsSeenForUser(userId: number, p0: number[]) {
  try {
    const now = new Date();
    await prisma.reminder.updateMany({
      where: { userId, reminderTime: { lte: now }, seen: false },
      data: { seen: true },
    });
    revalidatePath('/events');
    return { success: true };
  } catch (err: any) {
    console.error('[markRemindersAsSeenForUser]', err);
    return { success: false, error: err?.message ?? 'Failed to mark as seen' };
  }
}

// Get reminder by ID
export async function getReminderById(reminderId: number) {
  if (!reminderId) return null;
  const r = await prisma.reminder.findUnique({
    where: { id: reminderId },
    include: { event: true },
  });
  return r
    ? {
      id: r.id,
      eventId: r.eventId,
      eventTitle: r.event?.title ?? '',
      reminderTime: r.reminderTime.toISOString(),
      userId: r.userId,
      seen: r.seen,
    }
    : null;
}
