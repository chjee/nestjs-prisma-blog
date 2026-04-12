import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  createPrismaAdapter,
  createPrismaMariaDbConfig,
} from './prisma.adapter';

jest.mock('@prisma/adapter-mariadb', () => ({
  PrismaMariaDb: jest.fn().mockImplementation((config) => ({ config })),
}));

describe('prisma.adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a MariaDB adapter config from a mysql URL', () => {
    expect(
      createPrismaMariaDbConfig(
        'mysql://blog-user:s3cret@localhost:3307/blog_db',
      ),
    ).toEqual({
      host: 'localhost',
      port: 3307,
      user: 'blog-user',
      password: 's3cret',
      database: 'blog_db',
      allowPublicKeyRetrieval: true,
    });
  });

  it('lets DATABASE_URL disable public-key retrieval explicitly', () => {
    expect(
      createPrismaMariaDbConfig(
        'mysql://blog-user:s3cret@localhost:3306/blog_db?allowPublicKeyRetrieval=false',
      ),
    ).toEqual({
      host: 'localhost',
      port: 3306,
      user: 'blog-user',
      password: 's3cret',
      database: 'blog_db',
      allowPublicKeyRetrieval: false,
    });
  });

  it('constructs PrismaMariaDb with the parsed config', () => {
    createPrismaAdapter('mysql://blog-user:s3cret@localhost:3306/blog_db');

    expect(PrismaMariaDb).toHaveBeenCalledWith({
      host: 'localhost',
      port: 3306,
      user: 'blog-user',
      password: 's3cret',
      database: 'blog_db',
      allowPublicKeyRetrieval: true,
    });
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => createPrismaAdapter(undefined)).toThrow(
      'DATABASE_URL is not set',
    );
  });
});
