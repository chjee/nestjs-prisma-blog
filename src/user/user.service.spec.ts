import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  createUserDto,
  updateUserDto,
  user,
  users,
} from '../common/constants/jest.constants';
import { UserService } from './user.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

type MockPrismaUserDelegate = {
  create: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

describe('UserService', () => {
  let prisma: PrismaService & { user: MockPrismaUserDelegate };
  let service: UserService;

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as PrismaService & { user: MockPrismaUserDelegate };

    service = new UserService(prisma);
  });

  describe('create', () => {
    it('hashes the password before creating a user', async () => {
      prisma.user.create.mockResolvedValue(user);
      const hashMock = jest
        .mocked(bcrypt.hash)
        .mockResolvedValue('hashed-password' as never);

      await expect(service.create(createUserDto)).resolves.toBe(user);
      expect(hashMock).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { ...createUserDto, password: 'hashed-password' },
      });
    });
  });

  describe('findAll', () => {
    it('returns users with related profile and posts data', async () => {
      prisma.user.findMany.mockResolvedValue(users);

      await expect(service.findAll({ skip: 0, take: 3 })).resolves.toBe(users);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: true,
          posts: true,
        },
        skip: 0,
        take: 3,
        cursor: undefined,
        where: undefined,
        orderBy: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('returns a user when it exists', async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.findOne({ id: 1 })).resolves.toBe(user);
    });

    it('throws when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne({ id: 999 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findUser', () => {
    it('returns a user with profile data when it exists', async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.findUser({ id: 1 })).resolves.toBe(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        include: {
          profile: true,
        },
        where: { id: 1 },
      });
    });

    it('throws when the auth lookup user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findUser({ email: 'missing@prisma.io' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('hashes an updated password before persisting the user', async () => {
      const updatedUser = { ...user, name: 'Andy' } satisfies User;
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(updatedUser);
      const hashMock = jest
        .mocked(bcrypt.hash)
        .mockResolvedValue('rehashed-password' as never);

      await expect(
        service.update({
          where: { id: 1 },
          data: { password: 'new-password', name: 'Andy' },
        }),
      ).resolves.toBe(updatedUser);
      expect(hashMock).toHaveBeenCalledWith('new-password', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        data: { password: 'rehashed-password', name: 'Andy' },
        where: { id: 1 },
      });
    });

    it('updates a user when it exists', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      await expect(
        service.update({ where: { id: 1 }, data: updateUserDto }),
      ).resolves.toBe(user);
      expect(prisma.user.update).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        data: updateUserDto,
        where: { id: 1 },
      });
    });

    it('throws when the user to update does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update({ where: { id: 999 }, data: updateUserDto }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a user when it exists', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.delete.mockResolvedValue(user);

      await expect(service.remove({ id: 1 })).resolves.toBe(user);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        where: { id: 1 },
      });
    });

    it('throws when the user to delete does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove({ id: 999 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('translates foreign-key delete conflicts into a conflict exception', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          {
            code: 'P2003',
            clientVersion: '7.7.0',
          },
        ),
      );

      await expect(service.remove({ id: 1 })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
