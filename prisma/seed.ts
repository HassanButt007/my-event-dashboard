import { PrismaClient, User } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Local enum to match Prisma schema
enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELED = "CANCELED",
}

const dummyEvents: {
  title: string;
  description: string;
  location: string;
  status: EventStatus;
}[] = [
    { title: "Tech Conference", description: "A conference about latest tech trends", location: "US-NY: New York", status: EventStatus.PUBLISHED },
    { title: "Music Festival", description: "Annual music festival", location: "US-CA: Los Angeles", status: EventStatus.DRAFT },
    { title: "Startup Meetup", description: "Networking for startups", location: "US-TX: Austin", status: EventStatus.CANCELED },
    { title: "Art Expo", description: "Exhibition of modern art", location: "US-NY: New York", status: EventStatus.PUBLISHED },
    { title: "Food Fair", description: "Tasting event for gourmet food", location: "US-CA: San Francisco", status: EventStatus.DRAFT },
    { title: "Marathon", description: "City marathon event", location: "US-TX: Houston", status: EventStatus.PUBLISHED },
    { title: "Book Launch", description: "New book release", location: "US-NY: New York", status: EventStatus.DRAFT },
    { title: "Charity Gala", description: "Fundraising gala", location: "US-CA: Los Angeles", status: EventStatus.CANCELED },
    { title: "Film Screening", description: "Indie film premiere", location: "US-TX: Dallas", status: EventStatus.PUBLISHED },
    { title: "Gaming Tournament", description: "Esports competition", location: "US-NY: New York", status: EventStatus.DRAFT },
    { title: "Tech Workshop", description: "Hands-on tech workshop", location: "US-CA: San Francisco", status: EventStatus.PUBLISHED },
    { title: "Yoga Retreat", description: "Weekend wellness retreat", location: "US-TX: Austin", status: EventStatus.DRAFT },
    { title: "Photography Expo", description: "Photography exhibition", location: "US-NY: New York", status: EventStatus.CANCELED },
    { title: "Coding Bootcamp", description: "Intensive coding training", location: "US-CA: Los Angeles", status: EventStatus.PUBLISHED },
    { title: "Wine Tasting", description: "Gourmet wine event", location: "US-TX: Houston", status: EventStatus.DRAFT },
    { title: "Startup Pitch", description: "Pitch your startup idea", location: "US-NY: New York", status: EventStatus.PUBLISHED },
    { title: "Comedy Night", description: "Stand-up comedy show", location: "US-CA: San Francisco", status: EventStatus.CANCELED },
    { title: "Fashion Show", description: "Latest fashion trends", location: "US-TX: Dallas", status: EventStatus.PUBLISHED },
    { title: "Charity Run", description: "5k fundraising run", location: "US-NY: New York", status: EventStatus.DRAFT },
    { title: "Film Festival", description: "Independent films showcase", location: "US-CA: Los Angeles", status: EventStatus.PUBLISHED },
  
];

function randomReminderOffset(): number {
  const min = 15 * 60 * 1000; // 15 minutes
  const max = 7 * 24 * 60 * 60 * 1000; // 7 days
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function main() {
  console.log("Seeding database...");

  await prisma.reminder.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleared old data");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.create({ data: { name: "Alice", email: "alice@example.com", password: hashedPassword } });
  const bob = await prisma.user.create({ data: { name: "Bob", email: "bob@example.com", password: hashedPassword } });

  const users: User[] = [alice, bob];
  console.log("✅ Users seeded");

  type EventRecord = { id: number; date: Date };
  const events: EventRecord[] = [];

  // Use for-of to avoid 'possibly undefined'
  for (const [i, eventData] of dummyEvents.entries()) {
    const user = users[i % users.length];
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + i + 1);

    const eventCreated = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        date: eventDate,
        status: eventData.status,
        userId: user!.id,
      },
    });

    events.push({ id: eventCreated.id, date: eventCreated.date });
  }

  console.log("✅ Events seeded");

  // Seed reminders
  for (const user of users) {
    for (let i = 0; i < 5; i++) {
      const event = events[i % events.length];
      const offset = randomReminderOffset();
      const reminderTime = new Date(event!.date.getTime() - offset);

      await prisma.reminder.create({
        data: {
          eventId: event!.id,
          userId: user.id,
          reminderTime,
        },
      });
    }
  }

  console.log("✅ Randomized reminders per user seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
