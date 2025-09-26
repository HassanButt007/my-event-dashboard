'use client'

import * as React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content>
>(({ className, children, ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fadeIn" />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        'fixed top-1/2 left-1/2 max-h-[85vh] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none data-[state=open]:animate-scaleIn',
        className
      )}
      {...props}
    >
      {children}
    </RadixDialog.Content>
  </RadixDialog.Portal>
))
DialogContent.displayName = 'DialogContent'

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-2">{children}</div>
)

export const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <RadixDialog.Title className="text-lg font-semibold text-gray-900">{children}</RadixDialog.Title>
)

export const DialogDescription = ({ children }: { children: React.ReactNode }) => (
  <RadixDialog.Description className="text-sm text-gray-500">{children}</RadixDialog.Description>
)

export const DialogFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-end space-x-2 mt-4">{children}</div>
)
