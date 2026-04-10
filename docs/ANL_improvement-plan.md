# 개선사항 도출 보고서

> 작성일: 2026-04-10  
> 대상 브랜치: develop  
> 기술 스택: NestJS 10 / Prisma 5.7 / MySQL / TypeScript 5.3  
> 코드 리뷰 반영: 2026-04-10

---

## 브랜치 전략

개선 항목들의 성격상 하나의 큰 브랜치보다 목적별로 나누어 작업합니다.

```
develop
├── fix/auth-critical          ← 1, 2, 3번 (인증 기초 결함 묶음)
├── fix/security-hardening     ← 4, 5번 (CORS + Helmet + Throttler)
├── fix/post-pagination-pipe   ← 6번 (skip/take DefaultValuePipe)
├── chore/typescript-strict    ← 7번 (strict 하위 옵션 — 별도 검토 필요)
└── chore/dev-environment      ← 9번 (Docker Compose, Husky)
```

**브랜치 분리 이유:**

- **1~3번은 반드시 묶습니다.** 비밀번호 해시, JWT secret, DTO 필드명은 모두 인증 플로우를 건드리고, 따로 배포하면 로그인이 중간에 깨질 수 있습니다. 하나의 PR로 리뷰하고 한 번에 머지합니다.
- **4~5번은 독립적**이라 별도 브랜치로 가장 빠르게 머지할 수 있습니다.
- **6번은 1줄 수정**이라 단독 브랜치가 맞습니다.
- **7번(strict 전환)은 별도 검토**가 필요합니다. 기존 코드에서 타입 오류가 터질 수 있어 리뷰 시간이 따로 필요합니다.

**작업 순서:**

```bash
# 1순위 — 인증 결함 수정
git checkout develop
git checkout -b fix/auth-critical

# 머지 완료 후
git checkout develop
git checkout -b fix/security-hardening
```

`fix/auth-critical`을 먼저 끝내고 `develop`에 머지한 뒤 나머지를 진행합니다.  
현재 상태에서 다른 기능 작업보다 인증 결함이 프로덕션 리스크이기 때문입니다.

---

## 우선순위 요약

| 순위 | 영역 | 항목 | 난이도 |
|---|---|---|---|
| 1 | **인증 - Critical** | 비밀번호 평문 저장/비교 제거 + bcrypt 적용 | 낮음 |
| 2 | **인증 - Critical** | JWT secret 템플릿 리터럴 버그 수정 | 낮음 |
| 3 | **인증 - High** | 로그인 DTO 필드명 + LocalStrategy 정합성 | 낮음 |
| 4 | **보안 - High** | CORS 오리진 제한 + 환경변수 Joi 검증 | 낮음 |
| 5 | **보안 - High** | Helmet + Rate Limiting 추가 | 낮음 |
| 6 | **API - Medium** | `/post` skip/take 필수 파라미터 방어 처리 | 낮음 |
| 7 | **코드 품질 - Medium** | TypeScript strict 하위 옵션 재활성화 | 높음 |
| 8 | **운영 - Medium** | 로깅 전략 개선 (Winston) | 중간 |
| 9 | **개발 환경 - Medium** | Docker Compose + Husky/lint-staged | 낮음 |
| 10 | **데이터 모델 - Low** | Post content 필드, 인덱스 추가 | 낮음 |
| 11 | **패키지 - Low** | NestJS 11 / Prisma 6 메이저 업그레이드 | 높음 |

---

## 상세 개선사항

---

### 1. [Critical] 비밀번호 평문 저장 및 비교

**파일:** `src/auth/auth.service.ts:17`, `src/user/user.service.ts:11`

```ts
// auth.service.ts — 현재: 평문 직접 비교
if (user && user.password === password) { ... }

// user.service.ts — 현재: 해시 없이 그대로 저장
async create(data: Prisma.UserCreateInput): Promise<User> {
  return this.prisma.user.create({ data });
}
```

비밀번호가 DB에 평문으로 저장되고, 로그인 시에도 평문 비교를 합니다. DB 유출 시 전체 사용자 비밀번호가 즉시 노출됩니다.

**수정:**
```bash
npm install bcrypt
npm install -D @types/bcrypt
```

