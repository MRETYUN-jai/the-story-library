import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCovers() {
  await prisma.book.updateMany({
    where: { slug: 'can-love-survive' },
    data: { coverImage: '/covers/can-love-survive.png' },
  });

  await prisma.book.updateMany({
    where: { slug: 'not-like-this' },
    data: { coverImage: '/covers/not-like-this.png' },
  });

  await prisma.book.updateMany({
    where: { slug: 'only-if-it-waits' },
    data: { coverImage: '/covers/only-if-it-waits.png' },
  });

  const books = await prisma.book.findMany({
    select: { slug: true, title: true, coverImage: true },
  });

  console.log('Updated books in DB:', books);
}

updateCovers()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
