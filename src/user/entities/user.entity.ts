import { $Enums, User } from '@prisma/client';

export class UserEntity implements User {
  id: number;
  createdAt: Date;
  username: string;
  password: string;
  email: string;
  role: $Enums.Role;
}