```ts
// user.service.ts — create() 수정
// 전제: 현재 create()의 data.password는 클라이언트가 넘긴 평문 문자열입니다.
// Prisma.UserCreateInput의 password 타입은 string이므로 아래 예시는 유효합니다.
// 단, 추후 입력 구조가 바뀌면 DTO에서 해싱하는 방식으로 전환하세요.
import * as bcrypt from 'bcrypt';

async create(data: Prisma.UserCreateInput): Promise<User> {
  const hashed = await bcrypt.hash(data.password as string, 10);
  return this.prisma.user.create({ data: { ...data, password: hashed } });
}

// auth.service.ts — validateUser() 수정
if (user && await bcrypt.compare(password, user.password)) { ... }
```

> Prisma schema의 `password: String @db.VarChar(60)`은 bcrypt 해시 길이(60자)에 맞게 설계되어 있어 스키마 변경은 불필요합니다.

---

### 2. [Critical] JWT Secret 템플릿 리터럴 버그

**파일:** `src/common/constants/jwt.constants.ts:2`

```ts
// 현재: 닫는 중괄호가 하나 더 붙어 있음
secret: `${process.env.JWT_SECRET}}`,
//                               ^ 여분의 }
```

결과적으로 secret 값이 `"실제값}"` 이 됩니다. 앱 전체가 이 잘못된 값을 일관되게 사용하고 있으므로 로그인 자체는 동작할 수 있습니다. 문제는 **의도한 JWT_SECRET 값과 다른 secret이 사용된다**는 점이며, 이로 인해 외부에서 올바른 JWT_SECRET을 알아도 토큰 위변조 검증이 의도대로 동작하지 않습니다.

**수정:**
```ts
export const jwtConstants = {
  secret: process.env.JWT_SECRET,
};
```

---

### 3. [High] 로그인 DTO 필드명과 LocalStrategy 불일치

**파일:** `src/user/dto/signin-user.dto.ts:14`, `src/common/guards/local.strategy.ts:8`

```ts
// signin-user.dto.ts — 이메일 값을 username 필드명으로 받음
readonly username!: string;

// local.strategy.ts — usernameField 옵션 없이 passport-local 기본값 사용
constructor(private authService: AuthService) {
  super();  // 기본: 첫 번째 필드 = username
}

async validate(email: string, password: string): Promise<any> {
  // 파라미터명은 email이지만 실제로 username 필드 값이 들어옴
}
```

passport-local 기본값이 `username` 필드를 읽어 `validate()`의 첫 번째 인자로 넘기기 때문에 현재는 우연히 동작합니다. API 문서 기준 필드명이 `username`으로 노출되어 클라이언트가 혼란스럽습니다.

**권장 수정 — DTO 필드명을 `email`로 변경하고 strategy에서 `usernameField` 지정:**
```ts
// local.strategy.ts
super({ usernameField: 'email' });

// signin-user.dto.ts
readonly email!: string;
```

---

### 4. [High] CORS 전체 허용

**파일:** `src/main.ts:11`

```ts
// 현재
cors: { origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' },
```

**수정:**
```ts
// NestFactory 옵션에서 제거하고 별도 설정
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
});
```

`.env`에 `ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com` 추가.

---

### 5. [High] Helmet + Rate Limiting 미적용

**Helmet** — HTTP 보안 헤더 미설정:
```bash
npm install helmet
```
```ts
// main.ts
import helmet from 'helmet';
app.use(helmet());
```

**Rate Limiting** — 로그인 Brute-force 방어 없음:
```bash
npm install @nestjs/throttler
```
```ts
// app.module.ts
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])

// auth.controller.ts (로그인 엔드포인트)
@UseGuards(ThrottlerGuard)
```

---

### 6. [Medium] `/post` 목록 skip/take 필수 파라미터 문제

**파일:** `src/post/post.controller.ts:94`

```ts
// 현재: ParseIntPipe로 필수 처리 — 쿼리 없이 호출 시 400 에러
async findAll(
  @Query('skip', ParseIntPipe) skip: number,
  @Query('take', ParseIntPipe) take: number,
)
```

`GET /post` 호출 시 `?skip=0&take=10`을 반드시 넘겨야 합니다. 클라이언트가 생략하면 `400 Bad Request`가 납니다.

**수정 — DefaultValuePipe + ParseIntPipe 조합:**
```ts
import { DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common';

async findAll(
  @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
  @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
)
```

