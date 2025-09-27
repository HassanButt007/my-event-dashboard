import prisma from "@/lib/db";
import { getLoggedInUser } from "@/server-actions/getLoggedInUser";
import { getSearchParams } from "@/hooks/useGetSearchParams";
import { getCache, setCache } from "@/lib/eventCache";
import EventsPageClient from "@/components/EventsPageClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EventsPageProps {
  searchParams?: Promise<Record<string, string | undefined>>;
}

export default async function EventsPage(props: EventsPageProps) {
  const searchParams = await getSearchParams(props);

  const page = parseInt(searchParams?.page || "1", 10);
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const sortFieldParam = searchParams?.sort || "date";
  const sortOrder: "asc" | "desc" = searchParams?.order === "desc" ? "desc" : "asc";
  const allowedSortFields = ["date", "title", "status", "location"];
  const sortField = allowedSortFields.includes(sortFieldParam) ? sortFieldParam : "date";

  const currentFilters = {
    search: searchParams?.search,
    status: searchParams?.status as "DRAFT" | "PUBLISHED" | "CANCELED" | undefined,
    startDate: searchParams?.startDate,
    endDate: searchParams?.endDate,
    reminder: searchParams?.hasReminder as "yes" | "no" | undefined,
  };

  const user = await getLoggedInUser();
  const userId = user?.id ? Number(user.id) : null;

  const cacheKey = JSON.stringify({ userId, page, sortField, sortOrder, currentFilters });
  if (page === 1) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  let eventsRaw: any[] = [];
  let total = 0;
  let publishedCount = 0;
  let draftCount = 0;

  // --- Fetch events (same as your original code) ---
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
    if (currentFilters.reminder === "yes") whereWithExtras.reminders = { some: {} };
    if (currentFilters.reminder === "no") whereWithExtras.reminders = { none: {} };

    if (currentFilters.startDate || currentFilters.endDate) {
      const dateFilter: any = {};
      if (currentFilters.startDate) dateFilter.gte = new Date(currentFilters.startDate);
      if (currentFilters.endDate) dateFilter.lte = new Date(currentFilters.endDate);
      whereWithExtras.date = dateFilter;
    }

    const [events, totalCount, userDraftCount, allPublishedCount] = await Promise.all([
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
      if (currentFilters.startDate) dateFilter.gte = new Date(currentFilters.startDate);
      if (currentFilters.endDate) dateFilter.lte = new Date(currentFilters.endDate);
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
    <EventsPageClient
      userId={userId}
      mappedEvents={mapped}
      total={total}
      page={page}
      pageSize={pageSize}
      currentSort={sortField}
      currentOrder={sortOrder}
      currentFilters={currentFilters}
      publishedCount={publishedCount}
      draftCount={draftCount}
    />
  );

  if (page === 1) setCache(cacheKey, pageJSX);

  return pageJSX;
}
