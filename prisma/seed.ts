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
          content:
            'Prisma and Nest.js work well together for quickly building typed APIs.',
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
            content: 'Prisma shares release notes, guides, and community updates.',
            published: true,
            categories: {
              create: { name: 'Twitter' },
            },
          },
          {
            title: 'Follow Nexus on Twitter',
            content:
              'Nexus posts ecosystem news and practical GraphQL development tips.',
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
            content:
              'A short diary entry about onboarding, teammates, and the office setup.',
            published: true,
            categories: {
              create: { name: 'Office' },
            },
          },
          {
            title: 'How to connect to a SQLite database',
            content:
              'A walkthrough for configuring a SQLite datasource and first query.',
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
