# Prisma 6 -> 7 업그레이드 실행 런북

> 작성일: 2026-04-11
> 대상 저장소: `nestjs-prisma-blog`
> 시작 브랜치: `develop`
> 작업 브랜치: `chore/upgrade-prisma-v7`
> 현재 버전: `prisma 6.19.3`, `@prisma/client 6.19.3`
> 목표 상태: Prisma ORM 7 + ESM + adapter 기반 PrismaClient 초기화

---

## 목적

이 문서는 설명 메모가 아니라, OMX가 바로 집행할 수 있는 실행 런북이다.
질문 없이 진행 가능한 기본 결정값을 포함하고, 중단해야 하는 조건만 명시한다.

이 업그레이드는 단순 패키지 bump가 아니다.
다음 네 가지를 한 번에 끝내는 작업으로 본다.

1. Prisma Client를 `prisma-client` generator로 전환
2. Driver adapter 기반 연결 방식으로 전환
3. Prisma CLI 설정을 `prisma.config.ts`로 이동
4. 프로젝트를 CommonJS에서 ESM으로 정리

---

## 실행 기본값

별도 반대 근거가 없으면 아래 기본값으로 진행한다.

- Prisma Client output: `src/generated/prisma`
- Prisma generated client는 커밋하지 않음
- Prisma adapter 기본안: `@prisma/adapter-mariadb`
- Prisma seed 실행기 기본안: `tsx`
- Prisma schema datasource URL은 `prisma.config.ts`에서 관리
- 앱 런타임 env 로드는 기존 Nest `ConfigModule` 유지
- Prisma CLI env 로드는 `prisma.config.ts`에서 `import 'dotenv/config'`로 처리
- import 기준 엔트리포인트는 generated client의 `client` 파일 사용

기본값을 바꾸는 조건:

- `@prisma/adapter-mariadb`로 실제 연결이 실패하고 adapter 문제로 판단되는 경우
- ESM 전환 후 Nest build 또는 Jest가 구조적으로 막히는 경우
- 생성물 비커밋 정책 때문에 로컬/CI에서 재현 불가능한 빌드 실패가 나는 경우

---

## 완료 조건

아래를 모두 만족하면 작업 완료로 본다.

- `prisma`와 `@prisma/client`가 `7.x`
- `schema.prisma`가 `prisma-client` generator + explicit `output` 사용
- `prisma.config.ts`가 추가되고 datasource / migrations / seed 설정이 이동됨
- `src/prisma/prisma.service.ts`가 adapter 기반 초기화로 전환됨
- `@prisma/client` 직접 import가 앱/테스트/seed 코드에서 제거됨
- `package.json`이 `"type": "module"`과 Node `>=20.19.0` 기준을 반영함
- seed 실행 경로가 `tsx prisma/seed.ts` 기준으로 정리됨
- ESM 설정 반영 후 `npm run build` 통과
- `npx prisma generate` 통과
- `npm run lint` 통과
- `npm test` 통과
- `npm run test:e2e` 통과

---

## 현재 저장소 기준 전제

- NestJS 11
- TypeScript 5.9.x
- Node engine: 현재 `>=20.0.0`
- `tsconfig.json`은 현재 `module: "commonjs"`
- `package.json` 안에 `prisma.seed` 설정 존재
- `@prisma/client` import가 앱/테스트/seed 여러 파일에 분산

중요 전제:

- Prisma 7 공식 가이드 기준 최소 Node는 `20.19.0+`
- Prisma 7은 ESM-first
- Prisma 7은 driver adapter 필수
- Prisma 7은 `prisma.config.ts` 중심으로 CLI 설정 이동
- Prisma 7은 `prisma generate` / `prisma db seed` 자동 실행 동작 제거

---

## 작업 범위

최소 수정 대상:

