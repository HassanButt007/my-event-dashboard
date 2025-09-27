import { describe, it, expect, vi, beforeEach } from "vitest";
import * as eventActions from "@/server-actions/event";
import prisma from "@/lib/db";
import { getLoggedInUser } from "@/server-actions/getLoggedInUser"; // ✅ import here

vi.mock("@/lib/db", () => ({
  default: {
    event: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    reminder: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server-actions/getLoggedInUser", () => ({
  getLoggedInUser: vi.fn(),
}));

describe("Event Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create event successfully", async () => {
    const now = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const mockUser = { id: 1 };
    const mockEvent = { id: 5, title: "Test Event" };

    (getLoggedInUser as any).mockResolvedValue(mockUser);
    (prisma.event.create as any).mockResolvedValue(mockEvent);

    const result = await eventActions.createEventAction({
      title: "Test Event",
      date: now,
      location: "NY",
      status: "PUBLISHED",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockEvent);
  });
});
