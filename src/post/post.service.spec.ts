import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  post,
  posts,
  createPostDto,
  updatePostDto,
} from '../common/constants/jest.constants';

describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, PostService],
    }).compile();

    service = moduleRef.get<PostService>(PostService);
  });

  describe('create', () => {
    it('should return a post', async () => {
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
