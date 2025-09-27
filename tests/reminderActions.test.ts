import { describe, it, expect, vi, beforeEach } from "vitest";
import * as reminderActions from "@/server-actions/reminder";
import prisma from "@/lib/db";

vi.mock("@/lib/db", () => ({
  default: {
    event: { findUnique: vi.fn() },
    reminder: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server-actions/getLoggedInUser", () => ({
  getLoggedInUser: vi.fn(),
}));

describe("Reminder Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail when missing fields", async () => {
    const result = await reminderActions.createReminderAction({
      eventId: 0,
      userId: 0,
      reminderTime: "",
    });

    if (!result.success) {
      expect(result.error).toBe("Missing required fields");
    } else {
      throw new Error("Expected failure but got success");
    }
  });

  it("should fail when event not found", async () => {
    (prisma.event.findUnique as any).mockResolvedValue(null);

    const result = await reminderActions.createReminderAction({
      eventId: 1,
      userId: 2,
      reminderTime: new Date().toISOString(),
    });

    if (!result.success) {
      expect(result.error).toBe("Event not found");
    } else {
      throw new Error("Expected failure but got success");
    }
  });

  it("should create reminder successfully", async () => {
    const now = new Date();

    (prisma.event.findUnique as any).mockResolvedValue({
      id: 1,
      date: new Date(now.getTime() + 60 * 60 * 1000), // 1h later
    });
    (prisma.reminder.findFirst as any).mockResolvedValue(null);
    (prisma.reminder.create as any).mockResolvedValue({ id: 10 });

    const result = await reminderActions.createReminderAction({
      eventId: 1,
      userId: 2,
      reminderTime: now.toISOString(),
    });

    if (result.success) {
      expect(result.data.id).toBe(10);
    } else {
      throw new Error("Expected success but got failure");
    }
  });
});
