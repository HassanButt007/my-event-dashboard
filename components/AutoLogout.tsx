"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function AutoLogout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, 30 * 60 * 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}