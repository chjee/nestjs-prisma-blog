import { NotFoundException } from '@nestjs/common';
import { Profile } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from './profile.service';

type MockPrismaProfileDelegate = {
  findUnique: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
};

describe('ProfileService', () => {
  let prisma: PrismaService & { profile: MockPrismaProfileDelegate };
  let service: ProfileService;

  const profile: Profile = {
    id: 1,
    bio: 'Software engineer who loves Prisma.',
    userId: 1,
  };

  beforeEach(() => {
    prisma = {
      profile: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as PrismaService & { profile: MockPrismaProfileDelegate };

    service = new ProfileService(prisma);
  });

  describe('findOne', () => {
    it('returns a profile when it exists', async () => {
      prisma.profile.findUnique.mockResolvedValue(profile);

      await expect(service.findOne(1)).resolves.toBe(profile);
      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('throws when the profile does not exist', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('upsert', () => {
    it('creates or updates a profile', async () => {
      prisma.profile.upsert.mockResolvedValue(profile);

      await expect(
        service.upsert(1, { bio: 'Software engineer who loves Prisma.' }),
      ).resolves.toBe(profile);
      expect(prisma.profile.upsert).toHaveBeenCalledWith({
        where: { userId: 1 },
        update: { bio: 'Software engineer who loves Prisma.' },
        create: { userId: 1, bio: 'Software engineer who loves Prisma.' },
      });
    });
  });

  describe('remove', () => {
    it('deletes a profile when it exists', async () => {
      prisma.profile.findUnique.mockResolvedValue(profile);
      prisma.profile.delete.mockResolvedValue(profile);

      await expect(service.remove(1)).resolves.toBe(profile);
      expect(prisma.profile.delete).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('throws when the profile does not exist', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
