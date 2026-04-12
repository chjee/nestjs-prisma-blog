import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createUserDto,
  updateUserDto,
  user,
  users,
} from '../common/constants/jest.constants';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
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
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: service,
        },
      ],
    }).compile();

    controller = moduleRef.get<UserController>(UserController);
  });

  describe('create', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'create').mockImplementation(async () => user);
      expect(await controller.create(createUserDto)).toBe(user);
    });
  });

  describe('findAll', () => {
    it('should return paginated users with a total count', async () => {
      jest.spyOn(service, 'findAll').mockImplementation(async () => users);
      jest.spyOn(service, 'count').mockResolvedValue(2);

      await expect(controller.findAll(0, 2)).resolves.toEqual({
        data: users,
        total: 2,
      });
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'findOne').mockImplementation(async () => user);
      expect(await controller.findOne(1)).toBe(user);
    });
  });

  describe('update', () => {
    it('should return a user for the owner', async () => {
      jest
        .spyOn(service, 'assertOwnerOrAdmin')
        .mockImplementation(() => undefined);
      const updateSpy = jest
        .spyOn(service, 'update')
        .mockImplementation(async () => user);

      expect(await controller.update(1, updateUserDto, 1, 'USER')).toBe(user);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: updateUserDto.name },
      });
    });

    it('should allow admins to update roles', async () => {
      jest
        .spyOn(service, 'assertOwnerOrAdmin')
        .mockImplementation(() => undefined);
      const updateSpy = jest
        .spyOn(service, 'update')
        .mockImplementation(async () => user);

      await controller.update(1, updateUserDto, 99, 'ADMIN');

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateUserDto,
      });
    });

    it('should reject updates for non-owners without admin access', async () => {
      jest.spyOn(service, 'assertOwnerOrAdmin').mockImplementation(() => {
        throw new ForbiddenException();
      });

      await expect(
        controller.update(2, updateUserDto, 1, 'USER'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should return a user for admins', async () => {
      jest
        .spyOn(service, 'assertOwnerOrAdmin')
        .mockImplementation(() => undefined);
      jest.spyOn(service, 'remove').mockImplementation(async () => user);

      expect(await controller.remove(1, 99, 'ADMIN')).toBe(user);
    });
  });
});
