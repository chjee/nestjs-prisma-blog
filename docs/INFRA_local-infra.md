# INFRA: 로컬 공용 인프라 기준안 (docker-local-infra)

> 작성일: 2026-04-11
> 대상 레포: `docker-local-infra` (별도 레포)
> 목적: 여러 애플리케이션 레포가 공용 로컬 인프라를 일관된 계약으로 사용하도록 기준을 정의

---

## 개요

MySQL, Redis, RabbitMQ 등 여러 프로젝트에서 공용으로 사용하는 인프라를 단일 레포에서 관리합니다.
각 애플리케이션 레포는 이 인프라 레포가 제공하는 컨테이너에 Docker external network로 연결합니다.

이 문서는 단순 아이디어 메모가 아니라, 이후 각 레포를 수정할 때 따라야 하는 **기준 인프라 계약**을 정의합니다.

---

## 운영 전제

- 개발 대상은 여러 개의 애플리케이션 레포이며, 모두 **Docker 컨테이너로 실행**합니다.
- 공용 인프라는 별도 레포 `docker-local-infra`에서 관리합니다.
- 애플리케이션 컨테이너는 공용 네트워크 `infra_default`에 연결합니다.
- 인프라 서비스 접속은 호스트명이 아닌 Docker 서비스/컨테이너명으로 수행합니다.
- 개발 편의를 위해 로컬 인프라는 공유하지만, 계정/DB/네트워크 규칙은 고정합니다.

즉, 이 기준안에서는 호스트에서 `npm run start:dev`로 앱을 직접 띄우는 흐름을 표준으로 보지 않습니다.
기본 흐름은 `docker compose up`으로 앱 컨테이너를 실행하는 방식입니다.

---

## 레포 구조

```text
docker-local-infra/
  docker-compose.yml
  Makefile
  .env.example
  .env
  initdb/
    01_create_databases.sh
  README.md
```

### 각 파일 역할

| 파일                            | 역할                            |
| ------------------------------- | ------------------------------- |
| `docker-compose.yml`            | 공용 인프라 서비스 정의         |
| `Makefile`                      | 자주 쓰는 실행/정지/초기화 명령 |
| `.env.example`                  | 인프라 레포용 환경변수 샘플     |
| `.env`                          | 실제 인프라 레포 환경변수       |
| `initdb/01_create_databases.sh` | MySQL DB/계정/권한 초기화       |

---

## 기준 정책

### 1. 공용 네트워크 이름 고정

모든 레포는 `infra_default`라는 이름의 external network를 사용합니다.

### 2. 서비스명 고정

애플리케이션 레포는 아래 호스트명을 공통으로 사용합니다.

| 서비스   | 컨테이너명       | 애플리케이션 접속 호스트 |
| -------- | ---------------- | ------------------------ |
| MySQL    | `local-mysql`    | `local-mysql`            |
| Redis    | `local-redis`    | `local-redis`            |
| RabbitMQ | `local-rabbitmq` | `local-rabbitmq`         |

### 3. DB/계정 생성 책임 분리

- DB 생성, 계정 생성, 권한 부여는 `docker-local-infra/initdb/01_create_databases.sh`가 담당합니다.
- 테이블 생성/변경은 각 애플리케이션 레포의 마이그레이션이 담당합니다.

### 4. 비밀번호 정본 위치

현재 구조에서는 **프로젝트 DB 계정 비밀번호의 정본은 `docker-local-infra/.env`** 입니다.
`initdb/01_create_databases.sh`가 이 값을 읽어 실제 DB와 계정을 생성합니다.
각 프로젝트 레포의 `.env`는 그 값을 다시 적어 연결 문자열을 맞추는 역할을 합니다.

즉:

- 실제 계정 생성 값: 인프라 레포 `.env`
- 애플리케이션 연결 값: 각 프로젝트 `.env`

둘이 다르면 인증 실패가 발생합니다.

### 5. `down-clean`은 기본 절차가 아님

`make down-clean`은 MySQL 볼륨까지 삭제하므로 **모든 로컬 데이터가 초기화**됩니다.
신규 프로젝트 DB 추가 시 기본 절차로 사용하지 않습니다.

기본 원칙:

- 신규 DB/계정 추가: 기존 MySQL에 bootstrap 스크립트 재적용
- 전체 초기화가 필요할 때만: `make down-clean`

