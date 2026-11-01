const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.product.findMany({
    where: {
      images: {
        has: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
      },
    },
  });

  console.log(`Found ${prods.length} products with incorrect egg photo.`);
  for (const p of prods) {
    const updated = p.images.map((img) =>
      img.includes('1516467508483-a7212febe31a')
        ? 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80'
        : img
    );
    await prisma.product.update({
      where: { id: p.id },
      data: { images: updated },
    });
  }
  console.log('Successfully updated all egg product photos in the database!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