- `package.json`
- `tsconfig.json`
- `tsconfig.build.json`
- `test/jest-e2e.json`
- `prisma.config.ts` 신규
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/prisma/prisma.service.ts`
- `src/**/*.ts`, `test/**/*.ts` 중 `@prisma/client` 사용 파일
- `.gitignore`

현재 확인된 `@prisma/client` 사용 파일 수는 약 `23개`다.

---

## Git 시작 절차

이 작업은 반드시 `develop` 최신 상태에서 새 작업 브랜치를 만들어 시작한다.

### 1. 현재 상태 확인

```bash
git status --short
git branch --show-current
```

기대 상태:

- 현재 브랜치를 명확히 확인 가능
- 워킹트리에 이번 작업과 무관한 미커밋 변경이 없거나 매우 제한적임

중단 조건:

- 로컬 변경이 많아 이번 작업과 섞일 위험이 큰 경우
- 현재 브랜치에 다른 작업이 진행 중이라 안전하게 빠져나올 수 없는 경우

### 2. `develop`으로 이동

```bash
git checkout develop
```

주의:

- 브랜치 전환 중 충돌이 발생하면 먼저 현재 변경사항을 분리한다.
- 기존 로컬 변경이나 타인의 작업을 덮어쓰지 않는다.

### 3. `develop` 최신화

```bash
git pull --ff-only origin develop
```

목적:

- 오래된 `develop`에서 브랜치를 따는 실수를 방지
- 이후 PR diff 최소화

중단 조건:

- fast-forward가 안 되는 경우
- 로컬 `develop`이 비정상 상태인 경우

이 경우 임의 merge/rebase를 진행하지 말고 현재 상태를 먼저 정리한다.

### 4. 작업 브랜치 생성

```bash
git checkout -b chore/upgrade-prisma-v7
```

브랜치명 기본안:

- `chore/upgrade-prisma-v7`

대체안:

- `chore/upgrade-prisma-v7-esm`
- `chore/upgrade-prisma-v7-phase1`

### 5. 브랜치 생성 확인

```bash
git branch --show-current
git status --short
```

기대 상태:

- 현재 브랜치가 `chore/upgrade-prisma-v7`
- 워킹트리가 깨끗함

이 확인이 끝나면 업그레이드 작업을 시작한다.

---

## 사전 체크

실행 시작 후 가장 먼저 아래를 확인한다.

```bash
npm ls prisma @prisma/client
node -v
npm -v
npm run build
npm test
npm run test:e2e
```

목적:

- baseline 확보
- 기존 build/test 상태 확인
- Node 버전이 Prisma 7 최소 조건을 충족하는지 확인

중단 조건:

- 현재 브랜치가 이미 심하게 깨져 있어 baseline 자체가 불분명한 경우
- Node 버전이 `20.19.0` 미만이고 즉시 올릴 수 없는 경우

---

## 단계별 실행 계획

### Phase 1. 패키지와 모듈 설정 전환

목표:

- Prisma 7 설치
- ESM 기반 설정 반영
- 구식 Prisma 설정 제거

실행 명령 기본안:

```bash
npm install @prisma/client@7 @prisma/adapter-mariadb dotenv
npm install -D prisma@7 tsx
```

이 단계의 목표 설정값:

- `package.json`
  - `"type": "module"`
  - `"engines.node": ">=20.19.0"`
  - `package.json.prisma` 블록 제거
  - `"seed:dev": "tsx prisma/seed.ts"`
  - `"prisma:generate": "prisma generate"`
  - `"prisma:seed": "prisma db seed"`
- `tsconfig.json`
  - `"module": "ESNext"`
  - `"moduleResolution": "bundler"`
  - `"target": "ES2023"`
  - `"esModuleInterop": true`
- Jest
  - `extensionsToTreatAsEsm: [".ts"]`
  - `ts-jest`에 `useESM: true`
  - `moduleNameMapper`에 `^(\\.{1,2}/.*)\\.js$ -> $1`

수행 항목:

1. `package.json`
   - `prisma`와 `@prisma/client`를 `7.x`로 올린다.
   - `"type": "module"`을 추가한다.
   - `engines.node`를 `>=20.19.0`으로 상향한다.
   - `package.json.prisma` 블록 제거
   - `seed:dev`를 `tsx prisma/seed.ts`로 교체한다.
   - `prisma:generate`, `prisma:seed` 스크립트를 추가한다.
2. `tsconfig.json`
   - `module`을 `ESNext`로 전환
   - `moduleResolution`을 `bundler`로 전환
   - `target`을 `ES2023`으로 상향
   - `esModuleInterop`을 `true`로 맞춘다.
3. `tsconfig.build.json`
   - ESM 전환 후 build exclude가 그대로 유효한지 확인
4. `test/jest-e2e.json` 및 package.json의 Jest 설정
   - `ts-jest`가 ESM 환경에서 동작하도록 `useESM: true`를 적용
   - `extensionsToTreatAsEsm`와 `moduleNameMapper`를 추가
   - 단위/e2e 테스트 둘 다 같은 모듈 규칙을 따르도록 맞춘다.

기본 설정 예시:

`package.json`

```json
{
  "type": "module",
  "engines": {
    "node": ">=20.19.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "seed:dev": "tsx prisma/seed.ts",
    "prisma:generate": "prisma generate",
    "prisma:seed": "prisma db seed"
  }
}
```

`tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

