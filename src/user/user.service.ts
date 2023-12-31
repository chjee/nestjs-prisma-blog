import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(UserService.name);

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
        name: true,
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
    const user = await this.prisma.user.findUnique({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: true,
        posts: true,
      },
      where,
    });

    if (!user) {
      this.logger.error(`User not found: ${JSON.stringify(where)}`);
      throw new NotFoundException();
    }

    return user;
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

  async findUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.prisma.user.findUnique({
      include: {
        profile: true,
      },
      where,
    });

    if (!user) {
      this.logger.error(`User not found: ${JSON.stringify(where)}`);
      throw new NotFoundException();
    }

    return user;
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<Partial<User>> {
    const { where, data } = params;
    const user = await this.prisma.user.findUnique({
      where,
    });

    if (!user) {
      this.logger.error(`User not found: ${JSON.stringify(where)}`);
      throw new NotFoundException();
    }

    return this.prisma.user.update({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      data,
      where,
    });
  }

  async remove(where: Prisma.UserWhereUniqueInput): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      where,
    });

    if (!user) {
      this.logger.error(`User not found: ${JSON.stringify(where)}`);
      throw new NotFoundException();
    }

    return this.prisma.user.delete({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      where,
    });
  }
}
