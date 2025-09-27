# My Event Dashboard

A production-quality **Event Management Dashboard with Reminders**, built with **Next.js 15**, **React 18**, **Prisma**, **NextAuth**, **TailwindCSS**, **Shadcn/UI**, and **TanStack React Table**.

---

## Table of Contents

* [Setup Instructions](#setup-instructions)
* [Architecture Decisions](#architecture-decisions)
* [Trade-off Analysis](#trade-off-analysis)
* [Validation & Constraints](#validation--constraints)
* [Handling Custom Constraints](#handling-custom-constraints)
* [Scalability Considerations](#scalability-considerations)
* [Frequently Asked Questions](#frequently-asked-questions)
* [Additional Notes](#additional-notes)

---

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/HassanButt007/my-event-dashboard.git

2. **Install dependencies**
   npm install

3. **Initialize Shadcn/UI**
   npx shadcn-ui init

4. **Setup Prisma & Database**
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed

   **To see Database Tables**
   npx prisma studio

5. **Run development server**
   npm run dev

**Architecture Decisions**

   Next.js 15: Server components for improved performance, built-in routing, and suspense support.

   React 18: Concurrent rendering and Suspense support.

   Prisma + SQLite: Lightweight DB for local development; can scale to PostgreSQL/MySQL.

   NextAuth.js v5: Secure authentication with credentials and session handling.

   TailwindCSS + Shadcn/UI: Rapid, responsive, and modern UI development.

   TanStack React Table: Efficient, fully-featured tables with server-side pagination, sorting, and filtering.

   Radix Dialog: Accessible modals for quick views.

   Server Actions: Atomic, type-safe DB operations, avoiding API boilerplate.

**Trade-off Analysis**

| Feature         | Server Actions                        | API Routes             | Decision                                             |
| --------------- | ------------------------------------- | ---------------------- | ---------------------------------------------------- |
| CRUD Operations | ✅ Direct DB access, type-safe         | ❌ Needs fetch API      | Server Actions for simplicity and performance        |
| Authentication  | ✅ NextAuth server-side                | ❌ Custom API needed    | NextAuth for secure session management               |
| Reminders       | ✅ Atomic DB writes via Server Actions | ❌ API polling required | Server Actions for reliability and real-time updates |


**Validation & Constraints**

   Event Fields

      Title: required, max 100 characters

      Description: optional, max 500 characters

      Date: required, must be a future date

      Location: required, format "CountryCode-Region: City" (e.g., "US-NY: New York")

      Status: enum (DRAFT, PUBLISHED, CANCELED)

      Constraint: No duplicate title + date for the same user

   Reminders

      One reminder per event

      Reminder time: 15 minutes to 7 days before event

      Automatically adjusted or removed if event date changes

      Logged in format: [REMINDER] Event: {title}, User: {user_id}, Time: {relative_time}

**Server Actions / TanStack Table**

   Server-side pagination (10 events/page)

   Sortable columns: title, date, status

   Filterable: status, date range, reminder presence

   Cache first page in memory; fetch other pages dynamically

**Handling Custom Constraints**

   Reminder Logic: Each reminder is unique, triggers at the correct time, and prevents duplication.

   Session Timeout: Managed with NextAuth JWT and client-side hooks for inactivity logout (30-minute expiration).

   Event Ownership: Each event linked to a userId. Update/Delete access is controlled based on ownership.

   Start/End Time Management: Start time captured on page load and remains constant; end time can be adjusted before sending to the API.

**Scalability Considerations**

   Use distributed queues (e.g., BullMQ or RabbitMQ) for scaling reminders.

   Cache frequent queries with Redis or in-memory solutions for faster table rendering.

   Support horizontal scaling via environment-specific DB endpoints and serverless functions.

   Stateless Server Actions to allow multiple server instances.