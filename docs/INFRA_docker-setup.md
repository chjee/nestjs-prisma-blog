# INFRA: Docker 환경 구성

> 작성일: 2026-04-11
> 대상 브랜치: develop
> 기준 커밋: 47141e8

---

## 전체 구조 개요

MySQL, RabbitMQ 등 공용 인프라는 **별도 레포(`docker-local-infra`)** 에서 관리합니다.
각 프로젝트는 앱 컨테이너만 포함하고, 공용 인프라에 external network로 연결합니다.

```
~/workspace/
  docker-local-infra/          ← 공용 인프라 레포 (MySQL, RabbitMQ 등)
    docker-compose.yml
    .env.example
  nestjs-prisma-blog/          ← 이 레포
    docker-compose.yml         ← app 서비스만
    Dockerfile
    .dockerignore
  other-project/
    docker-compose.yml         ← app 서비스만 (동일 패턴)
```

> `docker-local-infra` 구성은 별도 문서(`INFRA_local-infra.md`)에서 관리합니다.

---

## 권장 작업 방식

단일 브랜치에서 순차 진행합니다.

권장 브랜치: `infra/docker-setup`

작업 순서:

1. `.dockerignore` 생성
2. `Dockerfile` 생성 (멀티스테이지 빌드)
3. `docker-compose.yml` 수정 — MySQL 서비스 제거, app 서비스 추가, external network 연결
4. 로컬 빌드 및 컨테이너 기동 검증

---

## 현재 문제점

- **NestJS 앱 컨테이너 없음** — MySQL만 띄우는 구성, 앱은 수동 실행 필요
- **MySQL이 이 레포에 포함** — 다른 프로젝트와 공용 사용 불가, 별도 레포로 분리 필요
- **Dockerfile 없음** — 앱 컨테이너화 불가
- **`.dockerignore` 없음** — 빌드 시 `node_modules`, `dist` 등 불필요한 파일 포함

---

## 작업 내용

### 1. `.dockerignore` 생성

빌드 컨텍스트에서 제외할 파일 목록.

```
node_modules
dist
.env*
*.log
coverage
.git
```

---

### 2. `Dockerfile` 생성

멀티스테이지 빌드로 프로덕션 이미지 경량화.

- **builder** 단계: 전체 의존성 설치 후 빌드
- **runner** 단계: `devDependencies` 제외, `dist`만 복사

```dockerfile
# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm run build

EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma db push && node dist/main"]
```

---

### 3. `docker-compose.yml` 수정

#### 변경 사항

| 항목                | 현재 | 수정 후                                     |
| ------------------- | ---- | ------------------------------------------- |
| MySQL 서비스        | 포함 | 제거 (docker-local-infra로 분리)            |
| NestJS 앱 서비스    | 없음 | `app` 서비스 추가                           |
| 인프라 연결 방식    | 없음 | external network(`infra_default`) 참조      |
| Prisma 마이그레이션 | 수동 | 컨테이너 시작 시 `migrate deploy` 자동 실행 |

#### 수정 후 전체 내용

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: runner
    container_name: nestjs-prisma-blog-app
    restart: unless-stopped
    ports:
      - '${PORT:-3000}:3000'
    environment:
      DATABASE_URL: mysql://${MYSQL_USER:-blog_user}:${MYSQL_PASSWORD:-blog_password}@mysql:3306/${MYSQL_DATABASE:-nestjs_prisma_blog}
      JWT_SECRET: ${JWT_SECRET}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-http://localhost:3000}
      NODE_ENV: ${NODE_ENV:-production}
    depends_on:
      mysql:
        condition: service_healthy
    command: >
      sh -c "pnpm prisma migrate deploy && node dist/main"
    networks:
      - infra_default

networks:
  infra_default:
    external: true
```

> `DATABASE_URL`의 호스트가 `localhost`가 아닌 `mysql`인 점에 주의.
> `mysql`은 `docker-local-infra`에서 띄운 MySQL 컨테이너명으로, 같은 Docker 네트워크 안에서 서비스 디스커버리로 접근합니다.

#### `.env` 필수 환경변수

```env
MYSQL_USER=blog_user
MYSQL_PASSWORD=blog_password
MYSQL_DATABASE=nestjs_prisma_blog
JWT_SECRET=your-secret-here
ALLOWED_ORIGINS=http://localhost:3000
PORT=3000
NODE_ENV=production
```

---

## 검증 방법

```bash
# 1. docker-local-infra 먼저 기동 (최초 1회)
cd ~/workspace/docker-local-infra
docker compose up -d

# 2. 이 프로젝트 앱 빌드 및 기동
cd ~/workspace/nestjs-prisma-blog
docker compose up --build

# 3. 앱 정상 기동 확인
curl http://localhost:3000/health

# 4. 컨테이너 종료
docker compose down
```

---

## 참고

- `docker-local-infra`의 네트워크명이 `infra_default`인지 확인 필요 (기본값: `{폴더명}_default`)
- `migrate deploy`는 프로덕션용 명령 — 개발 환경에서는 `migrate dev` 사용
- 개발 시에는 `docker-local-infra`만 띄우고 앱은 `pnpm run start:dev`로 실행하는 방식도 유효
- `docker-local-infra` 구성 내용은 해당 레포의 `INFRA_local-infra.md` 참고
