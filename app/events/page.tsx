import prisma from "@/lib/db";
import { getLoggedInUser } from "@/server-actions/getLoggedInUser";
import { getSearchParams } from "@/hooks/useGetSearchParams";
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

  const sortFieldParam = searchParams?.sort || "createdAt";
  const allowedSortFields = ["date", "title", "status", "location", "createdAt"];
  const sortField = allowedSortFields.includes(sortFieldParam)
    ? sortFieldParam
    : "createdAt";
  const sortOrder: "asc" | "desc" =
    searchParams?.order === "desc" ? "desc" : "desc";

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

  const cacheKey = JSON.stringify({
    userId,
    page,
    sortField,
    sortOrder,
    currentFilters,
  });

  let eventsRaw: any[] = [];
  let total = 0;
  let publishedCount = 0;
  let draftCount = 0;

  // --- Fetch events ---
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

    if (currentFilters.reminder === "yes") where.reminders = { some: {} };
    if (currentFilters.reminder === "no") where.reminders = { none: {} };

    if (currentFilters.startDate || currentFilters.endDate) {
      where.date = {};
      if (currentFilters.startDate)
        where.date.gte = new Date(currentFilters.startDate);
      if (currentFilters.endDate)
        where.date.lte = new Date(currentFilters.endDate);
    }

    const [events, totalCount, userDraftCount, allPublishedCount] =
      await Promise.all([
        prisma.event.findMany({
          where,
          orderBy: { [sortField]: sortOrder },
          skip,
          take: pageSize,
          include: { reminders: true },
        }),
        prisma.event.count({ where }),
        prisma.event.count({ where: { userId, status: "DRAFT" } }),
        prisma.event.count({ where: { status: "PUBLISHED" } }),
      ]);

    eventsRaw = events;
    total = totalCount;
    draftCount = userDraftCount;
    publishedCount = allPublishedCount;
  } else {
    const where: any = { status: "PUBLISHED" };

    if (currentFilters.status) where.status = currentFilters.status;
    if (currentFilters.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: currentFilters.search } },
            { location: { contains: currentFilters.search } },
          ],
        },
      ];
    }

    if (currentFilters.reminder === "yes") where.reminders = { some: {} };
    if (currentFilters.reminder === "no") where.reminders = { none: {} };

    if (currentFilters.startDate || currentFilters.endDate) {
      where.date = {};
      if (currentFilters.startDate)
        where.date.gte = new Date(currentFilters.startDate);
      if (currentFilters.endDate)
        where.date.lte = new Date(currentFilters.endDate);
    }

    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: pageSize,
        include: { reminders: true },
      }),
      prisma.event.count({ where }),
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

  const pageData = {
    mapped,
    total,
    publishedCount,
    draftCount,
  };

  return (
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
}
