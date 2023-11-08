import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UserModule } from '../src/user/user.module';
import { UserService } from '../src/user/user.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  const userService = {
    create: () => user,
    findAll: () => [user],
    findOne: () => user,
    update: () => user,
    remove: () => user,
  };

  const user = {
    id: 1,
    username: 'Alice',
    email: 'alice@prisma.io',
    role: 'USER',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
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
        email: 'chjee@naver.com',
        username: 'Andrew',
        password: '123456',
        role: 'ADMIN',
      })
      .expect(HttpStatus.CREATED)
      .expect(userService.create());
  });

  it('/GET users', () => {
    return request(app.getHttpServer())
      .get('/user?skip=0&take=3')
      .expect(HttpStatus.OK)
      .expect(userService.findAll());
  });

  it('/GET user', () => {
    return request(app.getHttpServer())
      .get('/user/1')
      .expect(HttpStatus.OK)
      .expect(userService.findOne());
  });

  it('/PATCH user', () => {
    return request(app.getHttpServer())
      .patch('/user/3')
      .send({ name: 'andrew', role: 'USER' })
      .expect(HttpStatus.OK)
      .expect(userService.update());
  });

  it('/DELETE user', () => {
    return request(app.getHttpServer())
      .delete('/user/1')
      .expect(HttpStatus.OK)
      .expect(userService.remove());
  });

  afterAll(async () => {
    await app.close();
  });
});
