import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Post, Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}
  async create(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({ data });
  }

  findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      // include: {
      //   user: true,
      //   categories: true,
      // },
    });
  }

  findOne(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.findUnique({
      include: {
        user: true,
        categories: true,
      },
      where,
    });
  }

  update(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    const { where, data } = params;
    return this.prisma.post.update({
      data,
      where,
    });
  }

  remove(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}
