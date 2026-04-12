import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createPostDto,
  post,
  posts,
  updatePostDto,
} from '../common/constants/jest.constants';
import { PostController } from './post.controller';
import { PostService } from './post.service';

describe('PostController', () => {
  let controller: PostController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    count: jest.Mock;
    findOne: jest.Mock;
    assertOwnerOrAdmin: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      assertOwnerOrAdmin: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: service,
        },
      ],
    }).compile();

    controller = moduleRef.get<PostController>(PostController);
  });

  describe('create', () => {
    it('should return a post', async () => {
      jest.spyOn(service, 'create').mockImplementation(async () => post);
      expect(await controller.create(createPostDto)).toBe(post);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts with a total count', async () => {
      jest.spyOn(service, 'findAll').mockImplementation(async () => posts);
      jest.spyOn(service, 'count').mockResolvedValue(2);

      await expect(controller.findAll(0, 2)).resolves.toEqual({
        data: posts,
        total: 2,
      });
    });
  });

  describe('findOne', () => {
    it('should return a post', async () => {
      jest.spyOn(service, 'findOne').mockImplementation(async () => post);
      expect(await controller.findOne(1)).toBe(post);
    });
  });

  describe('update', () => {
    it('should return a post for the owner', async () => {
      jest.spyOn(service, 'assertOwnerOrAdmin').mockResolvedValue(undefined);
      jest.spyOn(service, 'update').mockImplementation(async () => post);

      expect(await controller.update(1, updatePostDto, 1, 'USER')).toBe(post);
    });

    it('should reject updates for non-owners without admin access', async () => {
      jest
        .spyOn(service, 'assertOwnerOrAdmin')
        .mockRejectedValue(new ForbiddenException());

      await expect(
        controller.update(1, updatePostDto, 2, 'USER'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should return a post for admins', async () => {
      jest.spyOn(service, 'assertOwnerOrAdmin').mockResolvedValue(undefined);
      jest.spyOn(service, 'remove').mockImplementation(async () => post);

      expect(await controller.remove(1, 99, 'ADMIN')).toBe(post);
    });
  });
});
