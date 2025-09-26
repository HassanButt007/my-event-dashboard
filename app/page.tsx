import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-6">
      <div className="max-w-3xl w-full text-center space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Event Management Dashboard
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Manage your events, set reminders, and stay on top of your schedule.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold shadow hover:bg-gray-700 transition"
          >
            Login
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-gray-500 text-sm">
            Securely manage events with reminders and notifications.
          </p>
        </div>
      </div>
    </main>
  );
}