---

## 권장 계정 전략

공용 로컬 MySQL을 여러 레포가 함께 쓰지만, 현재 개발 기준은 설정 단순화를 위해 **단일 개발 계정 1개**를 사용합니다.

| 환경     | 권장 방식      | 이유                  |
| -------- | -------------- | --------------------- |
| 개발     | 단일 공용 계정 | 레포 공통 설정 단순화 |
| 프로덕션 | DB별 전용 계정 | 최소 권한 원칙        |

### 개발에서 단일 계정을 쓰는 이유

여러 레포를 동시에 맞춰야 하는 초기 정렬 단계에서는 단일 개발 계정이 가장 단순합니다.

- 각 레포의 `DATABASE_URL` 패턴을 통일하기 쉬움
- 신규 레포 추가 시 환경변수 관리 포인트가 적음
- 로컬 공용 인프라 초기 정착 속도가 빠름

단, 이 방식은 개발 편의용입니다.
프로덕션이나 보안 민감 환경은 DB별 전용 계정으로 분리합니다.

---

## `initdb/01_create_databases.sh`

MySQL 컨테이너는 **최초 기동 시** `/docker-entrypoint-initdb.d/` 안의 `.sh` 파일을 자동 실행합니다.
이 스크립트는 컨테이너 환경변수를 읽어 DB와 계정을 생성합니다.
볼륨이 이미 존재하면 이 스크립트는 다시 자동 실행되지 않습니다.

따라서:

- 최초 기동: 자동 DB/계정 생성
- 이후 신규 프로젝트 추가: 기존 서버에 bootstrap 스크립트 재적용 필요
- 전체 재초기화: `make down-clean` 후 재기동

### 기준 예시

```env
BLOG_DB_NAME=blog_db
HR_DB_NAME=hr_db

DEV_DB_USER=devuser
DEV_DB_PASSWORD=changeme
```

### 계정 관리 원칙

- DB명은 프로젝트별로 명확히 구분합니다.
- 개발 계정은 공용 단일 계정을 사용합니다.
- 비밀번호는 인프라 레포 `.env`에서 관리합니다.
- 값 변경 시 기존 볼륨에는 자동 반영되지 않으므로 적용 절차를 분리해야 합니다.

---

## `docker-compose.yml`

