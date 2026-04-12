import { Role } from '../../generated/prisma/client';
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<Role[]>();
