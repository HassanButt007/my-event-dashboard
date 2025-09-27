"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

interface SidebarProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ userId, isOpen, onClose }: SidebarProps) {
  return (
    <div
      className={`fixed inset-0 z-50 md:static md:flex md:w-64 bg-indigo-700 text-white flex-col transition-transform transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      <div className="px-6 py-4 text-2xl font-bold border-b border-indigo-500 flex justify-between items-center">
        Dashboard
        <button className="md:hidden text-white" onClick={onClose}>
          ✕
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/events" className="block px-4 py-2 rounded-lg bg-indigo-600" onClick={onClose}>
          Events
        </Link>
      </nav>
      {userId && (
        <div className="p-4 border-t border-indigo-500">
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
