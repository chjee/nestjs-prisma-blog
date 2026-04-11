# INFRA: nestjs-prisma-blog 공용 인프라 연동 계획

> 작성일: 2026-04-11
> 대상 브랜치: `chore/docker-infra-integration`
> 기준 인프라: `docker-local-infra`

---

## 목적

이 레포를 공용 로컬 인프라(`docker-local-infra`) 기준에 맞게 정렬합니다.

목표는 다음과 같습니다.

- 이 레포에서 MySQL 서비스를 제거
- NestJS 앱을 Docker 컨테이너로 실행
- 공용 네트워크 `infra_default`에 연결
- DB 접속을 `local-mysql` 기준으로 통일
- 공용 개발 계정 `devuser / devpass3992`를 사용

---

## 현재 상태

- 현재 `docker-compose.yml`은 MySQL만 포함하고 앱 컨테이너가 없습니다.
- 현재 `.env.example`은 호스트 실행 기준의 `localhost` DB URL을 사용합니다.
- 기존 Docker 문서(`INFRA_docker-setup.md`)는 일부 전제가 현재 기준 인프라 계약과 다릅니다.

---

## 변경 범위

수정 대상:

- `docker-compose.yml`
- `Dockerfile` 신설 여부 검토
- `.dockerignore` 신설 여부 검토
- `.env.example`
- 필요 시 실행 스크립트 또는 command
- 관련 문서

비수정 범위:

- 애플리케이션 비즈니스 로직
- Prisma 스키마 구조 자체
- JWT/로깅 등 앱 기능 정책

---

## 작업 단계

### 1. 현행 런타임 구조 확인

- 앱 실행 명령
- Prisma generate / migrate 흐름
- Dockerfile 존재 여부
- health endpoint 사용 가능 여부

### 2. 컨테이너 실행 방식 결정

후보:

- production-like 단일 앱 컨테이너
- 개발용 watch 컨테이너

우선순위:

- 먼저 확실히 뜨는 기준 경로 1개 확보
- 이후 필요하면 개발 편의 경로 추가

### 3. Compose 정리

- 레포 내부 MySQL 서비스 제거
- `app` 서비스 추가
- `infra_default` external network 연결
- 포트/환경변수/command 정리

### 4. 환경변수 정리

- `DATABASE_URL`을 `local-mysql` 기준으로 변경
- 공용 개발 계정 반영
- 컨테이너 실행에 필요한 필수 env 확인

### 5. 이미지 빌드 경로 정리

- `Dockerfile` 추가 또는 갱신
- Prisma client 생성 경로 확인
- 빌드 산출물 포함 여부 확인

### 6. 검증

- 이미지 빌드 성공
- 컨테이너 기동 성공
- DB 접속 성공
- 앱 health endpoint 확인

---

## 검증 항목

- `docker compose config` 정상
- `docker compose up --build` 정상
- 앱 컨테이너가 `infra_default`에 연결됨
- `DATABASE_URL=mysql://devuser:devpass3992@local-mysql:3306/blog_db` 기준 접속 가능
- Prisma 관련 startup 오류 없음
- `/health` 또는 동등한 헬스 엔드포인트 응답 확인

---

## 리스크

- 기존 문서와 실제 구현이 어긋날 수 있음
- Prisma 실행 시점이 image build / container startup 중 어디가 맞는지 조정이 필요할 수 있음
- 기존 migration 체인이 Linux MySQL에서 바로 적용되지 않을 수 있음
- 앱이 외부 인프라 기동 타이밍에 민감할 수 있음

---

## 브랜치 전략

현재 범위는 기능이 하나로 묶여 있으므로 브랜치 하나면 충분합니다.

- 작업 브랜치: `chore/docker-infra-integration`

중간에 별도 실험이 크게 갈라지지 않는 한 추가 브랜치는 만들지 않습니다.
