# INFRA: 로컬 공용 인프라 구성 (docker-local-infra)

> 작성일: 2026-04-11
> 대상 레포: docker-local-infra (별도 레포)

---

## 개요

MySQL, Redis, RabbitMQ 등 여러 프로젝트에서 공용으로 사용하는 인프라를 단일 레포에서 관리합니다.
각 프로젝트는 이 레포에서 띄운 컨테이너에 external network로 연결합니다.

---

## 레포 구조

```
docker-local-infra/
  docker-compose.yml    ← 전체 서비스 정의 (profiles로 선택적 기동)
  Makefile              ← 자주 쓰는 조합 단축 명령
  .env.example          ← 환경변수 샘플
  .env                  ← 실제 환경변수 (git 제외)
  initdb/               ← MySQL 초기화 SQL 스크립트
    01_create_databases.sql  ← DB 생성 + 계정 생성 + 권한 부여
  README.md
```

---

## 권장 작업 방식

### 브랜치: 별도 레포이므로 main에서 직접 관리

### 작업 순서

1. `docker-local-infra` 레포 생성
2. `initdb/01_create_databases.sql` 작성 (DB 생성 + 계정 생성)
3. `docker-compose.yml` 작성 (profiles 방식, initdb 볼륨 마운트)
4. `Makefile` 작성
5. `.env.example` 작성
6. 각 프로젝트 `docker-compose.yml`의 external network 네트워크명 확인 및 맞추기

---

## `initdb/01_create_databases.sql`

MySQL 컨테이너가 **최초 기동 시** `/docker-entrypoint-initdb.d/` 안의 `.sql` 파일을 자동 실행합니다.
**볼륨이 이미 존재하면 재실행되지 않습니다** — DB/계정을 변경해야 할 경우 볼륨을 삭제(`make down-clean`) 후 재기동하세요.

프로젝트가 늘어날 때마다 이 파일에 DB + 계정 블록을 추가합니다.

```sql
-- ============================================================
-- nestjs-prisma-blog
-- ============================================================
CREATE DATABASE IF NOT EXISTS nestjs_prisma_blog
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'blog_user'@'%' IDENTIFIED BY 'blog_password';
GRANT ALL PRIVILEGES ON nestjs_prisma_blog.* TO 'blog_user'@'%';

-- ============================================================
-- 새 프로젝트 추가 시 아래 패턴으로 블록 추가
-- ============================================================
-- CREATE DATABASE IF NOT EXISTS <project_db> ...
-- CREATE USER IF NOT EXISTS '<project_user>'@'%' IDENTIFIED BY '<project_pass>';
-- GRANT ALL PRIVILEGES ON <project_db>.* TO '<project_user>'@'%';

FLUSH PRIVILEGES;
```

> 계정별 비밀번호는 각 프로젝트 레포의 `.env`에서 관리합니다.
> `docker-local-infra/.env`는 `MYSQL_ROOT_PASSWORD`만 관리합니다.

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
      - ./initdb:/docker-entrypoint-initdb.d # 최초 기동 시 DB/계정 생성
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
      - '5672:5672' # AMQP
      - '15672:15672' # 관리 콘솔
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

> `networks.infra_default.name: infra_default` 을 명시해야 각 프로젝트에서
> `external: true`로 참조할 때 이름이 보장됩니다.

---

## `Makefile`

```makefile
# MySQL만
up-mysql:
	docker compose --profile mysql up -d

# Redis만
up-redis:
	docker compose --profile redis up -d

# RabbitMQ만
up-rabbitmq:
	docker compose --profile rabbitmq up -d

# MySQL + Redis
up-mysql-redis:
	docker compose --profile mysql --profile redis up -d

# MySQL + RabbitMQ
up-mysql-rabbitmq:
	docker compose --profile mysql --profile rabbitmq up -d

# 전체
up-full:
	docker compose --profile full up -d

# 전체 종료
down:
	docker compose down

# 전체 종료 + 볼륨 삭제 (initdb 재실행 필요 시 사용)
down-clean:
	docker compose down -v
```

---

## `.env.example`

