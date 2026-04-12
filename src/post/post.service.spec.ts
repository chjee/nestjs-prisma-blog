import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  createPostDto,
  post,
  posts,
  updatePostDto,
} from '../common/constants/jest.constants';
import { PostService } from './post.service';

type MockPrismaPostDelegate = {
  create: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

describe('PostService', () => {
  let prisma: PrismaService & { post: MockPrismaPostDelegate };
  let service: PostService;

  beforeEach(() => {
    prisma = {
      post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as PrismaService & { post: MockPrismaPostDelegate };

    service = new PostService(prisma);
  });

  describe('create', () => {
    it('creates a post through Prisma', async () => {
      prisma.post.create.mockResolvedValue(post);

      const createPostInput = { ...createPostDto, userId: 1 };

      await expect(service.create(createPostInput)).resolves.toBe(post);
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: createPostInput,
      });
    });
  });

  describe('findAll', () => {
    it('returns posts with related user and category data', async () => {
      prisma.post.findMany.mockResolvedValue(posts);

      await expect(service.findAll({ skip: 0, take: 3 })).resolves.toBe(posts);
      expect(prisma.post.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 3,
        cursor: undefined,
        where: undefined,
        orderBy: undefined,
        include: {
          user: { select: { name: true, email: true, role: true } },
          categories: { select: { name: true } },
        },
      });
    });
  });

  describe('findOne', () => {
    it('returns a post when it exists', async () => {
      prisma.post.findUnique.mockResolvedValue(post);

      await expect(service.findOne({ id: 1 })).resolves.toBe(post);
    });

    it('throws when the post does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne({ id: 999 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates a post when it exists', async () => {
      prisma.post.findUnique.mockResolvedValue(post);
      prisma.post.update.mockResolvedValue(post);

      await expect(
        service.update({ where: { id: 1 }, data: updatePostDto }),
      ).resolves.toBe(post);
      expect(prisma.post.update).toHaveBeenCalledWith({
        data: updatePostDto,
        where: { id: 1 },
      });
    });

    it('throws when the post to update does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.update({ where: { id: 999 }, data: updatePostDto }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a post when it exists', async () => {
      prisma.post.findUnique.mockResolvedValue(post);
      prisma.post.delete.mockResolvedValue(post);

      await expect(service.remove({ id: 1 })).resolves.toBe(post);
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('throws when the post to delete does not exist', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.remove({ id: 999 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
