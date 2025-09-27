"use server";

import prisma from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getLoggedInUser } from "@/server-actions/getLoggedInUser";

const EventSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date"),
    location: z.string().min(1, "Location is required"),
    status: z.enum(["DRAFT", "PUBLISHED", "CANCELED"]),
});

// Create Event
export async function createEventAction(data: unknown) {
  try {
    const parsed = EventSchema.safeParse(data)
    if (!parsed.success) 
      return { success: false, error: parsed.error.errors[0]?.message }

    const date = new Date(parsed.data.date)
    if (date <= new Date()) 
      return { success: false, error: "Date must be in the future" }

    const user = await getLoggedInUser()
    if (!user) 
      return { success: false, error: "Unauthorized" }

    const ev = await prisma.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        date,
        location: parsed.data.location,
        status: parsed.data.status,
        userId: Number(user.id),
      },
    })

    revalidatePath("/events")
    return { success: true, data: ev }
  } catch (err: any) {
    return { success: false, error: err.message || "Something went wrong" }
  }
}

// Get Event List with pagination, sorting, filtering
export async function getEventsAction(page = 1, pageSize = 10) {
    const user = await getLoggedInUser();
    const skip = (page - 1) * pageSize;

    const where = user
        ? { userId: Number(user.id) }
        : { status: "PUBLISHED" as const };

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            orderBy: { date: "asc" },
            skip,
            take: pageSize,
            include: { reminders: true }, 
        }),
        prisma.event.count({ where }),
    ]);

    const mapped = events.map((e) => {
        const userReminder = user ? e.reminders.find((r) => r.userId === user.id) : undefined;

        return {
            id: e.id.toString(),
            title: e.title,
            description: e.description ?? "",
            date: e.date.toISOString(),
            location: e.location,
            status: e.status,
            reminder: userReminder?.reminderTime?.toISOString() || null,
            reminderId: userReminder?.id || null,
            userId: e.userId,
        };
    });


    return { events: mapped, total };
}

// Update Event
export async function updateEventAction(eventId: number, data: unknown) {
    const parsed = EventSchema.safeParse(data);
    if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);

    const date = new Date(parsed.data.date);
    if (date <= new Date()) throw new Error("Date must be in the future");

    const user = await getLoggedInUser();
    if (!user) throw new Error("Unauthorized");

    try {
        const ev = await prisma.event.update({
            where: { id: eventId },
            data: {
                title: parsed.data.title,
                description: parsed.data.description,
                date,
                location: parsed.data.location,
                status: parsed.data.status,
            },
        });

        if (ev.userId !== Number(user.id)) throw new Error("Unauthorized");

        revalidatePath("/events");
        return ev;
    } catch {
        throw new Error("Event not found or you do not have permission");
    }
}

// Delete Event
export async function deleteEventAction(eventId: number) {
    const user = await getLoggedInUser();
    if (!user) throw new Error("Unauthorized");

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { userId: true },
    });

    if (!event || event.userId !== Number(user.id)) {
        throw new Error("Event not found or you do not have permission");
    }

    await prisma.reminder.deleteMany({
        where: { eventId },
    });

    await prisma.event.delete({
        where: { id: eventId },
    });

    revalidatePath("/events");

    return { success: true };
}


// Get Single Event by ID with permission check
export async function getEventByIdAction(eventId: number) {
    const user = await getLoggedInUser();

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { reminders: true },
    });

    if (!event) throw new Error("Event not found");

    if (event.status !== "PUBLISHED" && event.userId !== Number(user?.id)) {
        throw new Error("You do not have permission to view this event");
    }

    const userReminder = user
        ? event.reminders.find((r) => r.userId === user.id)
        : undefined;

    return {
        id: event.id.toString(),
        title: event.title,
        description: event.description ?? "",
        date: event.date.toISOString(),
        location: event.location,
        status: event.status,
        reminder: userReminder?.reminderTime
            ? userReminder.reminderTime.toISOString()
            : null,
        reminderId: userReminder?.id || null, 
        userId: event.userId,
    };
}