```env
# MySQL root 계정 (컨테이너 초기화용)
MYSQL_ROOT_PASSWORD=root

# MySQL 메모리 제한 (RAM에 따라 조정: 128M / 256M / 512M)
MYSQL_BUFFER_POOL_SIZE=256M

# Redis 메모리 제한 (노트북 RAM에 따라 조정: 128mb / 256mb / 512mb)
REDIS_MAXMEMORY=256mb

# RabbitMQ 관리 계정
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin

# RabbitMQ 메모리 임계치 (시스템 RAM 비율, 초과 시 수신 차단)
# 노트북 기준 0.2 권장 (기본값 0.4)
RABBITMQ_MEMORY_WATERMARK=0.2

# 각 프로젝트 DB 계정은 해당 프로젝트 레포의 .env에서 관리
# initdb/01_create_databases.sql 의 비밀번호와 일치해야 합니다
```

> Redis는 기본 설정으로 인증 없이 사용. 필요 시 `requirepass` 옵션 추가.

---

## 각 프로젝트에서 연결하는 방법

각 프로젝트의 `docker-compose.yml`에서 external network를 참조합니다.

```yaml
# nestjs-prisma-blog/docker-compose.yml 예시
services:
  app:
    ...
    networks:
      - infra_default

networks:
  infra_default:
    external: true
```

`DATABASE_URL` 호스트는 `localhost`가 아닌 컨테이너명으로 지정합니다.

| 서비스   | 컨테이너명       | 접속 호스트      |
| -------- | ---------------- | ---------------- |
| MySQL    | `local-mysql`    | `local-mysql`    |
| Redis    | `local-redis`    | `local-redis`    |
| RabbitMQ | `local-rabbitmq` | `local-rabbitmq` |

각 프로젝트 `.env` 예시 (nestjs-prisma-blog):

```env
DATABASE_URL=mysql://blog_user:blog_password@local-mysql:3306/nestjs_prisma_blog
```

---

## DB / 계정 관리 전략

| 항목                   | 관리 위치                        | 내용                        |
| ---------------------- | -------------------------------- | --------------------------- |
| MySQL root 비밀번호    | `docker-local-infra/.env`        | 컨테이너 초기화용           |
| DB 생성                | `initdb/01_create_databases.sql` | 프로젝트별 DB 생성          |
| 프로젝트 계정 생성     | `initdb/01_create_databases.sql` | 프로젝트별 전용 계정 + 권한 |
| 프로젝트 계정 비밀번호 | 각 프로젝트 레포 `.env`          | initdb SQL과 일치해야 함    |

> 프로젝트를 추가할 때는 `initdb/01_create_databases.sql`에 블록을 추가하고
> `make down-clean && make up-mysql`로 MySQL을 재초기화합니다.

---

## 기동 순서

```bash
# 1. 이 레포 클론
git clone https://github.com/chjee/docker-local-infra.git
cd docker-local-infra

# 2. 환경변수 설정
cp .env.example .env
# .env에서 MYSQL_ROOT_PASSWORD 등 수정

# 3. 필요한 서비스 기동 (예: MySQL만)
make up-mysql

# 4. 각 프로젝트 앱 기동
cd ~/workspace/nestjs-prisma-blog
docker compose up --build
```

---

## 참고

- 인프라 컨테이너는 `restart: unless-stopped`로 Docker 재시작 시 자동으로 올라옴
- 볼륨은 컨테이너 종료 후에도 데이터 유지, `make down-clean`으로 초기화 가능
- `initdb` 스크립트는 **볼륨 최초 생성 시에만** 실행됨 — DB/계정 변경 시 반드시 `make down-clean` 후 재기동
- 새 인프라 서비스 추가 시 `docker-compose.yml`에 새 서비스 + profile 추가
- 새 프로젝트 DB 추가 시 `initdb/01_create_databases.sql`에 블록 추가 후 볼륨 재초기화
- Redis `maxmemory`는 `.env`의 `REDIS_MAXMEMORY`로 조정 가능 (기본 `256mb` / RAM 8GB이면 `128mb` 권장)
- MySQL `innodb_buffer_pool_size`는 `.env`의 `MYSQL_BUFFER_POOL_SIZE`로 조정 가능 (기본 `256M` / RAM 8GB이면 `128M` 권장)
- RabbitMQ 메모리 임계치는 `.env`의 `RABBITMQ_MEMORY_WATERMARK`로 조정 가능 (기본 `0.2`, 시스템 RAM의 20% 초과 시 수신 차단)