Jest 기본안:

```json
{
  "extensionsToTreatAsEsm": [".ts"],
  "moduleNameMapper": {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  "transform": {
    "^.+\\.ts$": [
      "ts-jest",
      {
        "useESM": true
      }
    ]
  }
}
```

검증:

```bash
npm run build
```

이 단계의 목표는 앱이 완전히 동작하는 것이 아니라, ESM 설정 변경 후 최소 build 경로가
즉시 무너지지 않도록 만드는 것이다.

중단 조건:

- ESM 전환 후 Nest CLI가 구조적으로 빌드 불가
- Jest 설정이 단순 수정 수준이 아니라 테스트 인프라 재설계 수준으로 번지는 경우

그 경우 "Prisma 업그레이드"와 "테스트 인프라 ESM 정리"를 분리 이슈로 나눈다.

### Phase 2. Prisma 설정 구조 전환

목표:

- Prisma schema / CLI 설정을 v7 구조로 정리

수행 항목:

1. `prisma/schema.prisma`
   - generator를 `prisma-client-js`에서 `prisma-client`로 변경
   - `output = "../src/generated/prisma"` 추가
   - datasource block에서는 `provider = "mysql"`만 남기고 URL 제거
2. 루트에 `prisma.config.ts` 추가
   - `import 'dotenv/config'`
   - `defineConfig` 사용
   - `schema`, `migrations.path`, `migrations.seed`, `datasource.url` 정의
3. `.gitignore`
   - `src/generated/prisma`를 ignore 처리

기본 형태:

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

검증:

```bash
npx prisma generate
```

성공 기준:

- `src/generated/prisma` 생성
- Prisma config 파싱 성공
- schema validation 통과

중단 조건:

- `prisma.config.ts` 기준으로 env 로딩이 정상 동작하지 않는 경우
- generated output이 ESM build와 충돌하는 경우

### Phase 3. PrismaClient 초기화 방식 전환

목표:

- `new PrismaClient()` 단독 초기화 제거
- adapter 기반 초기화 적용

기본안:

- adapter 패키지: `@prisma/adapter-mariadb`
- 적용 위치: `src/prisma/prisma.service.ts`

설치 명령:

```bash
npm install @prisma/adapter-mariadb
```

수행 항목:

1. adapter 패키지 추가
2. `src/prisma/prisma.service.ts`에서 generated client import로 변경
3. adapter 인스턴스를 생성해 `new PrismaClient({ adapter })` 형태로 전환

구현 원칙:

- `DATABASE_URL`은 계속 단일 source of truth로 유지한다.
- adapter 생성에 필요한 세부 옵션은 `DATABASE_URL`을 기준으로 맞춘다.
- adapter 생성자 시그니처는 설치된 패키지의 타입 정의를 우선 기준으로 삼는다.

주의:

