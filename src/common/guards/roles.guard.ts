import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '../../generated/prisma/client';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: Role; roles?: Role[] } | undefined;
    const userRoles = user?.roles ?? (user?.role ? [user.role] : []);

    return userRoles.some((role) => roles.includes(role));
  }
}
