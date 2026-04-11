<h1 align="center">Welcome to nestjs-prisma-blog 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.17.1-blue.svg" />
  <img src="https://img.shields.io/badge/pnpm-%3E%3D10.0.0-blue.svg" />
  <a href="#" target="_blank">
    <img alt="License: UNLICENSED" src="https://img.shields.io/badge/License-UNLICENSED-yellow.svg" />
  </a>
</p>

> NestJS, Prisma, MySQL, Typescript, Jest, Swagger를 이용한 BLOG API

## Prerequisites

- node >=20.0.0
- pnpm >=10.0.0

## Install

```sh
$ pnpm install
```

## Usage

```sh
# development mode
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```sh
# unit tests
$ pnpm test

# unit tests watch mode
$ pnpm run test:watch

# unit tests with coverage
$ pnpm run test:cov

# e2e tests
$ pnpm run test:e2e
```

## Other commands

```sh
# generate prisma client
$ pnpm prisma generate

# database migration
$ pnpm prisma db seed --preview-feature

# run migration
$ pnpm prisma migrate dev -name init

# revert migration
$ pnpm prisma migrate reset
```

## .env file

```sh
# .env
PORT=3000
DATABASE_URL="mysql://username:password@localhost:3306/blog?schema=public"
JWT_SECRET=MDBjMWJlMzc4M2JhNGExY2FmNTRkZmU0NjlhNTRjYmY=
```

## Author

👤 **Changhoon Jee <chjee71@gmail.com>**

- Github: [@chjee](https://github.com/chjee)

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
