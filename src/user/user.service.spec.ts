import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  user,
  users,
  createUserDto,
  updateUserDto,
} from '../common/constants/jest.constants';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, UserService],
    }).compile();

    service = moduleRef.get<UserService>(UserService);
  });

  describe('create', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'create').mockImplementation(async () => user);
      expect(await service.create(createUserDto)).toBe(user);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      jest.spyOn(service, 'findAll').mockImplementation(async () => users);
      expect(await service.findAll({ skip: 0, take: 3 })).toBe(users);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'findOne').mockImplementation(async () => user);
      expect(await service.findOne({ id: 1 })).toBe(user);
    });
  });

  describe('update', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'update').mockImplementation(async () => user);
      expect(
        await service.update({ where: { id: 1 }, data: updateUserDto }),
      ).toBe(user);
    });
  });

  describe('remove', () => {
    it('should return a user', async () => {
      jest.spyOn(service, 'remove').mockImplementation(async () => user);
      expect(await service.remove({ id: 1 })).toBe(user);
    });
  });
});
