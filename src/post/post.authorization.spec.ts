import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostService } from './post.service';

type MockPrismaPostDelegate = {
  findUnique: jest.Mock;
};

describe('PostService authorization', () => {
  let prisma: PrismaService & { post: MockPrismaPostDelegate };
  let service: PostService;

  beforeEach(() => {
    prisma = {
      post: {
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService & { post: MockPrismaPostDelegate };

    service = new PostService(prisma);
  });

  it('allows admins to manage any post without loading ownership', async () => {
    await expect(
      service.assertOwnerOrAdmin(1, 99, 'ADMIN'),
    ).resolves.toBeUndefined();
    expect(prisma.post.findUnique).not.toHaveBeenCalled();
  });

  it('allows owners to manage their own post', async () => {
    prisma.post.findUnique.mockResolvedValue({ userId: 1 });

    await expect(
      service.assertOwnerOrAdmin(1, 1, 'USER'),
    ).resolves.toBeUndefined();
  });

  it("rejects non-owners managing another user's post", async () => {
    prisma.post.findUnique.mockResolvedValue({ userId: 2 });

    await expect(
      service.assertOwnerOrAdmin(1, 1, 'USER'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when the post does not exist', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(
      service.assertOwnerOrAdmin(1, 1, 'USER'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
