# My Event Dashboard

A production-quality **Event Management Dashboard with Reminders**, built with **Next.js 15**, **React 18**, **Prisma**, **NextAuth**, **TailwindCSS**, and **Shadcn/UI**.

---

## Table of Contents

* [Setup Instructions](#setup-instructions)
* [Architecture Decisions](#architecture-decisions)
* [Trade-off Analysis](#trade-off-analysis)
* [Handling Custom Constraints](#handling-custom-constraints)
* [Scalability Considerations](#scalability-considerations)
* [Frequently Asked Questions](#frequently-asked-questions)

---

## Setup Instructions

1. **Clone the repository**
   git clone https://github.com/HassanButt007/my-event-dashboard.git
   cd my-event-dashboard

2. **Install dependencies**
   npm install


3. **Initialize Shadcn/UI**
   npx shadcn-ui init

4. **Setup Prisma & Database**
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed

5. **Run development server**
   npm run dev


## Architecture Decisions

* **Next.js 15**: Server components for improved performance and built-in routing.
* **React 18**: Concurrent rendering and Suspense support.
* **Prisma + SQLite**: Lightweight DB for local development; can scale to PostgreSQL/MySQL.
* **NextAuth**: Provides secure authentication with credentials and session handling.
* **TailwindCSS + Shadcn/UI**: For rapid, modern, and responsive UI development.
* **React Table**: Efficient, fully-featured tables with sorting and filtering.
* **Radix Dialog**: Accessible and reusable modals for quick views.

---

## Trade-off Analysis

| Feature         | Server Actions                        | API Routes             | Decision                                             |
| --------------- | ------------------------------------- | ---------------------- | ---------------------------------------------------- |
| CRUD Operations | ✅ Direct DB access, type-safe         | ❌ Needs fetch API      | Server Actions for simplicity and performance        |
| Authentication  | ✅ NextAuth server-side                | ❌ Custom API needed    | NextAuth for secure session management               |
| Reminders       | ✅ Atomic DB writes via Server Actions | ❌ API polling required | Server Actions for reliability and real-time updates |

---

## Handling Custom Constraints

* **Reminder Logic**: Each reminder is unique, triggers at the correct time, and prevents duplication.
* **Session Timeout**: Managed with NextAuth JWT and client-side hooks for inactivity logout.
* **Event Ownership**: Each event linked to a `userId`. Update/Delete access is controlled based on ownership.
* **Start/End Time Management**: Start time captured on page load and remains constant; end time can be adjusted before sending to the API.

---

## Scalability Considerations

* Use distributed queues (e.g., BullMQ or RabbitMQ) for scaling reminders.
* Cache frequent queries with Redis or in-memory solutions for faster table rendering.
* Support horizontal scaling via environment-specific DB endpoints and serverless functions.

---

## Frequently Asked Questions

### Multi-region Deployments

* Use globally available databases.
* Deploy via Vercel or other edge networks for low-latency access.
* Store reminders centrally to ensure consistent triggers.

### Recurring Events / Reminders

* Add `recurrence` field (`daily`, `weekly`, `monthly`) to events.
* Use serverless cron jobs or scheduled functions to generate recurring reminders.

### Shared Event Ownership

* Implement many-to-many relationships between users and events.
* Assign `owner`, `editor`, `viewer` roles for permission control.
* Validate permissions before any CRUD operation.

---

## Additional Notes

* **Testing**: Unit and integration tests implemented via Vitest.
* **Linting**: ESLint and Prettier configured for consistent code style.
* **Deployment**: Compatible with Vercel, Netlify, or custom Node.js servers.
