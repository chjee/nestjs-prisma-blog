import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createUserDto,
  updateUserDto,
  user,
  users,
} from '../common/constants/jest.constants';

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
    it('should hash the password before creating a user', async () => {
      prisma.user.create.mockResolvedValue(user);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashed-password' as never);

      const result = await service.create(createUserDto);

      expect(hashSpy).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { ...createUserDto, password: 'hashed-password' },
      });
      expect(result).toBe(user);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
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
    it('should return a user', async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.findOne({ id: 1 })).resolves.toBe(user);
    });

    it('should throw when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne({ id: 999 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should hash an updated password before persisting the user', async () => {
      const updatedUser = { ...user, name: 'Andy' } satisfies User;
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(updatedUser);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('rehashed-password' as never);

      const result = await service.update({
        where: { id: 1 },
        data: { password: 'new-password', name: 'Andy' },
      });

      expect(hashSpy).toHaveBeenCalledWith('new-password', 10);
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
      expect(result).toBe(updatedUser);
    });

    it('should return a user when updating non-password fields', async () => {
      const updatedUser = { ...user, ...updateUserDto } satisfies User;
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(updatedUser);

      await expect(
        service.update({ where: { id: 1 }, data: updateUserDto }),
      ).resolves.toBe(updatedUser);
    });

    it('should throw when the user to update does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update({ where: { id: 999 }, data: updateUserDto }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should return a user', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.delete.mockResolvedValue(user);

      await expect(service.remove({ id: 1 })).resolves.toBe(user);
    });

    it('should throw when the user to delete does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove({ id: 999 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
