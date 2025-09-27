import prisma from "@/lib/db";
import EventTableClient from "@/components/EventTableClient";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { getLoggedInUser } from "@/server-actions/getLoggedInUser";
import ReminderBell from "@/components/ReminderBell";
import { getSearchParams } from "@/hooks/useGetSearchParams";
import { getCache, setCache } from "@/lib/eventCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EventsPage(props: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  // await searchParams via helper
  const searchParams = await getSearchParams(props);

  const page = parseInt(searchParams?.page || "1", 10);
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  // --- safe sort handling ---
  const sortFieldParam = searchParams?.sort || "date";
  const sortOrder: "asc" | "desc" =
    searchParams?.order === "desc" ? "desc" : "asc";

  const allowedSortFields = ["date", "title", "status", "location"];
  const sortField = allowedSortFields.includes(sortFieldParam)
    ? sortFieldParam
    : "date";

  const currentFilters = {
    search: searchParams?.search,
    status: searchParams?.status as
      | "DRAFT"
      | "PUBLISHED"
      | "CANCELED"
      | undefined,
    startDate: searchParams?.startDate,
    endDate: searchParams?.endDate,
    reminder: searchParams?.hasReminder as "yes" | "no" | undefined,
  };

  const user = await getLoggedInUser();
  const userId = user?.id ? Number(user.id) : null;

  //build cache key
  const cacheKey = JSON.stringify({
    userId,
    page,
    sortField,
    sortOrder,
    currentFilters,
  });

  //check cache for first page only
  if (page === 1) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  let eventsRaw: any[] = [];
  let total = 0;
  let publishedCount = 0;
  let draftCount = 0;

  if (userId) {
    const where: any = {
      OR: [{ userId }, { status: "PUBLISHED" }],
      ...(currentFilters.status ? { status: currentFilters.status } : {}),
      ...(currentFilters.search
        ? {
            AND: [
              {
                OR: [
                  { title: { contains: currentFilters.search } },
                  { location: { contains: currentFilters.search } },
                ],
              },
            ],
          }
        : {}),
    };

    const whereWithExtras: any = { ...where };

    if (currentFilters.reminder === "yes") {
      whereWithExtras.reminders = { some: {} };
    } else if (currentFilters.reminder === "no") {
      whereWithExtras.reminders = { none: {} };
    }

    if (currentFilters.startDate || currentFilters.endDate) {
      const dateFilter: any = {};
      if (currentFilters.startDate)
        dateFilter.gte = new Date(currentFilters.startDate);
      if (currentFilters.endDate)
        dateFilter.lte = new Date(currentFilters.endDate);
      whereWithExtras.date = dateFilter;
    }

    const [events, totalCount, userDraftCount, allPublishedCount] =
      await Promise.all([
        prisma.event.findMany({
          where: whereWithExtras,
          orderBy: { [sortField]: sortOrder },
          skip,
          take: pageSize,
          include: { reminders: true },
        }),
        prisma.event.count({ where: whereWithExtras }),
        prisma.event.count({ where: { userId, status: "DRAFT" } }),
        prisma.event.count({ where: { status: "PUBLISHED" } }),
      ]);

    eventsRaw = events;
    total = totalCount;
    draftCount = userDraftCount;
    publishedCount = allPublishedCount;
  } else {
    const baseWhere: any = {
      status: "PUBLISHED",
      ...(currentFilters.status ? { status: currentFilters.status } : {}),
    };

    if (currentFilters.search) {
      baseWhere.AND = [
        {
          OR: [
            { title: { contains: currentFilters.search } },
            { location: { contains: currentFilters.search } },
          ],
        },
      ];
    }

    if (currentFilters.reminder === "yes") baseWhere.reminders = { some: {} };
    if (currentFilters.reminder === "no") baseWhere.reminders = { none: {} };

    if (currentFilters.startDate || currentFilters.endDate) {
      const dateFilter: any = {};
      if (currentFilters.startDate)
        dateFilter.gte = new Date(currentFilters.startDate);
      if (currentFilters.endDate)
        dateFilter.lte = new Date(currentFilters.endDate);
      baseWhere.date = dateFilter;
    }

    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where: baseWhere,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: pageSize,
        include: { reminders: true },
      }),
      prisma.event.count({ where: baseWhere }),
    ]);

    eventsRaw = events;
    total = totalCount;
    publishedCount = events.length;
    draftCount = 0;
  }

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

  const pageJSX = (
    <div className="flex bg-gray-100">
      <aside className="w-64 bg-indigo-700 text-white flex flex-col">
        <div className="px-6 py-4 text-2xl font-bold border-b border-indigo-500">
          Dashboard
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/events"
            className="block px-4 py-2 rounded-lg bg-indigo-600"
          >
            Events
          </Link>
        </nav>
        {userId && (
          <div className="p-4 border-t border-indigo-500">
            <LogoutButton />
          </div>
        )}
      </aside>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {userId ? "Event Dashboard" : "Published Events"}
          </h1>
          {userId && <ReminderBell />}
        </div>

        {userId ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white shadow rounded-xl p-6">
              <h3 className="text-gray-500 text-sm">Total Events</h3>
              <p className="text-2xl font-bold text-indigo-600">{total}</p>
            </div>
            <div className="bg-white shadow rounded-xl p-6">
              <h3 className="text-gray-500 text-sm">Published</h3>
              <p className="text-2xl font-bold text-green-600">
                {publishedCount}
              </p>
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

        <div className="bg-white shadow rounded-xl p-6">
          {userId && (
            <div className="mb-4 flex justify-end">
              <Link
                href="/events/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Add Event
              </Link>
            </div>
          )}
          <EventTableClient
            data={mapped}
            total={total}
            page={page}
            pageSize={pageSize}
            currentUserId={userId}
            currentSort={sortField}
            currentOrder={sortOrder}
            currentFilters={currentFilters}
          />
        </div>
      </main>
    </div>
  );

  // ✅ cache first page
  if (page === 1) {
    setCache(cacheKey, pageJSX);
  }

  return pageJSX;
}
