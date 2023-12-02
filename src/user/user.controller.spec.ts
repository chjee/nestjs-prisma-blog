import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  user,
  users,
  createUserDto,
  updateUserDto,
} from '../common/constants/jest.constants';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [PrismaService, UserService],
    }).compile();

    controller = moduleRef.get<UserController>(UserController);
    service = moduleRef.get<UserService>(UserService);
    // controller = await moduleRef.resolve<UserController>(UserController);
    // service = await moduleRef.resolve<UserService>(UserService);
  });

  describe('create', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'create').mockImplementation(async () => user);
      expect(await controller.create(createUserDto)).toBe(user);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      // jest.spyOn(service, 'findAll').mockResolvedValue(users);
      jest.spyOn(service, 'findAll').mockImplementation(async () => users);
      expect(await controller.findAll(0, 2)).toBe(users);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'findOne').mockImplementation(async () => user);
      expect(await controller.findOne(1)).toBe(user);
    });
  });

  describe('update', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'update').mockImplementation(async () => user);
      expect(await controller.update(1, updateUserDto)).toBe(user);
    });
  });

  describe('remove', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'remove').mockImplementation(async () => user);
      expect(await controller.remove(1)).toBe(user);
    });
  });
});
