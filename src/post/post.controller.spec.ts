import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import { Post } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

describe('PostController', () => {
  let controller: PostController;
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [PrismaService, PostService],
    }).compile();

    controller = module.get<PostController>(PostController);
    service = module.get<PostService>(PostService);
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
      expect(await controller.create(createPostDto)).toBe(post);
    });
  });

  describe('findAll', () => {
    it('should return an array of posts', async () => {
      jest.spyOn(service, 'findAll').mockImplementation(async () => posts);
      expect(await controller.findAll(0, 2)).toBe(posts);
    });
  });

  describe('findOne', () => {
    it('should return a post', async () => {
      jest.spyOn(service, 'findOne').mockImplementation(async () => post);
      expect(await controller.findOne(1)).toBe(post);
    });
  });

  describe('update', () => {
    it('should return a post', async () => {
      const updatePostDto: UpdatePostDto = {
        title: 'Just 10 minutes.',
        published: true,
      };

      jest.spyOn(service, 'update').mockImplementation(async () => post);
      expect(await controller.update(1, updatePostDto)).toBe(post);
    });
  });

  describe('remove', () => {
    it('should return a post', async () => {
      jest.spyOn(service, 'remove').mockImplementation(async () => post);
      expect(await controller.remove(1)).toBe(post);
    });
  });
});
