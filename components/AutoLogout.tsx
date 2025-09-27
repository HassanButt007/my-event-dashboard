"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

export default function AutoLogout() {
  useEffect(() => {
    const timer = setTimeout(async () => {
      toast.error("Session expired, please log in again.");
      await signOut({ redirect: false });
      
      window.location.href = "/login";
    }, 30 * 60 * 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
