import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request, { type Response as SupertestResponse } from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let aliceId: number;

  const mockUser = {
    id: 1,
    name: 'Alice',
    password: 'whoami',
    email: 'alice@prisma.io',
    role: 'USER',
  };

  const mockPost = {
    id: 1,
    title: 'Check out Prisma with Nest.js',
    content: 'Prisma and Nest.js work well together.',
    published: false,
    createdAt: '2023-11-05T13:09:13.135Z',
    updatedAt: '2023-11-05T13:09:13.135Z',
    userId: 1,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request.user = { sub: aliceId, name: 'Alice', role: 'ADMIN' };
          return true;
        },
      })
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

    const res = await request(app.getHttpServer()).post('/user').send({
      email: mockUser.email,
      name: mockUser.name,
      password: mockUser.password,
      role: mockUser.role,
    });
    aliceId = res.body.id;
  });

  describe('/auth/login', () => {
    it('POST 200', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: mockUser.password })
        .expect(HttpStatus.OK);
    });
  });

  describe('/user', () => {
    it('POST 201', () => {
      return request(app.getHttpServer())
        .post('/user')
        .send({
          email: 'andrew@prisma.io',
          name: 'Andrew',
          password: 'whoami',
          role: 'ADMIN',
        })
        .expect(HttpStatus.CREATED)
        .expect((res: SupertestResponse) => {
          mockUser.id = res.body.id;
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
        .expect(HttpStatus.OK);
    });

    it('PATCH', () => {
      return request(app.getHttpServer())
        .patch(`/user/${mockUser.id}`)
        .send({ name: 'andrew', role: 'USER' })
        .expect(HttpStatus.OK);
    });

    it('DELETE', () => {
      return request(app.getHttpServer())
        .delete(`/user/${mockUser.id}`)
        .expect(HttpStatus.OK);
    });
  });

  describe('/post', () => {
    it('POST 201', () => {
      return request(app.getHttpServer())
        .post('/post')
        .send({
          title: 'Just 5 minutes.',
          content: 'A short body for the blog post.',
          published: false,
          userId: aliceId,
        })
        .expect(HttpStatus.CREATED)
        .expect((res: SupertestResponse) => {
          mockPost.id = res.body.id;
        });
    });

    it('GET', () => {
      return request(app.getHttpServer())
        .get('/post')
        .query({ skip: 0, take: 3 })
        .expect(HttpStatus.OK);
    });

    it('GET', () => {
      return request(app.getHttpServer())
        .get(`/post/${mockPost.id}`)
        .expect(HttpStatus.OK);
    });

    it('PATCH', () => {
      return request(app.getHttpServer())
        .patch(`/post/${mockPost.id}`)
        .send({
          title: 'Just 10 minutes.',
          content: 'Updated body',
          published: true,
        })
        .expect(HttpStatus.OK);
    });

    it('DELETE', () => {
      return request(app.getHttpServer())
        .delete(`/post/${mockPost.id}`)
        .expect(HttpStatus.OK);
    });
  });

  afterAll(async () => {
    if (aliceId) {
      await request(app.getHttpServer()).delete(`/user/${aliceId}`);
    }
    await app.close();
  });
});
