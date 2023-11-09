import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UserModule } from '../src/user/user.module';
import { UserService } from '../src/user/user.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  const userService = {
    create: () => mockUser,
    findAll: () => [mockUser, mockUser],
    findOne: () => mockUser,
    update: () => mockUser,
    remove: () => mockUser,
  };

  const mockUser = {
    id: 1,
    username: 'Alice',
    email: 'alice@prisma.io',
    role: 'USER',
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/POST user', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({
        email: 'andrew@prisma.io',
        username: 'Andrew',
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

  it('/GET user', () => {
    return request(app.getHttpServer())
      .get(`/user/${mockUser.id}`)
      .expect(HttpStatus.OK)
      .expect(userService.findOne());
  });

  it('/PATCH user', () => {
    return request(app.getHttpServer())
      .patch(`/user/${mockUser.id}`)
      .send({ name: 'andrew', role: 'USER' })
      .expect(HttpStatus.OK)
      .expect(userService.update());
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
