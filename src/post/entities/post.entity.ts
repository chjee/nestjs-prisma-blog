import { Post } from '@prisma/client';

export class PostEntity implements Post {
  userId: number;
  id: number;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  content: string;
  published: boolean;
}
