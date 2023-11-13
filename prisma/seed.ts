import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@prisma.io' },
    update: {},
    create: {
      email: 'alice@prisma.io',
      name: 'Alice',
      password: 'whoami',
      posts: {
        create: {
          title: 'Check out Prisma with Nest.js',
          published: true,
          categories: {
            create: [{ name: 'Prisma' }, { name: 'Nest.js' }],
          },
        },
      },
    },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@prisma.io' },
    update: {},
    create: {
      email: 'bob@prisma.io',
      name: 'Bob',
      password: 'whoami',
      posts: {
        create: [
          {
            title: 'Follow Prisma on Twitter',
            published: true,
            categories: {
              create: { name: 'Twitter' },
            },
          },
          {
            title: 'Follow Nexus on Twitter',
            published: true,
            categories: {
              create: { name: 'Nexus' },
            },
          },
        ],
      },
    },
  });
  const ariadne = await prisma.user.upsert({
    where: { email: 'ariadne@prisma.io' },
    update: {},
    create: {
      email: 'ariadne@prisma.io',
      name: 'Ariadne',
      password: 'whoami',
      posts: {
        create: [
          {
            title: 'My first day at Prisma',
            published: true,
            categories: {
              create: { name: 'Office' },
            },
          },
          {
            title: 'How to connect to a SQLite database',
            published: true,
            categories: {
              create: [{ name: 'Databases' }, { name: 'Tutorials' }],
            },
          },
        ],
      },
    },
  });
  console.log({ alice, bob, ariadne });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