`@Query('skip') skip = 0` 처럼 기본값만 주면 쿼리 문자열이 숫자로 변환되지 않아 타입 불일치가 발생할 수 있습니다.  
`DefaultValuePipe`로 파라미터 누락을 처리하고 `ParseIntPipe`로 형변환을 명시적으로 적용하는 것이 올바른 NestJS 패턴입니다.  
또는 `class-validator` 기반 쿼리 DTO로 전환하는 방법도 있습니다.

---

### 7. [Medium] TypeScript strict 하위 옵션 비활성화

**파일:** `tsconfig.json`

```json
// 현재: strict: true 선언 후 핵심 하위 옵션 재비활성화 — 일관성이 깨짐
"strict": true,
"strictNullChecks": false,
"noImplicitAny": false,
"strictBindCallApply": false
```

`strict: true`가 선언되어 있으나 핵심 하위 옵션들이 개별적으로 꺼져 있어 strict의 이점이 반감됩니다. "strict가 꺼져 있다"가 아니라 "strict를 선언했지만 핵심 하위 옵션이 비활성화돼 일관성이 깨져 있다"가 정확한 표현입니다.

**권장 전환 순서:**
1. `strictNullChecks: true` — null/undefined 관련 런타임 오류 사전 차단
2. `noImplicitAny: true` — 타입 명시 강제
3. `strictBindCallApply: true`

한 번에 전환이 어렵다면 파일 상단에 `// @ts-strict-ignore` 주석으로 파일 단위 점진적 적용.

---

### 8. [Medium] 로깅 전략 개선

현재 NestJS 기본 Logger + 커스텀 미들웨어 조합. 운영 환경에서는 구조화된 로그가 필요합니다.

**권장:**
```bash
npm install nest-winston winston winston-daily-rotate-file
```

개선 포인트:
- 로그 레벨 환경별 분리 (`dev: debug`, `prod: warn`)
- 로그 파일 로테이션 (일별, 최대 30일 보관)
- 요청 ID 트레이싱 (`AsyncLocalStorage` 활용)
- 민감 정보(비밀번호, 토큰) 로그 마스킹

---

### 9. [Medium] 개발 환경 개선

**Docker Compose 없음** — 로컬 MySQL 설정이 개발자 각자에게 맡겨져 있습니다:
```yaml
# docker-compose.yml
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: blog
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
volumes:
  mysql_data:
```

**환경변수 Joi 검증** — 현재 누락된 env 값을 런타임까지 감지 못함:
```bash
npm install joi
```
```ts
ConfigModule.forRoot({
  validationSchema: Joi.object({
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
  }),
})
```

**Husky + lint-staged** — 커밋 전 자동 린트/포맷 검사 없음:
```bash
npm install -D husky lint-staged
npx husky init
```

---

### 10. [Low] 데이터 모델 개선

**Post content 필드 없음** — 블로그 포스트에 본문이 없습니다:
```prisma
model Post {
  content   String?  @db.Text
}
```

**인덱스 추가** — 조회 성능:
```prisma
model Post {
  @@index([userId])
  @@index([published, createdAt])
}
```

**Soft Delete** — 현재 규모에서 즉각 필요하지 않으나, 향후 데이터 복구 요건 발생 시 `deletedAt DateTime?` 컬럼 추가로 대응.

---

### 11. [Low] 패키지 메이저 업그레이드

| 패키지 | 현재 | 최신 | 비고 |
|---|---|---|---|
| `@nestjs/*` | ^10.x | ^11.x | Breaking changes 있음 |
| `prisma` | ^5.7.1 | ^6.x | TypedSQL 지원 |
| `typescript` | ^5.3.3 | ^5.8.x | |
| `eslint` | ^8.56.0 | ^9.x | Flat config 체계 전환 |

메이저 업그레이드는 별도 브랜치에서 진행, 마이너 업그레이드는 즉시 적용 권장.

---

## Refresh Token 관련

현재 access token 만료가 10분으로 설정되어 있고(`src/auth/auth.module.ts`) refresh token은 미구현 상태입니다.  
**1번(비밀번호 해시)과 2번(JWT secret 버그)를 먼저 해결한 후** 구현하는 것이 맞는 순서입니다.

구현 시:
- Access Token: 15분
- Refresh Token: 7일, DB 저장 후 검증
- `/auth/refresh` 엔드포인트 추가
