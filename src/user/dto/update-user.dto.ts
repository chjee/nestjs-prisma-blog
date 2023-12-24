import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PickType(PartialType(CreateUserDto), [
  'name',
  'role',
] as const) {}
