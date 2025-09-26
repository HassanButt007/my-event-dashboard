// components/EventTableClient.tsx
"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import Table from "@/components/ui/Table"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import { FaEdit, FaTrashAlt, FaEye } from "react-icons/fa"
import { toast, Toaster } from "sonner"
import { deleteEventAction } from "@/server-actions/event"
import DeleteConfirmDialog from "./DeleteConfirmDialog"
import ReminderForm from "@/components/ReminderForm"
import FilterBar, { FilterState } from "./FilterBar"
import * as Dialog from "@radix-ui/react-dialog"
import ReminderDialog from "./ReminderDialog"

interface EventRow {
  id: string
  title: string
  description: string
  date: string
  location: string
  status: string
  reminder?: string | null
  reminderId?: number
  userId: number
}

export default function EventTableClient({
  data,
  total,
  page,
  pageSize,
  currentUserId,
}: {
  data: EventRow[]
  total: number
  page: number
  pageSize: number
  currentUserId?: number | null
}) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({})

  const filteredData = useMemo(() => {
    return data.filter((event) => {
      const matchesSearch = filters.search
        ? event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.location.toLowerCase().includes(filters.search.toLowerCase())
        : true

      const matchesStatus = filters.status ? event.status === filters.status : true

      const matchesReminder =
        filters.reminder === "yes"
          ? !!event.reminder
          : filters.reminder === "no"
            ? !event.reminder
            : true

      const matchesStartDate = filters.startDate
        ? new Date(event.date) >= new Date(filters.startDate)
        : true

      const matchesEndDate = filters.endDate
        ? new Date(event.date) <= new Date(filters.endDate)
        : true

      return matchesSearch && matchesStatus && matchesReminder && matchesStartDate && matchesEndDate
    })
  }, [data, filters])

  const handleDeleteConfirm = async () => {
    if (!deleteId) return

    toast.promise(
      (async () => {
        try {
          await deleteEventAction(Number(deleteId))
          router.refresh()
          setDeleteId(null)
        } catch (err: any) {
          throw new Error(err?.message || "Delete failed")
        }
      })(),
      {
        loading: "Deleting...",
        success: "Event deleted successfully!",
        error: (err: any) => err.message || "Delete failed",
      }
    )
  }

  const columns = useMemo<ColumnDef<EventRow>[]>(() => [
    { id: "title", header: "Title", accessorFn: row => row.title },
    {
      id: "date",
      header: "Date",
      accessorFn: row => row.date,
      cell: info => new Date(info.getValue() as string).toLocaleString(),
    },
    { id: "location", header: "Location", accessorFn: row => row.location },
    {
      id: "status",
      header: "Status",
      accessorFn: row => row.status,
      cell: info => {
        const value = info.getValue() as string
        let color: "default" | "success" | "warning" | "error" = "default"
        if (value === "PUBLISHED") color = "success"
        else if (value === "DRAFT") color = "warning"
        else if (value === "CANCELED") color = "error"

        return <Badge color={color} text={value} />
      },
    },
    {
      id: "reminder",
      header: "Reminder",
      accessorFn: row => row.reminder,
      cell: info => {
        const rowData = info.row.original as EventRow
        return (
          <div className="flex items-center space-x-2">
            <Badge
              color={rowData.reminder ? "success" : "default"}
              text={rowData.reminder ? "Yes" : "—"}
            />
            {rowData.userId === currentUserId && (
              <ReminderDialog
                eventId={Number(rowData.id)}
                reminderId={rowData.reminderId}
                currentUserId={currentUserId!}
              />
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      accessorFn: row => row.id,
      cell: info => {
        const eventId = info.getValue() as string
        const rowData = info.row.original as EventRow
        const isOwner = rowData.userId === currentUserId

        return (
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/events/view/${eventId}`)}
              className="text-green-500 hover:text-green-700"
            >
              <FaEye size={18} />
            </button>

            <button
              onClick={() => isOwner && router.push(`/events/${eventId}`)}
              className={`text-blue-500 hover:text-blue-700 ${!isOwner ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!isOwner}
            >
              <FaEdit size={18} />
            </button>

            <button
              onClick={() => isOwner && setDeleteId(eventId)}
              className={`text-red-500 hover:text-red-700 ${!isOwner ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!isOwner}
            >
              <FaTrashAlt size={18} />
            </button>
          </div>
        )
      },
    },
  ], [currentUserId])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const tableData = table.getRowModel().rows.map(row => {
    const rowObj: Record<string, any> = {}
    row.getVisibleCells().forEach(cell => {
      rowObj[cell.column.id] = flexRender(cell.column.columnDef.cell, cell.getContext())
    })
    return rowObj
  })

  const tableColumns = columns.map(col => ({
    Header: col.header as string,
    accessor: col.id!,
  }))

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      {/* ✅ FilterBar Component */}
      <FilterBar
        initialFilters={filters}
        onFilterChange={(updatedFilters) => setFilters(updatedFilters)}
      />

      {/* Table */}
      <Table columns={tableColumns} data={tableData} />

      <div className="flex items-center justify-between mt-2">
        <div>
          Page {page} / {totalPages}
        </div>
        <div className="space-x-2">
          <Button
            disabled={page <= 1}
            onClick={() => router.push(`/events?page=${page - 1}`)}
            variant="secondary"
          >
            Prev
          </Button>
          <Button
            disabled={page >= totalPages}
            onClick={() => router.push(`/events?page=${page + 1}`)}
            variant="secondary"
          >
            Next
          </Button>
        </div>
      </div>

      {deleteId && (
        <DeleteConfirmDialog
          isOpen={!!deleteId}
          onOpenChange={(open) => { if (!open) setDeleteId(null) }}
          onConfirm={handleDeleteConfirm}
          title="Delete Event?"
          description="Are you sure you want to delete this event? This action cannot be undone."
        />
      )}
    </div>
  )
}
