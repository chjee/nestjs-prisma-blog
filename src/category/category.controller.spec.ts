import { Test, TestingModule } from '@nestjs/testing';
import { Category } from '../generated/prisma/client';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const category: Category = {
  id: 1,
  name: 'Backend',
  createdAt: new Date('2026-04-12T00:00:00.000Z'),
  updatedAt: new Date('2026-04-12T00:00:00.000Z'),
};
const categories: Category[] = [category];
const createCategoryDto: CreateCategoryDto = { name: 'Backend' };
const updateCategoryDto: UpdateCategoryDto = { name: 'Data' };

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: service,
        },
      ],
    }).compile();

    controller = moduleRef.get<CategoryController>(CategoryController);
  });

  it('creates a category', async () => {
    jest.spyOn(service, 'create').mockResolvedValue(category);

    await expect(controller.create(createCategoryDto)).resolves.toBe(category);
  });

  it('returns all categories', async () => {
    jest.spyOn(service, 'findAll').mockResolvedValue(categories);

    await expect(controller.findAll(0, 20)).resolves.toBe(categories);
  });

  it('returns one category', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(category);

    await expect(controller.findOne(1)).resolves.toBe(category);
  });

  it('updates a category', async () => {
    jest
      .spyOn(service, 'update')
      .mockResolvedValue({ ...category, ...updateCategoryDto });

    await expect(controller.update(1, updateCategoryDto)).resolves.toEqual({
      ...category,
      ...updateCategoryDto,
    });
  });

  it('removes a category', async () => {
    jest.spyOn(service, 'remove').mockResolvedValue(category);

    await expect(controller.remove(1)).resolves.toBe(category);
  });
});
