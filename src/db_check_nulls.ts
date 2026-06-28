import { prisma } from './db/prisma';

async function main() {
  const trips = await prisma.trip.findMany({
    where: {
      status: 'COMPLETED',
    },
  });

  console.log('--- COMPLETED TRIPS COLUMNS ---');
  for (const t of trips) {
    console.log({
      id: t.id,
      type: t.type,
      destination: t.destination,
      coverImage: t.coverImage ? 'Present' : null,
      perPersonCost: t.perPersonCost,
      hasResponse: !!t.response,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
