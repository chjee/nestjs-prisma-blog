import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  const userService = {
    findUser: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(),
  };
  const mockUser = {
    id: 1,
    name: 'Alice',
    email: 'alice@prisma.io',
    password: 'hashed-password',
    role: Role.USER,
    createdAt: new Date('2026-04-11T00:00:00.000Z'),
    updatedAt: new Date('2026-04-11T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return the authenticated user without the password field', async () => {
      userService.findUser.mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        service.validateUser(mockUser.email, 'plain-password'),
      ).resolves.toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null when the password does not match', async () => {
      userService.findUser.mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.validateUser(mockUser.email, 'wrong-password'),
      ).resolves.toBeNull();
    });

    it('should return null when the user does not exist', async () => {
      userService.findUser.mockRejectedValue(new NotFoundException());
      const compareMock = jest.mocked(bcrypt.compare);

      await expect(
        service.validateUser('missing@prisma.io', 'plain-password'),
      ).resolves.toBeNull();
      expect(compareMock).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should sign the current JWT payload shape', async () => {
      jwtService.sign.mockReturnValue('signed-token');

      await expect(
        service.login({
          id: mockUser.id,
          name: mockUser.name,
          role: mockUser.role,
        }),
      ).resolves.toEqual({
        access_token: 'signed-token',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        name: mockUser.name,
        role: mockUser.role,
        sub: mockUser.id,
      });
    });
  });
});
