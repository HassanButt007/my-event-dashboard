"use client";

import { deleteEventAction } from "@/server-actions/event";

export async function deleteEvent(eventId: number) {
  return deleteEventAction(eventId);
}