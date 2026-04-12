import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const getRequest = jest.fn();
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest,
    }),
  } as unknown as ExecutionContext;

  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows requests when no role metadata is present', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a matching single role from the JWT payload', () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue(['ADMIN'] satisfies Role[]);
    getRequest.mockReturnValue({ user: { role: 'ADMIN' satisfies Role } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects requests without a matching role', () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue(['ADMIN'] satisfies Role[]);
    getRequest.mockReturnValue({ user: { role: 'USER' satisfies Role } });

    expect(guard.canActivate(context)).toBe(false);
  });
});
