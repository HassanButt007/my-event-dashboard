"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import EventTableClient from "./EventTableClient";
import Link from "next/link";
import ReminderBell from "./ReminderBell";

interface EventsPageClientProps {
  userId: number | null;
  mappedEvents: any[];
  total: number;
  page: number;
  pageSize: number;
  currentSort: string;
  currentOrder: "asc" | "desc";
  currentFilters: any;
  publishedCount: number;
  draftCount: number;
}

export default function EventsPageClient({
  userId,
  mappedEvents,
  total,
  page,
  pageSize,
  currentSort,
  currentOrder,
  currentFilters,
  publishedCount,
  draftCount,
}: EventsPageClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row bg-gray-100 min-h-screen">
      <Sidebar userId={userId} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <button
            className="md:hidden text-indigo-700 bg-gray-200 p-2 rounded mr-2"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex-1">
            {userId ? "Event Dashboard" : "Published Events"}
          </h1>
          {userId && <ReminderBell />}
        </div>

        {userId ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
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

        <div className="bg-white shadow rounded-xl p-6 overflow-x-auto">
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
            data={mappedEvents}
            total={total}
            page={page}
            pageSize={pageSize}
            currentUserId={userId}
            currentSort={currentSort}
            currentOrder={currentOrder}
            currentFilters={currentFilters}
          />
        </div>
      </main>
    </div>
  );
}