- 이 단계에서 adapter 패키지가 예상과 다르게 동작하면 다른 adapter로 갈아탄다.
- 이 문서의 기본값은 `@prisma/adapter-mariadb`지만, 연결 실패 원인이 adapter 자체면
  바로 재평가한다.

검증:

```bash
npm run build
```

추가 가능 시:

```bash
npm test
```

### Phase 4. import 전면 교체

목표:

- 앱/테스트/seed에서 `@prisma/client` 직접 import 제거

수행 항목:

1. `src/**/*.ts`
2. `test/**/*.ts`
3. `prisma/seed.ts`

위 범위에서:

- `@prisma/client` -> generated client 경로로 교체
- 타입 import와 runtime import를 모두 정리
- 상대 경로 실수를 막기 위해 한 번에 전체 치환하지 말고 깊이별로 검토한다.

기본 import 예시:

```ts
import { PrismaClient } from '../generated/prisma/client';
```

주의:

- 실제 상대 경로는 파일 위치마다 다르다.
- `src/prisma/prisma.service.ts`, `prisma/seed.ts`, `src/common/**`, `test/**`는 서로 경로 깊이가 다르다.

검증:

```bash
rg -n "@prisma/client" src test prisma
npm run build
```

성공 기준:

- 검색 결과가 `0`
- build 통과

### Phase 5. seed / lint / test 정리

목표:

- Prisma 7의 수동 generate/seed 흐름을 개발 루틴에 반영

수행 항목:

1. `prisma/seed.ts`
   - generated client import로 전환
   - ESM 환경에서 실행 가능한지 확인
2. package scripts 정리
   - `prisma generate`를 명시적으로 호출할 수 있는 스크립트 추가 검토
   - `seed:dev`를 `tsx prisma/seed.ts`로 고정
   - `prisma:generate`, `prisma:seed`를 유지
3. lint/test 실행

권장 검증 순서:

```bash
npx prisma generate
npm run lint
npm test
npm run test:e2e
```

필요 시 추가 검증:

```bash
npx prisma db seed
```

중단 조건:

- seed가 ESM 런타임 문제로 계속 실패하는 경우
- Jest가 `ts-jest` 조정만으로 해결되지 않는 경우

---

## 커밋 전략

이 작업은 큰 커밋 하나로 끝내지 않는다.
단계가 분리되는 만큼 커밋도 단계별로 나눈다.

권장 커밋 단위:

1. ESM / package / tsconfig / Jest 설정 정리
2. Prisma schema / prisma.config / adapter 도입
3. import 전면 교체 + seed 정리 + 최종 검증 반영

각 커밋 전 확인:

```bash
git status --short
git diff --stat
```

관련 파일만 스테이징한다.
무관한 변경이 섞여 있으면 분리한다.

### Lore Commit Protocol

커밋 메시지는 Lore 형식을 따른다.
첫 줄은 "왜"를 적고, 본문과 trailer로 제약과 검증을 남긴다.

예시:

```text
Make Prisma 7 migration executable on the current NestJS toolchain

ESM and Prisma config changes are applied first so the repository can
adopt Prisma 7 without leaving CLI, build, and test paths in a mixed
CommonJS and generated-client state.

Constraint: Prisma ORM 7 requires ESM-first setup and explicit Prisma config
Rejected: Upgrade Prisma without ESM conversion | leaves build and CLI paths inconsistent
Confidence: medium
Scope-risk: moderate
Directive: Do not move the generated client path again without rechecking every relative import
Tested: prisma generate, build, lint, unit test, e2e test
Not-tested: production deployment runtime
```

커밋 예시:

```bash
git add package.json tsconfig.json tsconfig.build.json test/jest-e2e.json prisma.config.ts prisma/schema.prisma src/prisma/prisma.service.ts prisma/seed.ts
git commit
```

---

## 최종 정리와 PR 준비

모든 단계가 끝나면 아래 순서로 마무리한다.

### 1. 최종 diff 확인

```bash
git status --short
git diff --stat develop...HEAD
```

확인 포인트:

- 변경 파일이 의도한 범위인지
- generated client가 ignore 처리되었는지
- 무관한 파일이 섞이지 않았는지

