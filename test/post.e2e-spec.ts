import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { PostModule } from '../src/post/post.module';
import { PostService } from '../src/post/post.service';

describe('PostController (e2e)', () => {
  let app: INestApplication;
  const postService = {
    create: () => mockPost,
    findAll: () => [mockPost, mockPost],
    findOne: () => mockPost,
    update: () => mockPost,
    remove: () => mockPost,
  };

  const mockPost = {
    id: 1,
    title: 'Check out Prisma with Nest.js',
    published: false,
    createdAt: '2023-11-05T13:09:13.135Z',
    updatedAt: '2023-11-05T13:09:13.135Z',
    userId: 1,
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [PostModule],
    })
      .overrideProvider(PostService)
      .useValue(postService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/POST post', () => {
    return request(app.getHttpServer())
      .post('/post')
      .send({
        title: 'Just 10 minutes.',
        published: false,
        userId: 1,
      })
      .expect(HttpStatus.CREATED)
      .expect(postService.create());
  });

  it('/GET users', () => {
    return request(app.getHttpServer())
      .get('/post')
      .query({ skip: 0, take: 3 })
      .expect(HttpStatus.OK)
      .expect(postService.findAll());
  });

  it('/GET post', () => {
    return request(app.getHttpServer())
      .get(`/post/${mockPost.id}`)
      .expect(HttpStatus.OK)
      .expect(postService.findOne());
  });

  it('/PATCH post', () => {
    return request(app.getHttpServer())
      .patch(`/post/${mockPost.id}`)
      .send({ name: 'andrew', role: 'USER' })
      .expect(HttpStatus.OK)
      .expect(postService.update());
  });

  it('/DELETE post', () => {
    return request(app.getHttpServer())
      .delete(`/post/${mockPost.id}`)
      .expect(HttpStatus.OK)
      .expect(postService.remove());
  });

  afterAll(async () => {
    await app.close();
  });
});
