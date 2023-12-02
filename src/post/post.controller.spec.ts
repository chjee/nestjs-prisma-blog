import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  post,
  posts,
  createPostDto,
  updatePostDto,
} from '../common/constants/jest.constants';

describe('PostController', () => {
  let controller: PostController;
  let service: PostService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [PrismaService, PostService],
    }).compile();

    controller = moduleRef.get<PostController>(PostController);
    service = moduleRef.get<PostService>(PostService);
  });

  describe('create', () => {
    it('should return a post', async () => {
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
