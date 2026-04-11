import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService authorization', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService({} as PrismaService);
  });

  it('allows users to manage their own account', () => {
    expect(() => service.assertOwnerOrAdmin(1, 1, 'USER')).not.toThrow();
  });

  it('allows admins to manage other accounts', () => {
    expect(() => service.assertOwnerOrAdmin(1, 99, 'ADMIN')).not.toThrow();
  });

  it('rejects non-admin users managing another account', () => {
    expect(() => service.assertOwnerOrAdmin(2, 1, 'USER')).toThrow(
      ForbiddenException,
    );
  });
});
