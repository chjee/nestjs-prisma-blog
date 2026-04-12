import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(CategoryService.name);

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    try {
      return await this.prisma.category.create({ data });
    } catch (error) {
      this.handleUniqueConstraintError(error, data.name);
      throw error;
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CategoryWhereUniqueInput;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
  }): Promise<Category[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.category.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(where: Prisma.CategoryWhereUniqueInput): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where });

    if (!category) {
      this.logger.error(`Category not found: ${JSON.stringify(where)}`);
      throw new NotFoundException();
    }

    return category;
  }

  async update(params: {
    where: Prisma.CategoryWhereUniqueInput;
    data: Prisma.CategoryUpdateInput;
  }): Promise<Category> {
    const { where, data } = params;
    await this.findOne(where);

    try {
      return await this.prisma.category.update({
        data,
        where,
      });
    } catch (error) {
      this.handleUniqueConstraintError(
        error,
        typeof data.name === 'string' ? data.name : undefined,
      );
      throw error;
    }
  }

  async remove(where: Prisma.CategoryWhereUniqueInput): Promise<Category> {
    await this.findOne(where);

    return this.prisma.category.delete({ where });
  }

  private handleUniqueConstraintError(error: unknown, categoryName?: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        categoryName
          ? `Category "${categoryName}" already exists.`
          : 'Category already exists.',
      );
    }
  }
}
