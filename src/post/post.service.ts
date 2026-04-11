import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Post, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(PostService.name);

  async create(dto: CreatePostDto): Promise<Post> {
    const { categoryIds, ...rest } = dto;
    return this.prisma.post.create({
      data: {
        ...rest,
        ...(categoryIds?.length && {
          categories: { connect: categoryIds.map((id) => ({ id })) },
        }),
      },
    });
  }

  async findAll(params: {
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
      include: {
        user: { select: { name: true, email: true, role: true } },
        categories: { select: { name: true } },
      },
    });
  }

  async count(where?: Prisma.PostWhereInput): Promise<number> {
    return this.prisma.post.count({ where });
  }

  async findOne(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      include: {
        user: { select: { name: true, email: true, role: true } },
        categories: { select: { name: true } },
      },
      where,
    });

    if (!post) {
      this.logger.error(`Post not found: ${JSON.stringify(where)}`);
      throw new NotFoundException();
    }

    return post;
  }

  async assertOwnerOrAdmin(
    postId: number,
    requesterId: number,
    requesterRole: Role,
  ): Promise<void> {
    if (requesterRole === 'ADMIN') {
      return;
    }

    const post = await this.prisma.post.findUnique({
      select: { userId: true },
      where: { id: postId },
    });

    if (!post) {
      this.logger.error(`Post not found: ${JSON.stringify({ id: postId })}`);
      throw new NotFoundException();
    }

    if (post.userId !== requesterId) {
      throw new ForbiddenException('You can only manage your own posts.');
    }
  }

  async update(params: {
    where: Prisma.PostWhereUniqueInput;
    data: UpdatePostDto;
  }): Promise<Post> {
    const { where, data } = params;
    const post = await this.prisma.post.findUnique({ where });

    if (!post) {
      this.logger.error(`Post not found: ${JSON.stringify(where)}`);
      throw new NotFoundException();
    }

    const { categoryIds, ...rest } = data;
    return this.prisma.post.update({
      data: {
        ...rest,
        ...(categoryIds !== undefined && {
          categories: { set: categoryIds.map((id) => ({ id })) },
        }),
      },
      where,
    });
  }

  async remove(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    const post = await this.prisma.post.findUnique({ where });

    if (!post) {
      this.logger.error(`Post not found: ${JSON.stringify(where)}`);
      throw new NotFoundException();
    }

    return this.prisma.post.delete({
      where,
    });
  }
}
