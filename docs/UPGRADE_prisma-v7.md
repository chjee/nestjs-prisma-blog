# UPGRADE: Prisma 6 → 7 마이그레이션

> 작성일: 2026-04-11
> 대상 브랜치: chore/upgrade-prisma-v7
> 현재 버전: 6.19.3 → 목표 버전: 7.x (최신)

---

## 개요

Prisma 7은 내부 Rust 엔진을 제거하고 TypeScript 기반으로 전환한 메이저 버전입니다.
성능이 크게 개선되었지만 Breaking Change가 다수 포함되어 있습니다.

**주요 성능 개선:**

| 항목                  | 개선 수치                  |
| --------------------- | -------------------------- |
| 대용량 쿼리 (수천 행) | 최대 3배 빠름              |
| 쿼리 컴파일 오버헤드  | 약 100배 개선 (1ms → 10µs) |
| 번들 크기             | 14MB → 1.6MB (90% 감소)    |
| 서버리스 콜드 스타트  | 9배 개선                   |
| TypeScript 타입 체크  | 70% 빠름                   |

---

## Breaking Changes

### 1. `schema.prisma` — generator 변경

```diff
generator client {
-  provider = "prisma-client-js"
+  provider = "prisma-client"
+  output   = "../generated/prisma"
}
```

### 2. Driver Adapter 필수 도입

MySQL 연결 시 `@prisma/adapter-mysql2` 설치 및 `PrismaClient` 초기화 방식 변경 필요.

```typescript
// 기존 (v6)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 변경 후 (v7)
import { PrismaClient } from '../generated/prisma';
import { PrismaMysql } from '@prisma/adapter-mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL });
const adapter = new PrismaMysql(pool);
const prisma = new PrismaClient({ adapter });
```

### 3. import 경로 변경

```diff
- import { PrismaClient } from '@prisma/client';
- import { User, Post, Role } from '@prisma/client';
+ import { PrismaClient } from '../generated/prisma';
+ import { User, Post, Role } from '../generated/prisma';
```

### 4. `prisma migrate dev` 자동 generate 제거

마이그레이션 후 클라이언트 재생성을 별도로 실행해야 합니다.

```bash
npx prisma migrate dev
npx prisma generate   # 별도 실행 필요
```

### 5. dotenv 자동 로드 제거

`DATABASE_URL` 등 환경변수를 앱 진입점에서 명시적으로 로드해야 합니다.

```typescript
// main.ts 상단
import 'dotenv/config';
```

> NestJS + `@nestjs/config`를 사용하는 경우 AppModule에서 ConfigModule이 먼저 로드되면 별도 처리 불필요.

---

## 작업 순서

1. 패키지 업그레이드
2. `prisma/schema.prisma` generator 수정
3. `prisma generate` 실행 → `generated/prisma/` 생성 확인
4. Driver Adapter 패키지 설치 (`@prisma/adapter-mysql2`, `mysql2`)
5. `src/prisma/prisma.service.ts` — Driver Adapter 적용
6. 전체 import 경로 변경 (`@prisma/client` → `generated/prisma`)
7. `tsconfig.json` paths 설정 (선택)
8. 빌드 및 테스트 검증

---

## 변경 대상 파일 목록

| 파일                                     | 변경 내용                       |
| ---------------------------------------- | ------------------------------- |
| `prisma/schema.prisma`                   | generator provider, output 변경 |
| `src/prisma/prisma.service.ts`           | Driver Adapter 적용             |
| `src/common/guards/local.strategy.ts`    | import 경로 변경                |
| `src/common/guards/jwt.strategy.ts`      | import 경로 변경                |
| `src/auth/auth.service.ts`               | import 경로 변경                |
| `src/user/user.service.ts`               | import 경로 변경                |
| `src/post/post.service.ts`               | import 경로 변경                |
| `src/category/category.service.ts`       | import 경로 변경                |
| `src/profile/profile.service.ts`         | import 경로 변경                |
| `src/common/constants/jest.constants.ts` | import 경로 변경                |
| `.gitignore`                             | `generated/` 추가               |

---

## 검증 방법

```bash
# 빌드
npm run build

# 단위 테스트
npm test

# e2e 테스트
npm run test:e2e
```

---

## 참고

- [Prisma 7 공식 업그레이드 가이드](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Prisma 7 릴리즈 블로그](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0)
- v7.4 이후 쿼리 캐싱이 추가되어 소규모 쿼리 성능 회귀 문제 해결됨
