import { PrismaClient, EventStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear old data
  await prisma.reminder.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleared old data');

  // Seed Users
  const password = await bcrypt.hash('password123', 10);
  const user1 = await prisma.user.create({
    data: { name: 'Alice', email: 'alice@example.com', password },
  });
  const user2 = await prisma.user.create({
    data: { name: 'Bob', email: 'bob@example.com', password },
  });
  const users = [user1, user2];
  console.log('✅ Users seeded');

  // All events (unchanged)
  const dummyEvents = [
    { title: 'Tech Conference', description: 'A conference about latest tech trends', location: 'US-NY: New York', status: EventStatus.PUBLISHED },
    { title: 'Music Festival', description: 'Annual music festival', location: 'US-CA: Los Angeles', status: EventStatus.DRAFT },
    { title: 'Startup Meetup', description: 'Networking for startups', location: 'US-TX: Austin', status: EventStatus.CANCELED },
    { title: 'Art Expo', description: 'Exhibition of modern art', location: 'US-NY: New York', status: EventStatus.PUBLISHED },
    { title: 'Food Fair', description: 'Tasting event for gourmet food', location: 'US-CA: San Francisco', status: EventStatus.DRAFT },
    { title: 'Marathon', description: 'City marathon event', location: 'US-TX: Houston', status: EventStatus.PUBLISHED },
    { title: 'Book Launch', description: 'New book release', location: 'US-NY: New York', status: EventStatus.DRAFT },
    { title: 'Charity Gala', description: 'Fundraising gala', location: 'US-CA: Los Angeles', status: EventStatus.CANCELED },
    { title: 'Film Screening', description: 'Indie film premiere', location: 'US-TX: Dallas', status: EventStatus.PUBLISHED },
    { title: 'Gaming Tournament', description: 'Esports competition', location: 'US-NY: New York', status: EventStatus.DRAFT },
    { title: 'Tech Workshop', description: 'Hands-on tech workshop', location: 'US-CA: San Francisco', status: EventStatus.PUBLISHED },
    { title: 'Yoga Retreat', description: 'Weekend wellness retreat', location: 'US-TX: Austin', status: EventStatus.DRAFT },
    { title: 'Photography Expo', description: 'Photography exhibition', location: 'US-NY: New York', status: EventStatus.CANCELED },
    { title: 'Coding Bootcamp', description: 'Intensive coding training', location: 'US-CA: Los Angeles', status: EventStatus.PUBLISHED },
    { title: 'Wine Tasting', description: 'Gourmet wine event', location: 'US-TX: Houston', status: EventStatus.DRAFT },
    { title: 'Startup Pitch', description: 'Pitch your startup idea', location: 'US-NY: New York', status: EventStatus.PUBLISHED },
    { title: 'Comedy Night', description: 'Stand-up comedy show', location: 'US-CA: San Francisco', status: EventStatus.CANCELED },
    { title: 'Fashion Show', description: 'Latest fashion trends', location: 'US-TX: Dallas', status: EventStatus.PUBLISHED },
    { title: 'Charity Run', description: '5k fundraising run', location: 'US-NY: New York', status: EventStatus.DRAFT },
    { title: 'Film Festival', description: 'Independent films showcase', location: 'US-CA: Los Angeles', status: EventStatus.PUBLISHED },
  ];

  const events = [];

  for (let i = 0; i < dummyEvents.length; i++) {
    const eventData = dummyEvents[i];
    const user = users[i % users.length];

    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + i + 1);

    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        date: eventDate,
        status: eventData.status,
        userId: user.id,
      },
    });

    events.push(event);
  }

  console.log('✅ Events seeded');

  // Only 5 reminders per user
  const reminderOffsets = [
    15 * 60 * 1000,       // 15 mins
    60 * 60 * 1000,       // 1 hr
    3 * 60 * 60 * 1000,   // 3 hrs
    24 * 60 * 60 * 1000,  // 1 day
    3 * 24 * 60 * 60 * 1000 // 3 days
  ];

  for (const user of users) {
    for (let i = 0; i < 5; i++) {
      const event = events[i];
      const offset = reminderOffsets[i];
      const reminderTime = new Date(event.date.getTime() - offset);

      await prisma.reminder.create({
        data: {
          eventId: event.id,
          userId: user.id,
          reminderTime,
        },
      });
    }
  }

  console.log('✅ 5 Reminders per user seeded');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
