'use server';

import prisma from '@/lib/db';
import { z } from 'zod';
import { getLoggedInUser } from './getLoggedInUser';

interface CreateReminderPayload {
    reminderTime: string; 
    eventId: number;
    userId: number;
}

// Create Reminder
export async function createReminderAction(data: CreateReminderPayload) {
    try {
        const reminder = await prisma.reminder.create({
            data: {
                reminderTime: new Date(data.reminderTime),
                eventId: data.eventId,
                userId: data.userId,
            },
        });
        return { success: true, data: reminder };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function updateReminderAction(reminderId: number, data: CreateReminderPayload) {
    try {
        const reminder = await prisma.reminder.update({
            where: { id: reminderId },
            data: {
                reminderTime: new Date(data.reminderTime), 
                eventId: data.eventId,
                userId: data.userId,
            },
        });
        return { success: true, data: reminder };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ✅ Fetch reminders for a specific event for the logged-in user
export async function getRemindersForEvent(eventId: number) {
    const user = await getLoggedInUser()
    if (!user) throw new Error("Unauthorized")

    return prisma.reminder.findMany({
        where: { eventId, userId: user.id },
        orderBy: { reminderTime: "asc" },
    })
}

// ✅ Delete reminder with ownership check - FIXED
export async function deleteReminderAction(reminderId: number) {
    console.log("deleteReminderAction called with reminderId:", reminderId, typeof reminderId);
    
    if (!reminderId || typeof reminderId !== "number") {
        throw new Error("Invalid reminderId")
    }

    const user = await getLoggedInUser()
    console.log("Current user from session:", user);
    
    if (!user) throw new Error("Unauthorized")

    const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } })
    console.log("Found reminder:", reminder);
    
    if (!reminder) throw new Error("Reminder not found")

    const reminderUserId = Number(reminder.userId);
    const currentUserId = Number(user.id);
    
    console.log("Comparing user IDs:", { reminderUserId, currentUserId });

    if (reminderUserId !== currentUserId) {
        throw new Error("You are not allowed to delete this reminder")
    }

    await prisma.reminder.delete({ where: { id: reminderId } })

    return { success: true }
}

// Get all reminders for a user
export async function getRemindersForUser(userId: number) {
  return prisma.reminder.findMany({
    where: { userId },
    select: {
      id: true,
      eventId: true,
      reminderTime: true,
      userId: true,
    },
  })
}

// Get single reminder by ID
export async function getReminderById(reminderId: number) {
    if (typeof reminderId !== 'number') return null;

    try {
        const reminder = await prisma.reminder.findUnique({
            where: { id: reminderId },
            include: { event: true },
        });

        if (!reminder) return null;

        return {
            id: reminder.id,
            eventId: reminder.eventId,
            eventTitle: reminder.event.title,
            reminderTime: reminder.reminderTime.toISOString(),
            userId: reminder.userId,
        };
    } catch (err) {
        console.error('Error fetching reminder:', err);
        return null;
    }
}