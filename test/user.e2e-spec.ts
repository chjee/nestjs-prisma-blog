import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UserModule } from '../src/user/user.module';
import { UserService } from '../src/user/user.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  const userService = {
    create: jest.fn(() => mockUser),
    findAll: jest.fn(() => [mockUser, mockUser]),
    findOne: jest.fn(() => mockUser),
    assertOwnerOrAdmin: jest.fn(() => undefined),
    update: jest.fn(() => mockUser),
    remove: jest.fn(() => mockUser),
  };

  const mockUser = {
    id: 1,
    name: 'Alice',
    email: 'alice@prisma.io',
    role: 'USER',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .compile();

    app = moduleRef.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { sub: 1, role: 'USER' };
      next();
    });
    await app.init();
  });

  it('/POST user', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({
        email: 'andrew@prisma.io',
        name: 'Andrew',
        password: 'whoami',
        role: 'ADMIN',
      })
      .expect(HttpStatus.CREATED)
      .expect(userService.create());
  });

  it('/GET users', () => {
    return request(app.getHttpServer())
      .get('/user')
      .query({ skip: 0, take: 3 })
      .expect(HttpStatus.OK)
      .expect(userService.findAll());
  });

  it('/GET users without pagination params', () => {
    return request(app.getHttpServer())
      .get('/user')
      .expect(HttpStatus.OK)
      .expect(userService.findAll());
  });

  it('/GET user', () => {
    return request(app.getHttpServer())
      .get(`/user/${mockUser.id}`)
      .expect(HttpStatus.OK)
      .expect(userService.findOne());
  });

  it('/PATCH user strips role changes for non-admins', async () => {
    await request(app.getHttpServer())
      .patch(`/user/${mockUser.id}`)
      .send({ name: 'andrew', role: 'ADMIN' })
      .expect(HttpStatus.OK)
      .expect(userService.update());

    expect(userService.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { name: 'andrew' },
    });
  });

  it('/DELETE user', () => {
    return request(app.getHttpServer())
      .delete(`/user/${mockUser.id}`)
      .expect(HttpStatus.OK)
      .expect(userService.remove());
  });

  afterAll(async () => {
    await app.close();
  });
});
