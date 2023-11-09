import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<Partial<User>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        profile: true,
        posts: true,
      },
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<Partial<User>> {
    return this.prisma.user.findUnique({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        profile: true,
        posts: true,
      },
      where,
    });
  }

  // async findOne(where: Prisma.UserWhereUniqueInput): Promise<User> {
  //   return this.prisma.user.findUnique({
  //     include: {
  //       posts: true,
  //       profile: true,
  //     },
  //     where,
  //   });
  // }

  async findUser(username: string): Promise<User> {
    return this.prisma.user.findFirst({
      include: {
        profile: true,
      },
      where: { username: username },
    });
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<Partial<User>> {
    const { where, data } = params;
    return this.prisma.user.update({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
      data,
      where,
    });
  }

  async remove(where: Prisma.UserWhereUniqueInput): Promise<Partial<User>> {
    return this.prisma.user.delete({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
      where,
    });
  }
}
