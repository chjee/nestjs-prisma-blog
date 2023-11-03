import { $Enums, User } from '@prisma/client';

export class UserEntity implements User {
  id: number;
  createdAt: Date;
  name: string;
  email: string;
  role: $Enums.Role;
}
