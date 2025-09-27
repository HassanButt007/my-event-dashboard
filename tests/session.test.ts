import { describe, it, expect, vi } from "vitest";
import { createEventAction } from "@/server-actions/event";
import { createReminderAction } from "@/server-actions/reminder";

vi.mock("@/server-actions/getLoggedInUser", () => ({
  getLoggedInUser: vi.fn().mockResolvedValue(null),
}));

describe("Session Expiry", () => {
  it("should fail event creation when no session", async () => {
    const result = await createEventAction({
      title: "Fail Event",
      date: new Date(Date.now() + 3600000).toISOString(),
      location: "Test",
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("should fail reminder creation when no session", async () => {
    const result = await createReminderAction({
      eventId: 1,
      userId: 1,
      reminderTime: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
