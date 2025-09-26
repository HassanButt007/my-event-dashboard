'use client'

import React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import ReminderForm from "./ReminderForm"

interface ReminderDialogProps {
  eventId: number
  reminderId?: number | null
  currentUserId: number
  children?: React.ReactNode
  onSuccess?: () => void
}

export default function ReminderDialog({
  eventId,
  reminderId,
  currentUserId,
  children,
  onSuccess,
}: ReminderDialogProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {children ? children : (
          <button className="text-blue-500 underline text-sm">
            {reminderId ? "Edit" : "Add"}
          </button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-lg w-[400px] max-w-full">
          <Dialog.Title className="text-lg font-bold mb-4">
            {reminderId ? "Edit Reminder" : "Add Reminder"}
          </Dialog.Title>

          <ReminderForm
            eventId={eventId}
            reminderId={reminderId || undefined}
            currentUserId={currentUserId}
            onSuccess={() => {
              setOpen(false)
              onSuccess?.()
            }}
          />

          <Dialog.Close className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold">
            ×
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
