<h1 align="center">Welcome to nestjs-prisma-blog 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.17.1-blue.svg" />
  <img src="https://img.shields.io/badge/npm-%3E%3D9.6.7-blue.svg" />
  <a href="#" target="_blank">
    <img alt="License: UNLICENSED" src="https://img.shields.io/badge/License-UNLICENSED-yellow.svg" />
  </a>
</p>

> NestJS, Prisma, MySQL, Typescript, Jest, Swagger를 이용한 BLOG API

## Prerequisites

- node >=18.17.1
- npm >=9.6.7

## Install

```sh
$ npm install
```

## Usage

```sh
# development mode
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```sh
# unit tests
$ npm run test

# unit tests watch mode
$ npm run test:watch

# unit tests with coverage
$ npm run test:cov

# e2e tests
$ npm run test:e2e
```

## Other commands

```sh
# generate prisma client
$ npx prisma generate

# database migration
$ npx prisma db seed --preview-feature

# run migration
$ npx prisma migrate dev -name init

# revert migration
$ npx run migrate reset
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
