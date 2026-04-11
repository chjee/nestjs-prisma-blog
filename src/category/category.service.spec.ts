import { NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CategoryService } from './category.service';
import { PrismaService as AppPrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type MockPrismaCategoryDelegate = {
  create: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

const category: Category = { id: 1, name: 'Backend' };
const categories: Category[] = [category];
const createCategoryDto: CreateCategoryDto = { name: 'Backend' };
const updateCategoryDto: UpdateCategoryDto = { name: 'Data' };

describe('CategoryService', () => {
  let prisma: AppPrismaService & { category: MockPrismaCategoryDelegate };
  let service: CategoryService;

  beforeEach(() => {
    prisma = {
      category: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as AppPrismaService & { category: MockPrismaCategoryDelegate };

    service = new CategoryService(prisma);
  });

  it('creates a category through Prisma', async () => {
    prisma.category.create.mockResolvedValue(category);

    await expect(service.create(createCategoryDto)).resolves.toBe(category);
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: createCategoryDto,
    });
  });

  it('returns all categories', async () => {
    prisma.category.findMany.mockResolvedValue(categories);

    await expect(service.findAll({ skip: 0, take: 20 })).resolves.toBe(
      categories,
    );
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      cursor: undefined,
      where: undefined,
      orderBy: undefined,
    });
  });

  it('returns one category', async () => {
    prisma.category.findUnique.mockResolvedValue(category);

    await expect(service.findOne({ id: 1 })).resolves.toBe(category);
  });

  it('throws when a category is missing', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(service.findOne({ id: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a category', async () => {
    prisma.category.findUnique.mockResolvedValue(category);
    prisma.category.update.mockResolvedValue({
      ...category,
      ...updateCategoryDto,
    });

    await expect(
      service.update({ where: { id: 1 }, data: updateCategoryDto }),
    ).resolves.toEqual({
      ...category,
      ...updateCategoryDto,
    });
  });

  it('removes a category', async () => {
    prisma.category.findUnique.mockResolvedValue(category);
    prisma.category.delete.mockResolvedValue(category);

    await expect(service.remove({ id: 1 })).resolves.toBe(category);
  });
});
