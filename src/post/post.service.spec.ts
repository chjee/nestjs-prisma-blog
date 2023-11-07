import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from '@prisma/client';
import { UpdatePostDto } from './dto/update-post.dto';

describe('PostService', () => {
  let service: PostService;

  const post: Post = {
    id: 1,
    title: 'Test Post',
    published: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 1,
  };

  const posts: Post[] = [
    {
      id: 1,
      title: 'Test Post',
      published: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 1,
    },
  ];
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, PostService],
    }).compile();

    service = moduleRef.get<PostService>(PostService);
  });

  describe('create', () => {
    it('should return a post', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Just 10 minutes.',
        published: false,
        userId: 1,
        user: {
          connect: {
            id: 1,
          },
        },
      };

      jest.spyOn(service, 'create').mockImplementation(async () => post);
      expect(await service.create(createPostDto)).toBe(post);
    });
  });

  describe('findAll', () => {
    it('should return an array of posts', async () => {
      jest.spyOn(service, 'findAll').mockImplementation(async () => posts);
      expect(await service.findAll({ skip: 0, take: 3 })).toBe(posts);
    });
  });

  describe('findOne', () => {
    it('should return a post', async () => {
      jest.spyOn(service, 'findOne').mockImplementation(async () => post);
      expect(await service.findOne({ id: 1 })).toBe(post);
    });
  });

  describe('update', () => {
    it('should return a post', async () => {
      const updatePostDto: UpdatePostDto = {
        title: 'Just 5 minutes.',
        published: true,
      };
      jest.spyOn(service, 'update').mockImplementation(async () => post);
      expect(
        await service.update({ where: { id: 1 }, data: updatePostDto }),
      ).toBe(post);
    });
  });

  describe('remove', () => {
    it('should return a post', async () => {
      jest.spyOn(service, 'remove').mockImplementation(async () => post);
      expect(await service.remove({ id: 1 })).toBe(post);
    });
  });
});
