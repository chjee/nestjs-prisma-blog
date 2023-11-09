import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/jwt-auth.guard';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const mockUser = {
    id: 1,
    username: 'Alice',
    password: 'whoami',
    email: 'alice@prisma.io',
    role: 'USER',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.enableShutdownHooks();
    await app.init();
  });

  describe('/auth/login', () => {
    it('POST 200', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: mockUser.username, password: mockUser.password })
        .expect(HttpStatus.OK);
    });
  });

  describe('/user', () => {
    it('POST 201', () => {
      return request(app.getHttpServer())
        .post('/user')
        .send({
          email: 'andrew@prisma.io',
          username: 'Andrew',
          password: 'whoami',
          role: 'ADMIN',
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          mockUser.id = res.body.id;
          console.log(mockUser);
        });
    });

    it('GET', () => {
      return request(app.getHttpServer())
        .get('/user')
        .query({ skip: 0, take: 3 })
        .expect(HttpStatus.OK);
    });

    it('GET', () => {
      return request(app.getHttpServer())
        .get(`/user/${mockUser.id}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          console.log(res.body);
        });
    });

    it('PATCH', () => {
      return request(app.getHttpServer())
        .patch(`/user/${mockUser.id}`)
        .send({ username: 'andrew', role: 'USER' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          console.log(res.body);
        });
    });

    it('DELETE', () => {
      return request(app.getHttpServer())
        .delete(`/user/${mockUser.id}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          console.log(res.body);
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
