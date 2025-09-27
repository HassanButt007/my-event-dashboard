'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
    createReminderAction,
    updateReminderAction,
    getReminderById,
    getRemindersForUser,
} from '@/server-actions/reminder';
import Button from './ui/Button';
import Input from './ui/Input';
import { toast } from "sonner"

interface ReminderFormProps {
    eventId: number;
    reminderId?: number;
    currentUserId: number;
    initialReminderTime?: string;
    onSuccess?: () => void;
}

const ReminderSchema = z.object({
    reminderTime: z.string().min(1, 'Reminder time is required'),
});

// Format DB date string as YYYY-MM-DDTHH:MM for datetime-local input
function formatDBDateForInput(dbDate: string) {
    const date = new Date(dbDate);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function ReminderForm({
    eventId,
    reminderId,
    currentUserId,
    initialReminderTime,
    onSuccess,
}: ReminderFormProps) {
    const router = useRouter();
    const [reminderTime, setReminderTime] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadReminder() {
            try {
                if (initialReminderTime) {
                    setReminderTime(formatDBDateForInput(initialReminderTime));
                    return;
                }

                if (reminderId) {
                    const reminder = await getReminderById(reminderId);
                    if (reminder) setReminderTime(formatDBDateForInput(reminder.reminderTime));
                } else {
                    const reminders = await getRemindersForUser(currentUserId);
                    const existing = reminders.find((r) => r.eventId === eventId);
                    if (existing) setReminderTime(formatDBDateForInput(existing.reminderTime instanceof Date ? existing.reminderTime.toISOString() : existing.reminderTime));
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load reminder');
            }
        }

        loadReminder();
    }, [reminderId, eventId, currentUserId, initialReminderTime]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            ReminderSchema.parse({ reminderTime });

            // Save exactly as input without converting to local
            const payload = { eventId, reminderTime, userId: currentUserId };
            let result;

            if (reminderId) {
                result = await updateReminderAction(reminderId, payload);
                toast[result.success ? 'success' : 'error'](
                    result.success ? 'Reminder updated successfully!' : result.error
                );
            } else {
                result = await createReminderAction(payload);
                toast[result.success ? 'success' : 'error'](
                    result.success ? 'Reminder created successfully!' : result.error
                );
            }

            if (result.success) {
                onSuccess?.();
                router.refresh();
            }
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
            else toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-md max-w-md mx-auto space-y-4"
        >
            <Input
                id="reminderTime"
                label="Reminder Time"
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                required
            />
            <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : reminderId ? 'Update Reminder' : 'Create Reminder'}
            </Button>
        </form>
    );
}