profiles 방식으로 필요한 서비스만 선택적으로 기동합니다.

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.4
    container_name: local-mysql
    restart: unless-stopped
    profiles: ['mysql', 'full']
    ports:
      - '3306:3306'
    command: --innodb-buffer-pool-size=${MYSQL_BUFFER_POOL_SIZE:-256M}
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./initdb:/docker-entrypoint-initdb.d
    healthcheck:
      test:
        [
          'CMD',
          'mysqladmin',
          'ping',
          '-h',
          'localhost',
          '-u',
          'root',
          '-p${MYSQL_ROOT_PASSWORD:-root}',
        ]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - infra_default

  redis:
    image: redis:8.6-alpine
    container_name: local-redis
    restart: unless-stopped
    profiles: ['redis', 'full']
    ports:
      - '6379:6379'
    command: redis-server --maxmemory ${REDIS_MAXMEMORY:-256mb} --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - infra_default

  rabbitmq:
    image: rabbitmq:4.2-management
    container_name: local-rabbitmq
    restart: unless-stopped
    profiles: ['rabbitmq', 'full']
    ports:
      - '5672:5672'
      - '15672:15672'
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-admin}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-admin}
      RABBITMQ_SERVER_ADDITIONAL_ERL_ARGS: -rabbit vm_memory_high_watermark ${RABBITMQ_MEMORY_WATERMARK:-0.2}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ['CMD', 'rabbitmq-diagnostics', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - infra_default

volumes:
  mysql_data:
  redis_data:
  rabbitmq_data:

networks:
  infra_default:
    name: infra_default
    driver: bridge
```

> `networks.infra_default.name: infra_default`를 명시해야 다른 레포가 `external: true`로 일관되게 참조할 수 있습니다.

---

## `Makefile`

```makefile
up-mysql:
	docker compose --profile mysql up -d

up-redis:
	docker compose --profile redis up -d

up-rabbitmq:
	docker compose --profile rabbitmq up -d

up-mysql-redis:
	docker compose --profile mysql --profile redis up -d

up-mysql-rabbitmq:
	docker compose --profile mysql --profile rabbitmq up -d

up-full:
	docker compose --profile full up -d

stop-mysql:
	docker compose stop mysql

stop-redis:
	docker compose stop redis

stop-rabbitmq:
	docker compose stop rabbitmq

stop-mysql-redis:
	docker compose stop mysql redis

stop-mysql-rabbitmq:
	docker compose stop mysql rabbitmq

stop-full:
	docker compose stop mysql redis rabbitmq

down:
	docker compose down

down-clean:
	docker compose down -v
```

### 명령 사용 원칙

- 특정 서비스만 내릴 때: `make stop-*`
- 전체 컨테이너만 정지할 때: `make stop-full`
- 평소 정지: `make down`
- 데이터 유지 재기동: `make down` 후 `make up-*`
- 전체 데이터 초기화: `make down-clean`

---

## `.env.example`

```env
# MySQL root 계정 (컨테이너 초기화용)
MYSQL_ROOT_PASSWORD=root

# MySQL 메모리 제한
MYSQL_BUFFER_POOL_SIZE=256M

# Redis 메모리 제한
REDIS_MAXMEMORY=256mb

# RabbitMQ 관리 계정
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin

# RabbitMQ 메모리 임계치
RABBITMQ_MEMORY_WATERMARK=0.2

# 프로젝트 DB 계정
BLOG_DB_NAME=blog_db
HR_DB_NAME=hr_db

DEV_DB_USER=devuser
DEV_DB_PASSWORD=changeme
```

### 주의

- 이 `.env`는 인프라 레포용입니다.
- 프로젝트 DB 계정 값도 이 파일에서 관리합니다.
- `initdb/01_create_databases.sh`가 이 값을 읽어 DB와 계정을 생성합니다.
- 퍼블릭 레포 기준으로 `.env.example`에는 실제 비밀번호 대신 placeholder를 사용합니다.

---

## 각 애플리케이션 레포가 따라야 할 계약

각 레포는 아래 계약을 만족하도록 수정합니다.

### 1. external network 연결

```yaml
services:
  app:
    networks:
      - infra_default

networks:
  infra_default:
    external: true
```

### 2. 접속 호스트 고정

컨테이너 내부에서 접속할 때는 `localhost`가 아니라 공용 인프라 호스트명을 사용합니다.

예시:

```env
DATABASE_URL=mysql://devuser:changeme@local-mysql:3306/blog_db
REDIS_HOST=local-redis
RABBITMQ_HOST=local-rabbitmq
```

### 3. 앱 기동 순서 고려

공용 인프라는 별도 Compose 프로젝트이므로, 각 애플리케이션 레포에서 외부 인프라에 대해 `depends_on`으로 완전한 기동 보장을 할 수 없습니다.
따라서 각 앱은 아래 둘 중 하나를 가져야 합니다.

- 애플리케이션 레벨 재시도 로직
- 별도 wait-for 스크립트 또는 entrypoint 대기 로직

### 4. 마이그레이션 실행 책임 명시

각 레포는 아래 중 하나를 명확히 정해야 합니다.

- 앱 시작 전에 별도 migration job 실행
- 앱 startup command에서 migration 후 애플리케이션 실행

혼합 상태로 두지 않습니다.

### 5. 앱별 추가 환경변수는 각 레포가 관리

공용 인프라 문서는 연결 규약만 정의합니다.
예를 들어 JWT secret, CORS origin, 로그 설정 같은 앱 전용 환경변수는 각 레포 문서에서 관리합니다.

---

## `nestjs-prisma-blog` 연결 예시

```yaml
services:
  app:
    build: .
    container_name: nestjs-prisma-blog-app
    env_file:
      - .env
    networks:
      - infra_default

networks:
  infra_default:
    external: true
```

예시 `.env`:

```env
DATABASE_URL=mysql://devuser:changeme@local-mysql:3306/blog_db
```

이 값은 반드시 `docker-local-infra/.env`의 계정 정의와 일치해야 합니다.

---

## 신규 프로젝트 DB 추가 절차

신규 프로젝트를 추가할 때는 아래 순서를 따릅니다.

### 기본 절차: 기존 데이터 유지

1. `docker-local-infra/.env`에 새 DB/계정 변수 추가
2. `docker-local-infra/initdb/01_create_databases.sh`에 새 bootstrap 블록 추가
3. 실행 중인 MySQL 컨테이너에 bootstrap 스크립트 수동 적용
4. 새 프로젝트 레포의 `.env` 연결 문자열 반영
5. 새 프로젝트 레포 마이그레이션 실행

예시:

```bash
# 1. 인프라 레포 수정 후
cd ~/workspace/docker-local-infra

# 2. 실행 중인 MySQL에 수동 반영
docker cp .env local-mysql:/tmp/infra.env
docker exec local-mysql sh -c 'set -a; . /tmp/infra.env; set +a; exec /docker-entrypoint-initdb.d/01_create_databases.sh'
docker exec local-mysql rm -f /tmp/infra.env
```

주의:

- 위 명령은 기존 정의가 `IF NOT EXISTS` 기반일 때 안전합니다.
- 이미 존재하는 계정 비밀번호 변경, 권한 축소 같은 변경은 별도 검토가 필요합니다.

### 전체 재초기화가 필요한 경우만

```bash
cd ~/workspace/docker-local-infra
make down-clean
make up-mysql
```

이 절차는 기존 로컬 DB 데이터를 모두 삭제합니다.

---

## DDL 전략

DB 생성과 테이블 생성은 역할을 분리합니다.

| 역할                | 담당                                     | 실행 시점                           |
| ------------------- | ---------------------------------------- | ----------------------------------- |
| DB 생성 / 계정 생성 | `.env` + `initdb/01_create_databases.sh` | MySQL 최초 기동 또는 수동 반영 시   |
| 테이블 생성 / 변경  | 각 프로젝트 마이그레이션                 | 프로젝트 배포/기동 흐름에 따라 실행 |

### 개발 환경 흐름

```bash
# 1. 공용 인프라 실행
cd ~/workspace/docker-local-infra
make up-mysql

# 2. 프로젝트 앱 실행
cd ~/workspace/nestjs-prisma-blog
docker compose up --build
```

### 마이그레이션 흐름 예시

```bash
# 앱 컨테이너 또는 별도 migration job 내부에서 실행
npx prisma migrate deploy
```

개발에서 `migrate dev`를 쓸지 `migrate deploy`를 쓸지는 각 레포의 개발 전략에 맞추되,
공용 인프라 기준 문서에는 “DB는 미리 존재해야 한다”는 계약만 둡니다.

---

## 기동 순서

```bash
# 1. 인프라 레포 클론
git clone https://github.com/chjee/docker-local-infra.git
cd docker-local-infra

# 2. 인프라 환경변수 준비
cp .env.example .env

# 3. 필요한 공용 서비스 실행
make up-mysql

# 4. 각 애플리케이션 레포 실행
cd ~/workspace/nestjs-prisma-blog
docker compose up --build
```

필요한 경우 Redis, RabbitMQ까지 포함해 실행합니다.

---

## 체크리스트

기준 인프라 적용 전 확인:

- `infra_default` 네트워크 이름이 고정되어 있는가
- MySQL 컨테이너명이 `local-mysql`인가
- 각 프로젝트 DB/계정이 `docker-local-infra/.env`와 `initdb/01_create_databases.sh`에 반영되어 있는가
- 각 애플리케이션 레포가 `external: true`로 `infra_default`를 참조하는가
- 각 프로젝트 `.env`의 접속 문자열이 인프라 로컬 `.env` 정의와 일치하는가
- 각 프로젝트가 migration 실행 책임을 명확히 갖는가

---

## 참고

- 인프라 컨테이너는 `restart: unless-stopped`로 Docker 재시작 시 자동 기동됩니다.
- `initdb` 스크립트는 볼륨 최초 생성 시에만 자동 실행됩니다.
- 신규 프로젝트 추가 시 기본 경로는 bootstrap 스크립트 재적용이며, `down-clean`은 파괴적 작업입니다.
- Redis는 기본값으로 인증 없이 둘 수 있으나, 필요하면 별도 보안 설정을 추가합니다.
- RabbitMQ, Redis도 장기적으로는 프로젝트별 네임스페이스/정책 분리가 필요할 수 있습니다.
