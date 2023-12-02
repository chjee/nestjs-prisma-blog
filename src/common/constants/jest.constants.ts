import { Post, User } from '@prisma/client';
import { CreateUserDto } from './../../user/dto/create-user.dto';
import { UpdateUserDto } from './../../user/dto/update-user.dto';
import { CreatePostDto } from './../../post/dto/create-post.dto';
import { UpdatePostDto } from './../../post/dto/update-post.dto';

export const post: Post = {
  id: 1,
  title: 'Test Post',
  published: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 1,
};
export const posts: Post[] = [post];

export const createPostDto: CreatePostDto = {
  title: 'Just 10 minutes.',
  published: false,
  userId: 1,
  user: {
    connect: {
      id: 1,
    },
  },
};

export const updatePostDto: UpdatePostDto = {
  title: 'Just 5 minutes.',
  published: true,
};

export const user: User = {
  id: 1,
  createdAt: new Date(),
  email: 'andrew@prisma.io',
  name: 'Andrew',
  password: 'whoami',
  role: 'ADMIN',
};
export const users: User[] = [user];

export const createUserDto: CreateUserDto = {
  email: 'chjee@naver.com',
  name: 'Andrew',
  password: '123456',
  role: 'ADMIN',
};

export const updateUserDto: UpdateUserDto = {
  name: 'Andy',
  role: 'USER',
};