### 2. 최종 검증 실행

```bash
npx prisma generate
npm run build
npm run lint
npm test
npm run test:e2e
```

필요 시:

```bash
npx prisma db seed
```

### 3. 커밋 누락 확인

```bash
git status --short
```

기대 상태:

- 워킹트리가 깨끗함

### 4. `develop` 대상 PR 준비

PR 기준:

- base: `develop`
- head: `chore/upgrade-prisma-v7`

PR 설명에는 최소한 아래를 포함한다.

- Prisma 7로 올린 이유
- ESM 전환 범위
- 실제 적용한 adapter
- generated client 관리 정책
- 통과한 검증 명령
- 남은 리스크

---

## 실패 시 우선 확인할 포인트

### 1. ESM 관련 에러

대표 증상:

- `Cannot use import statement outside a module`
- `ReferenceError: require is not defined`
- Jest가 TS 파일을 CommonJS처럼 해석

우선 점검:

- `package.json`의 `"type": "module"`
- `tsconfig.json`의 `module`, `moduleResolution`
- Jest transform 설정
- seed 실행기(`ts-node` 또는 대체 실행기)
- `seed:dev`와 `migrations.seed`가 둘 다 `tsx prisma/seed.ts`로 맞춰져 있는지

### 2. Prisma config 관련 에러

대표 증상:

- `DATABASE_URL` 미해결
- `prisma.config.ts` 로드 실패
- `schema.prisma` datasource URL 누락 관련 에러

우선 점검:

- `prisma.config.ts`의 `import 'dotenv/config'`
- `env('DATABASE_URL')`
- `.env.dev`, `.env` 사용 위치와 Prisma CLI의 실제 작업 디렉터리
- `migrations.seed`가 `tsx prisma/seed.ts`로 설정되었는지

### 3. adapter 관련 에러

대표 증상:

- PrismaClient 초기화 실패
- DB 연결 에러
- driver-specific option mismatch

우선 점검:

- `@prisma/adapter-mariadb` 패키지 버전
- 현재 DB가 MySQL인지 MariaDB인지
- adapter 생성자 인자와 실제 `DATABASE_URL` 형식

---

## OMX 실행 메모

OMX는 아래 순서대로 진행한다.

1. `develop` 최신화
2. `chore/upgrade-prisma-v7` 브랜치 생성
3. baseline build/test 확보
4. ESM 설정 전환
5. Prisma config / schema 전환
6. adapter 도입
7. import 전면 교체
8. generate/build/lint/test/e2e 검증
9. Lore 형식 커밋 정리
10. `develop` 대상 PR 준비

작업 도중 사용자에게 다시 묻지 말아야 하는 항목:

- `develop`에서 작업 브랜치를 새로 파는 절차
- generated client 위치
- generated client 비커밋 정책
- Prisma config 도입
- ESM 전환 필요 여부

사용자에게만 올려야 하는 항목:

- Node 버전이 최소 요구사항 미만이라 로컬 환경 변경이 필요한 경우
- adapter 자체가 연결되지 않아 DB 종류/접속 방식 결정을 새로 해야 하는 경우
- Jest/seed가 단순 수정이 아닌 별도 마이그레이션 과제로 커지는 경우

---

## 최종 검증 명령

작업 종료 전 아래 명령을 순서대로 수행한다.

```bash
npx prisma generate
npm run build
npm run lint
npm test
npm run test:e2e
```

가능하면 추가 확인:

```bash
npx prisma db seed
```

최종 보고에는 반드시 포함:

- 변경 파일
- 실제 적용한 adapter
- ESM 대응으로 바뀐 설정
- generated client 관리 방식
- 통과한 검증
- 남은 리스크

---

## 참고

- Prisma v7 upgrade guide: https://docs.prisma.io/docs/v6/orm/more/upgrades/to-v7
- Prisma MySQL/MariaDB docs: https://www.prisma.io/docs/v6/orm/overview/databases/mysql
- Prisma ORM v7.0.0 changelog: https://www.prisma.io/changelog/2025-11-19
