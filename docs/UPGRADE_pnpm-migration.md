# UPGRADE: npm -> pnpm 전환 계획

> 작성일: 2026-04-11
> 대상 브랜치 기준: `develop`
> 상태: 계획만 작성, 코드/락파일 미변경

---

## 목적

이 레포의 패키지 매니저를 `npm`에서 `pnpm`으로 전환합니다.

이번 전환의 목표:

- 로컬 개발 명령을 `pnpm` 기준으로 통일
- `package-lock.json` 제거 및 `pnpm-lock.yaml` 도입
- Docker 빌드 경로를 `pnpm` 기준으로 정리
- Prisma / Nest build / 테스트 흐름이 `pnpm`에서도 동일하게 동작하도록 검증

오늘은 계획만 정리하고, 실제 전환은 별도 작업으로 진행합니다.

---

## 현재 상태

현재 레포는 `npm` 기준으로 고정돼 있습니다.

주요 근거:

- `package-lock.json` 존재
- `Dockerfile`에서 `npm ci`, `npm run build` 사용
- `docker-compose.yml` startup에서 `npx prisma db push` 사용
- `README.md`가 `npm install`, `npm run ...` 기준으로 작성됨
- 여러 문서가 `npm` / `npx prisma` 명령을 직접 예시로 사용

---

## 왜 작업이 큰가

패키지 매니저 전환은 락파일 하나만 바꾸는 작업이 아닙니다.

- 의존성 설치 명령 변경
- 락파일 변경
- Docker build layer 변경
- Prisma generate / db push / migrate 명령 검증
- husky / lint-staged / 스크립트 실행 경로 검증
- 문서 및 온보딩 명령 변경

즉, 수정량보다 **검증 범위가 큰 작업**입니다.

---

## 영향 범위

수정 가능성이 높은 파일:

- `package.json`
- `package-lock.json` 제거
- `pnpm-lock.yaml` 생성
- `Dockerfile`
- `README.md`
- `docs/INFRA_docker-setup.md`
- `docs/INFRA_local-infra.md`
- `docs/UPGRADE_prisma-v7.md`
- 필요 시 CI / 자동화 스크립트

영향 가능성이 높은 런타임 흐름:

- `pnpm install`
- `pnpm run build`
- `pnpm run lint`
- `pnpm test`
- `pnpm run test:e2e`
- `pnpm prisma generate`
- `pnpm prisma db push`

---

## 전환 전략

### 1. 새 브랜치에서 진행

권장 브랜치 예시:

- `chore/pnpm-migration`

### 2. npm 흔적 식별

우선 아래를 전부 찾고 분류합니다.

- `npm install`
- `npm ci`
- `npm run ...`
- `npx prisma ...`
- `package-lock.json`

### 3. 락파일 전환

- `package-lock.json` 제거
- `pnpm install` 실행
- `pnpm-lock.yaml` 생성

### 4. Docker 경로 전환

현재 Dockerfile은 `npm ci` 기반입니다.
이를 `pnpm` 기준으로 바꿔야 합니다.

검토 포인트:

- `corepack enable` 사용 여부
- `pnpm install --frozen-lockfile` 사용 여부
- Prisma schema 복사 순서 유지
- Docker layer cache 손상 최소화

### 5. 실행 명령 정리

가능하면 `npx prisma ...`를 `pnpm prisma ...`로 정리합니다.

후보:

- `npx prisma generate` -> `pnpm prisma generate`
- `npx prisma db push` -> `pnpm prisma db push`

### 6. 문서 정리

README와 운영 문서에서 `npm` 예시를 `pnpm` 기준으로 갱신합니다.

단, 모든 문서를 한 번에 다 갈아엎기보다:

1. 실제로 지금 쓰는 문서 우선
2. 이후 부수 문서 정리

순서로 가는 편이 안전합니다.

---

## 권장 구현 순서

1. 새 브랜치 생성
2. `package-lock.json` 제거
3. `pnpm-lock.yaml` 생성
4. `package.json`에 `packageManager` 명시 검토
5. Dockerfile 전환
6. 로컬 설치/빌드/테스트
7. Docker 재빌드/기동 검증
8. 문서 갱신

---

## 검증 체크리스트

필수 검증:

- `pnpm install`
- `pnpm run build`
- `pnpm run lint`
- `pnpm test`
- `pnpm run test:e2e`
- `pnpm prisma generate`
- `docker compose build`
- `docker compose up -d`
- `curl http://localhost:3000/health`

추가 확인:

- husky / lint-staged가 `pnpm` 환경에서 정상 동작하는가
- Docker 이미지 빌드 속도와 캐시가 크게 악화되지 않는가
- Prisma 명령이 컨테이너 안에서도 동일하게 동작하는가

---

## 예상 리스크

### 1. Prisma 명령 경로 차이

`npx` 기반 명령을 단순 치환하면 Docker/로컬에서 동작 차이가 날 수 있습니다.

### 2. husky / lint-staged 실행 컨텍스트

`npm`에 암묵적으로 기대던 부분이 있으면 hook에서 깨질 수 있습니다.

### 3. Docker 캐시 효율 저하

`pnpm` 전환 시 lockfile / store 전략이 바뀌면서 빌드 캐시가 달라질 수 있습니다.

### 4. 문서와 실제 명령 불일치

전환 후 문서 정리가 늦으면 팀원이 기존 `npm` 명령을 계속 사용할 수 있습니다.

---

## 의사결정 메모

- 이번 전환은 “작은 치환 작업”이 아니라 “패키지 매니저 표준 변경”으로 다룹니다.
- 따라서 코드 수정 전에 계획 문서를 두고, 빌드/런타임 검증을 끝까지 포함해야 합니다.
- 특히 현재 레포는 공용 인프라 Docker 연동이 막 끝난 상태라서, 패키지 매니저 변경은 별도 작업으로 분리하는 것이 맞습니다.
