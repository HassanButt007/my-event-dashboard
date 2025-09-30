"use client"

import React, { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import ReminderDialog from "./ReminderDialog"
import FilterBar, { FilterState } from "./FilterBar"

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
  currentSort,
  currentOrder,
  currentFilters,
}: {
  data: EventRow[]
  total: number
  page: number
  pageSize: number
  currentUserId?: number | null
  currentSort?: string
  currentOrder?: "asc" | "desc"
  currentFilters?: FilterState
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(currentFilters || {})

  const visibleData = data

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

  // Update URL with new params
  function pushWithParams(newParams: Record<string, string | undefined>) {
    const params = new URLSearchParams(
      Array.from(searchParams?.entries?.() ?? [])
    )
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === "") params.delete(k)
      else params.set(k, v)
    })
    const qs = params.toString()
    router.push(`/events${qs ? `?${qs}` : ""}`)
  }

  // When filters change, reset to page 1
  function onFilterChangeAndPush(updatedFilters: FilterState) {
    setFilters(updatedFilters)
    pushWithParams({
      search: updatedFilters.search || undefined,
      status: updatedFilters.status || undefined,
      startDate: updatedFilters.startDate || undefined,
      endDate: updatedFilters.endDate || undefined,
      hasReminder: updatedFilters.reminder || undefined,
      page: "1",
    })
  }

  // Handle sorting
  function handleSort(field: string) {
    const currentSortField =
      currentSort || searchParams.get("sort") || ""
    const currentOrderParam =
      currentOrder ||
      ((searchParams.get("order") as "asc" | "desc" | null) || "asc")

    let nextOrder: "asc" | "desc" = "asc"
    if (currentSortField === field) {
      nextOrder = currentOrderParam === "asc" ? "desc" : "asc"
    }

    pushWithParams({ sort: field, order: nextOrder, page: "1" })
  }

  // Define table columns
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
              className={`text-blue-500 hover:text-blue-700 ${
                !isOwner ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!isOwner}
            >
              <FaEdit size={18} />
            </button>

            <button
              onClick={() => isOwner && setDeleteId(eventId)}
              className={`text-red-500 hover:text-red-700 ${
                !isOwner ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!isOwner}
            >
              <FaTrashAlt size={18} />
            </button>
          </div>
        )
      },
    },
  ], [currentUserId])

  // Initialize table
  const table = useReactTable({
    data: visibleData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Prepare data for rendering
  const tableData = table.getRowModel().rows.map(row => {
    const rowObj: Record<string, any> = {}
    row.getVisibleCells().forEach(cell => {
      rowObj[cell.column.id] = flexRender(cell.column.columnDef.cell, cell.getContext())
    })
    return rowObj
  })

  // use `Header` to match Table.tsx
  const tableColumns = columns.map(col => {
    const isSorted = (currentSort || searchParams.get("sort")) === col.id
    const order =
      currentOrder ||
      (searchParams.get("order") as "asc" | "desc" | null) ||
      undefined

    const headerContent =
      col.id === "title" ||
      col.id === "date" ||
      col.id === "location" ||
      col.id === "status" ? (
        <button
          onClick={() => handleSort(col.id!)}
          className="flex items-center space-x-2"
          aria-label={`Sort by ${String(col.header)}`}
        >
          <span>{col.header as string}</span>
          {isSorted && (
            <span className="text-xs">{order === "asc" ? "▲" : "▼"}</span>
          )}
        </button>
      ) : (
        col.header as string
      )

    return {
      Header: headerContent,
      accessor: col.id!,
    }
  })

  function goToPage(p: number) {
    if (p < 1) p = 1
    if (p > totalPages) p = totalPages
    pushWithParams({ page: String(p) })
  }

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />

      <FilterBar
        initialFilters={filters}
        onFilterChange={(updatedFilters) => onFilterChangeAndPush(updatedFilters)}
      />

      <Table columns={tableColumns} data={tableData} />

      <div className="flex items-center justify-between mt-2">
        <div>
          Page {page} / {totalPages}
        </div>
        <div className="space-x-2">
          <Button
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            variant="secondary"
          >
            Prev
          </Button>
          <Button
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
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
