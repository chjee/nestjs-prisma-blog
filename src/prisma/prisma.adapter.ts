import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const DEFAULT_MYSQL_PORT = 3306;

type PrismaMariaDbConfig = ConstructorParameters<typeof PrismaMariaDb>[0];

export function createPrismaAdapter(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  return new PrismaMariaDb(createPrismaMariaDbConfig(databaseUrl));
}

export function createPrismaMariaDbConfig(
  databaseUrl: string,
): PrismaMariaDbConfig {
  const parsedUrl = new URL(databaseUrl);

  if (!['mysql:', 'mariadb:'].includes(parsedUrl.protocol)) {
    throw new Error('DATABASE_URL must use a mysql:// or mariadb:// protocol');
  }

  const database = parsedUrl.pathname.replace(/^\//, '');

  if (!database) {
    throw new Error('DATABASE_URL must include a database name');
  }

  return {
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number(parsedUrl.port) : DEFAULT_MYSQL_PORT,
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database,
    allowPublicKeyRetrieval:
      parsedUrl.searchParams.get('allowPublicKeyRetrieval') !== 'false',
  };
}
