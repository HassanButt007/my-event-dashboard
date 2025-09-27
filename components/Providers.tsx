"use client";

import React, { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { Toaster, toast } from "sonner";
import ReminderNotifier from "./ReminderNotifier";

function SessionWatcher() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Session expired, please log in again.");
    }
  }, [status]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReminderNotifier />
      <SessionWatcher />
      {children}
      <Toaster position="top-right" richColors closeButton />
    </SessionProvider>
  );
}
