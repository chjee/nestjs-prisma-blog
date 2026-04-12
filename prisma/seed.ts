import * as bcrypt from 'bcrypt';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import { createPrismaAdapter } from '../src/prisma/prisma.adapter';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });

const SEED_PASSWORD = 'seed-password-123';

type SeedPost = {
  title: string;
  content: string;
  published: boolean;
  categoryNames: string[];
};

type SeedUser = {
  email: string;
  name: string;
  role: Role;
  profileBio?: string;
  posts: SeedPost[];
};

const seedUsers: SeedUser[] = [
  {
    email: 'seed.admin@example.com',
    name: 'Seed Admin',
    role: Role.ADMIN,
    profileBio:
      'Maintains the seeded admin account and reviews platform-level content.',
    posts: [
      {
        title: 'Release checklist for the blog API',
        content:
          'An admin-facing checklist covering migrations, smoke tests, and rollback notes before each release.',
        published: true,
        categoryNames: ['Backend', 'Operations'],
      },
      {
        title: 'Draft policy updates for moderators',
        content:
          'A draft note that demonstrates unpublished content and role-aware editorial workflows.',
        published: false,
        categoryNames: ['Operations', 'Internal'],
      },
    ],
  },
  {
    email: 'seed.author@example.com',
    name: 'Seed Author',
    role: Role.USER,
    profileBio:
      'Writes tutorials about NestJS, Prisma, and practical API design.',
    posts: [
      {
        title: 'How Prisma and NestJS fit together',
        content:
          'An introduction to modeling entities, wiring Prisma into Nest modules, and keeping contracts type-safe.',
        published: true,
        categoryNames: ['Backend', 'Prisma', 'NestJS'],
      },
      {
        title: 'Testing authenticated routes locally',
        content:
          'A walkthrough on seeding users, signing in with JWT, and verifying owner-only endpoints during development.',
        published: true,
        categoryNames: ['NestJS', 'Testing', 'Tutorials'],
      },
    ],
  },
  {
    email: 'seed.reader@example.com',
    name: 'Seed Reader',
    role: Role.USER,
    posts: [
      {
        title: 'Wishlist for future content',
        content:
          'A lightweight draft entry from a regular reader account to keep a non-admin, low-activity fixture in the database.',
        published: false,
        categoryNames: ['Community', 'Drafts'],
      },
    ],
  },
];

async function seedCategories(categoryNames: string[]) {
  await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
}

async function seedUser(user: SeedUser, hashedPassword: string) {
  const seededUser = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      role: user.role,
      password: hashedPassword,
    },
    create: {
      email: user.email,
      name: user.name,
      role: user.role,
      password: hashedPassword,
    },
  });

  if (user.profileBio) {
    await prisma.profile.upsert({
      where: { userId: seededUser.id },
      update: { bio: user.profileBio },
      create: { userId: seededUser.id, bio: user.profileBio },
    });
  } else {
    await prisma.profile.deleteMany({ where: { userId: seededUser.id } });
  }

  await prisma.post.deleteMany({ where: { userId: seededUser.id } });

  for (const post of user.posts) {
    await prisma.post.create({
      data: {
        title: post.title,
        content: post.content,
        published: post.published,
        userId: seededUser.id,
        categories: {
          connect: post.categoryNames.map((name) => ({ name })),
        },
      },
    });
  }

  return seededUser;
}

async function main() {
  const allCategoryNames = [
    ...new Set(
      seedUsers.flatMap((user) =>
        user.posts.flatMap((post) => post.categoryNames),
      ),
    ),
  ];

  await seedCategories(allCategoryNames);

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
  const users = [];

  for (const user of seedUsers) {
    users.push(await seedUser(user, hashedPassword));
  }

  const [userCount, postCount, categoryCount, profileCount] = await Promise.all(
    [
      prisma.user.count({
        where: { email: { in: seedUsers.map((user) => user.email) } },
      }),
      prisma.post.count({
        where: { user: { email: { in: seedUsers.map((user) => user.email) } } },
      }),
      prisma.category.count({
        where: { name: { in: allCategoryNames } },
      }),
      prisma.profile.count({
        where: { user: { email: { in: seedUsers.map((user) => user.email) } } },
      }),
    ],
  );

  console.log({
    seededEmails: seedUsers.map((user) => user.email),
    seededPassword: SEED_PASSWORD,
    userCount,
    postCount,
    categoryCount,
    profileCount,
    users,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
