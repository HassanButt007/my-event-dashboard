import prisma from "@/lib/db";
import EventTableClient from "@/components/EventTableClient";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { getLoggedInUser } from "@/server-actions/getLoggedInUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params?.page || "1", 10);
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const user = await getLoggedInUser();
  const userId = user?.id ? Number(user.id) : null;

  let eventsRaw: any[] = [];
  let total = 0;
  let publishedCount = 0;
  let draftCount = 0;

  if (userId) {
    // fetch published events + own events (any status)
    const [events, totalCount, userDraftCount, allPublishedCount] = await Promise.all([
      prisma.event.findMany({
        where: {
          OR: [
            { userId },     
            { status: "PUBLISHED" },
          ],
        },
        orderBy: { date: "asc" },
        skip,
        take: pageSize,
        include: { reminders: true },
      }),
      prisma.event.count({
        where: {
          OR: [
            { userId },
            { status: "PUBLISHED" },
          ],
        },
      }),
      prisma.event.count({ where: { userId, status: "DRAFT" } }),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
    ]);

    eventsRaw = events;
    total = totalCount;
    draftCount = userDraftCount;
    publishedCount = allPublishedCount;
  } else {
    
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { date: "asc" },
        skip,
        take: pageSize,
        include: { reminders: true },
      }),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
    ]);

    eventsRaw = events;
    total = totalCount;
    publishedCount = events.length;
    draftCount = 0;
  }

  // map to client format (id as string to satisfy EventTableClient type)
  const mapped = eventsRaw.map((e) => ({
    id: e.id.toString(),
    title: e.title,
    description: e.description ?? "",
    date: e.date.toISOString(),
    location: e.location,
    status: e.status,
    reminder: e.reminders?.[0]?.reminderTime?.toISOString() ?? null,
    reminderId: e.reminders?.[0]?.id ?? undefined,
    userId: e.userId,
  }));

  return (
    <div className="flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-700 text-white flex flex-col">
        <div className="px-6 py-4 text-2xl font-bold border-b border-indigo-500">
          Dashboard
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/events" className="block px-4 py-2 rounded-lg bg-indigo-600">
            Events
          </Link>
        </nav>
        {userId && (
          <div className="p-4 border-t border-indigo-500">
            <LogoutButton />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {userId ? "Event Dashboard" : "Published Events"}
          </h1>
          {userId && (
            <Link
              href="/events/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Add Event
            </Link>
          )}
        </div>

        {userId ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white shadow rounded-xl p-6">
              <h3 className="text-gray-500 text-sm">Total Events</h3>
              <p className="text-2xl font-bold text-indigo-600">{total}</p>
            </div>
            <div className="bg-white shadow rounded-xl p-6">
              <h3 className="text-gray-500 text-sm">Published</h3>
              <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
            </div>
            <div className="bg-white shadow rounded-xl p-6">
              <h3 className="text-gray-500 text-sm">Drafts</h3>
              <p className="text-2xl font-bold text-yellow-600">{draftCount}</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-sm text-gray-600">
            Showing published events only. Log in to manage your events.
          </div>
        )}

        {/* Events Table */}
        <div className="bg-white shadow rounded-xl p-6">
          <EventTableClient
            data={mapped}
            total={total}
            page={page}
            pageSize={pageSize}
            currentUserId={userId}
          />
        </div>
      </main>
    </div>
  );
}
