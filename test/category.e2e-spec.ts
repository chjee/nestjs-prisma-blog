import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CategoryModule } from '../src/category/category.module';
import { CategoryService } from '../src/category/category.service';

const category = { id: 1, name: 'Backend' };

describe('CategoryController (e2e)', () => {
  let app: INestApplication;
  const categoryService = {
    create: () => category,
    findAll: () => [category],
    findOne: () => category,
    update: () => ({ ...category, name: 'Data' }),
    remove: () => category,
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CategoryModule],
    })
      .overrideProvider(CategoryService)
      .useValue(categoryService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/POST category', () => {
    return request(app.getHttpServer())
      .post('/category')
      .send({ name: 'Backend' })
      .expect(HttpStatus.CREATED)
      .expect(categoryService.create());
  });

  it('/GET category', () => {
    return request(app.getHttpServer())
      .get('/category')
      .query({ skip: 0, take: 20 })
      .expect(HttpStatus.OK)
      .expect(categoryService.findAll());
  });

  it('/GET category/:id', () => {
    return request(app.getHttpServer())
      .get('/category/1')
      .expect(HttpStatus.OK)
      .expect(categoryService.findOne());
  });

  it('/PATCH category/:id', () => {
    return request(app.getHttpServer())
      .patch('/category/1')
      .send({ name: 'Data' })
      .expect(HttpStatus.OK)
      .expect(categoryService.update());
  });

  it('/DELETE category/:id', () => {
    return request(app.getHttpServer())
      .delete('/category/1')
      .expect(HttpStatus.OK)
      .expect(categoryService.remove());
  });

  afterAll(async () => {
    await app.close();
  });
});
