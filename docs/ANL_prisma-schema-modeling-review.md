# Prisma schema 모델링 개선 분석

> 작성일: 2026-04-12
> 기준 브랜치: `develop`
> 분석 대상: `prisma/schema.prisma`

## 목적

현재 `nestjs-prisma-blog`의 Prisma 스키마를 모델링 관점에서 검토하고,
운영 안정성·도메인 일관성·확장성 측면의 개선 포인트를 정리한다.

---

## 현재 스키마 요약

현재 모델은 다음 4개로 구성되어 있다.

- `User`
- `Profile`
- `Post`
- `Category`

관계 구조는 다음과 같다.

- `User 1:N Post`
- `User 1:1 Profile`
- `Post N:M Category`

현재 스키마:

- `User.email` unique
- `Profile.userId` unique
- `Post`에 `createdAt`, `updatedAt`
- `Post` 인덱스:
  - `@@index([userId])`
  - `@@index([published, createdAt])`

---

## 총평

현재 스키마는 학습용/소규모 CRUD 수준에서는 충분히 단순하고 이해하기 쉽다.
하지만 실제 운영이나 기능 확장을 고려하면,
아래 항목들은 우선적으로 정리하는 것이 좋다.

핵심 이슈는 크게 다섯 가지다.

1. **API validation과 DB 제약의 불일치**
2. **도메인 식별자/중복 방지 정책 부족**
3. **삭제 정책 및 장기 확장 전략 미정**
4. **보안/권한 확장을 고려한 필드 설계 여지**
5. **스키마와 맞물린 DTO/서비스 레이어 버그 존재**

---

## 우선 개선 권장 사항

### 1. `Profile.bio` 길이 제약 불일치 — 현재 버그로 보는 것이 맞음

#### 현재 상태

- DTO: `bio` 최대 500자 허용
- DB: 현재 migration 기준 `VARCHAR(191)` 수준
- schema: `bio String` 으로만 표현됨

#### 문제

애플리케이션 레벨에서는 저장 가능한 값처럼 보이지만,
실제 DB 저장 시 길이 초과 문제가 발생할 수 있다.

이 항목은 단순 개선 권장이 아니라,
**현재 API 허용 범위와 DB 저장 가능 범위가 어긋난 버그**에 가깝다.

#### 권장안

둘 중 하나로 명시한다.

- `bio String @db.VarChar(500)`
- 또는 `bio String @db.Text`

#### 권장 판단

- 프로필 소개글이 짧은 텍스트라면 `VarChar(500)`
- 자유로운 소개/긴 텍스트 가능성을 열어둘 거면 `Text`

---

### 2. `Category.name` 유니크 제약 부재

#### 현재 상태

- `Category.name String`
- unique 없음

#### 문제

동일 이름 카테고리가 중복 생성될 수 있다.
예:

- `Backend`
- `Backend`

이 경우 분류 체계가 무너지고,
카테고리 기반 필터/운영 관리가 불편해진다.

#### 권장안

최소:

```prisma
model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique @db.VarChar(60)
  posts Post[]
}
```

장기적으로는:

```prisma
model Category {
  id    Int    @id @default(autoincrement())
  name  String @db.VarChar(60)
  slug  String @unique @db.VarChar(80)
  posts Post[]
}
```

#### 권장 판단

- 지금 단계: `name @unique`만 추가해도 충분히 의미 있음
- 확장 단계: `slug` 분리 추천

---

### 3. `User` 삭제 정책 명시 필요

#### 현재 상태

migration 기준 FK 정책:

- `Post.userId -> User.id` : `ON DELETE RESTRICT`
- `Profile.userId -> User.id` : `ON DELETE RESTRICT`

앱에는 `DELETE /user/:id`가 존재한다.

#### 문제

프로필/게시글이 있는 유저 삭제 시,
도메인 정책이 불분명한 상태에서 DB 레벨 제한만 걸려 있다.

즉, 다음 중 어떤 정책인지 스키마만 봐서는 드러나지 않는다.

- 유저 삭제 금지
- 게시글 보존 + soft delete
- 게시글까지 cascade delete
- 프로필만 cascade delete

#### 권장안

정책을 명시적으로 결정한다.

추천 방향:

- `Profile`은 `onDelete: Cascade`
- `Post`는 운영 정책에 따라 명시
  - 데이터 보존 중시: `deletedAt` soft delete 도입
  - 완전 삭제 허용: cascade 또는 사전 삭제 처리

예:

```prisma
model Profile {
  id        Int      @id @default(autoincrement())
  bio       String   @db.VarChar(500)
  userId    Int      @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### 4. `Post.userId` FK 삭제 정책도 별도 명시 필요

#### 현재 상태

`Post.userId`도 현재는 `onDelete`를 명시하지 않아,
migration 결과상 `RESTRICT` 성격으로 동작한다.

#### 문제

문서상으로 `User` 삭제 정책을 말할 때 보통 `Profile`만 떠올리기 쉽지만,
실제 운영 영향은 `Post`가 더 크다.

즉 다음 중 무엇을 원칙으로 삼는지 스키마에서 드러나야 한다.

- 유저 삭제 시 게시글 유지 불가
- 유저 삭제 시 게시글까지 연쇄 삭제
- 유저는 soft delete, 게시글은 보존
- 작성자 null 허용 후 익명화 처리

#### 권장안

`Profile`과 `Post`를 분리해서 정책화한다.

- `Profile`: 대체로 cascade가 자연스러움
- `Post`: 서비스 정책이 반영되어야 함
  - 콘텐츠 자산 보존형 서비스라면 soft delete 권장
  - 개인 블로그 성격으로 완전 삭제 허용이면 cascade 검토 가능

---

## 스키마와 맞물린 인접 레이어 버그

이 문서는 Prisma schema 중심 분석이지만,
실제 코드와 DTO까지 교차 확인하면 스키마와 직접 연결되는 치명적 이슈가 더 보인다.

### P0. 로그인 불가 버그 — password 길이 규칙 불일치

#### 현재 상태

- `CreateUserDto.password`: `@Length(6, 60)`
- `SignInUserDto.password`: `@Length(5, 12)`

#### 문제

13~60자 비밀번호로 회원가입한 사용자는
로그인 시 validation 단계에서 막혀 **영구적으로 로그인할 수 없다**.

즉:

- `POST /user` 는 성공 가능
- `POST /auth/login` 은 `400 Bad Request`

#### 권장안

- 로그인 DTO를 회원가입 DTO와 동일한 범위로 맞춘다
- 더 나아가 비밀번호 정책은 DTO/문서/테스트에서 단일 기준으로 관리한다

---

### P1. `User` 삭제 실패 시 raw Prisma 에러가 그대로 노출됨

#### 현재 상태

`UserService.remove()` 는 단순히 `prisma.user.delete()`를 호출한다.

현재 FK 정책상 `Post`/`Profile`이 남아 있으면 삭제 시도는 실패할 수 있는데,
서비스 레이어에서 `P2003` 같은 Prisma FK 에러를 잡아 도메인 에러로 바꾸지 않는다.

#### 문제

이 경우 API 관점에서는 사실상 정책 충돌인데,
실제 응답은 내부 구현 에러에 가까운 500 계열로 흐를 가능성이 있다.

즉, 스키마 정책 미정 + 서비스 에러 처리 미흡이 동시에 존재한다.

#### 권장안

- 삭제 정책을 먼저 결정하고
- `PrismaClientKnownRequestError`의 FK 제약 위반(`P2003`)을
  `409 Conflict` 또는 `400 Bad Request` 같은 명시적 API 에러로 변환한다

---

### P1. `POST /post`가 작성자 식별을 body의 `userId`에 의존함

#### 현재 상태

- `CreatePostDto`에 `userId`가 필수
- `PostController.create()`는 JWT의 `sub`를 사용하지 않고 body를 그대로 서비스에 전달

#### 문제

인증된 사용자가 임의의 `userId`를 넣어
다른 사용자 명의의 게시글을 생성할 수 있다.

이건 순수 스키마 문제는 아니지만,
`Post.userId` 관계를 어떻게 신뢰할 것인가와 직접 연결되는 **권한/데이터 정합성 문제**다.

#### 권장안

- `CreatePostDto`에서 `userId`를 제거
- 작성자 ID는 인증 컨텍스트(`@User('sub')`)에서 강제 주입
- `Post.userId`는 클라이언트 입력이 아니라 서버가 결정하는 필드로 취급

---

## 중기 개선 권장 사항

### 5. 감사용 timestamp 보강

#### 현재 상태

- `Post`: `createdAt`, `updatedAt` 있음
- `User`: `createdAt`만 있음
- `Profile`: 없음
- `Category`: 없음

#### 문제

운영/디버깅/관리 기능에서는 수정 시점 추적이 중요하다.

#### 권장안

- `User.updatedAt`
- `Profile.createdAt`, `Profile.updatedAt`
- `Category.createdAt`, `Category.updatedAt`

예:

```prisma
model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique @db.VarChar(60)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}
```

---

### 6. 문자열 길이 제약을 schema에도 명시

#### 현재 상태

DTO에는 길이 제한이 있으나,
Prisma schema에는 일부만 명시되어 있다.

예:

- `Category.name`: DTO 최대 60, DB는 사실상 더 큼
- `Post.title`: DTO 최대 60, DB는 사실상 더 큼
- `Profile.bio`: DTO 500, DB는 191 수준 가능

#### 문제

- API validation
- DB 저장 규칙
- 스키마 문서성

이 세 층이 서로 어긋난다.

#### 권장안

주요 문자열 필드는 schema에도 길이를 명시한다.

예:

- `Category.name @db.VarChar(60)`
- `Post.title @db.VarChar(60)`
- `Profile.bio @db.VarChar(500)` 또는 `@db.Text`

#### 중요도 구분

이 항목은 모두 같은 심각도는 아니다.

- `Profile.bio`는 **현재 저장 실패를 일으킬 수 있는 실제 버그**
- `Category.name` / `Post.title`은 현재 DB가 DTO보다 더 넓게 허용하므로
  즉시 장애를 만들 가능성은 낮고, 주로 정합성/문서성 문제에 가깝다

#### 추가 확인 사항 — email 길이 정책도 어긋나 있음

`User.email`은 migration에서 60 → 80으로 확장됐지만,
현재 `CreateUserDto` / `SignInUserDto`는 여전히 최대 60자로 제한하고 있다.

이 경우는 `Profile.bio`와 반대로:

- DB는 더 넓게 허용
- API는 더 좁게 제한

즉시 데이터 손실을 만들지는 않지만,
스키마/DTO/실제 저장 가능 범위가 다르다는 점에서 정합성 이슈로 남는다.

---

## 장기 확장 관점 개선 사항

### 7. `password` 저장 필드 길이는 더 여유 있게 잡는 것이 안전

#### 현재 상태

```prisma
password String @db.VarChar(60)
```

#### 문제

현재 bcrypt 해시는 60자라 동작하지만,
앞으로 argon2 등 다른 해시 알고리즘으로 전환하면 길이가 더 길어질 수 있다.

즉 지금 길이는 **현재 구현에는 맞지만 미래 변경에는 취약한 설계**다.

#### 권장안

최소 다음 정도로 여유를 두는 것이 안전하다.

```prisma
password String @db.VarChar(255)
```

#### 판단

- bcrypt만 계속 쓴다는 보장이 없으면 조정 추천
- 인증 체계 확장 가능성을 고려하면 미리 넉넉하게 잡는 편이 낫다

#### 추가 확인 사항

현재 `password` 저장 필드 자체와 별개로,
로그인 DTO의 비밀번호 허용 길이가 회원가입 DTO와 다르므로
필드 길이 조정보다 먼저 DTO 정책 불일치를 수정해야 한다.

---

### 8. `Post.published Boolean` → 상태 모델 확장 검토

#### 현재 상태

```prisma
published Boolean @default(false)
```

#### 문제

기능이 조금만 늘어나도 다음 상태가 필요해질 수 있다.

- draft
- published
- archived
- scheduled

Boolean만으로는 표현이 어렵다.

#### 권장안

장기적으로는 다음 구조 검토:

```prisma
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Post {
  status      PostStatus @default(DRAFT)
  publishedAt DateTime?
}
```

#### 판단

- 지금 당장은 유지 가능
- 발행 예약/보관 기능이 생기면 바로 전환 검토

---

### 9. `User.role` enum은 현재 단순하지만 확장 비용이 있음

#### 현재 상태

```prisma
enum Role {
  USER
  ADMIN
}
```

#### 장점

- 현재 요구사항에는 단순하고 충분하다
- RBAC 초기 단계 구현이 빠르다

#### 한계

역할이 조금만 늘어나도 enum 변경 + migration이 필요하다.

예:

- EDITOR
- MODERATOR
- STAFF

#### 권장안

지금 당장 바꿀 필요는 없지만,
장기적으로는 아래 중 하나를 고려할 수 있다.

- enum 유지 + 역할 추가 시 migration 감수
- `Permission` / `UserRole` 구조로 세분화
- 조직/테넌트 단위 권한이 필요하면 별도 권한 모델 도입

#### 판단

- 현재 단계: enum 유지 가능
- 운영 인력/콘텐츠 역할이 늘어나기 시작하면 구조 분리 검토

---

### 10. `Post`-`Category` 관계를 explicit join table로 전환 검토

#### 현재 상태

현재는 implicit many-to-many 관계다.

#### 장점

- 단순함
- 현재 요구사항엔 충분함

#### 한계

다음 정보가 필요해지면 구조 변경이 필요하다.

- 카테고리 정렬 순서
- 대표 카테고리 여부
- 연결 생성 시점
- 연결한 사용자/관리자

#### 권장안

향후 메타데이터가 필요하면 `PostCategory` 조인 모델을 명시적으로 도입한다.

예:

```prisma
model PostCategory {
  postId     Int
  categoryId Int
  createdAt  DateTime @default(now())

  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([postId, categoryId])
  @@index([categoryId])
}
```

---

## 인덱스 관점 평가

### 현재 인덱스

```prisma
@@index([userId])
@@index([published, createdAt])
```

### 평가

현재 목록 조회 기준으로는 합리적이다.

- 사용자별 게시글 조회 대응 가능
- 발행 여부 + 생성일 정렬 대응 가능

### 추가 검토 포인트

앞으로 아래 기능이 생기면 재검토가 필요하다.

- 제목/내용 검색
- 카테고리별 게시글 목록 최적화
- 최신글/인기글 정렬 다양화

즉, **지금은 충분하지만 검색 기능 추가 시 인덱스 재설계 필요**.

---

## 우선순위 제안

### P0 — 즉시 수정 권장

1. `CreateUserDto.password` 와 `SignInUserDto.password` 길이 규칙 불일치 해소

### P1 — 바로 손보는 것을 추천

1. `Profile.bio` 길이/타입 불일치 수정
2. `Category.name` unique 또는 slug 전략 도입
3. `User`/`Post`/`Profile` 삭제 정책 명시
4. `POST /post`에서 클라이언트 제공 `userId` 제거
5. `User` 삭제 시 FK 제약 위반 에러를 명시적 API 에러로 변환

### P2 — 다음 정리 주기에 추천

6. `User/Profile/Category` timestamp 보강
7. 주요 문자열 필드 길이 제약을 schema에 명시
8. `email` 길이 정책도 DTO와 schema/migration 기준으로 다시 정렬
9. `password` 필드 길이를 255 수준으로 확장

### P3 — 기능 확장 시 검토

10. `published` → `status + publishedAt`
11. `User.role` 권한 모델 확장 전략 검토
12. implicit many-to-many → explicit join table

---

## 추천 결론

현재 스키마는 작은 프로젝트 기준으로는 충분히 깔끔하지만,
운영 관점에서는 최소 아래 항목들을 먼저 반영하는 것이 좋다.

- 로그인 DTO/회원가입 DTO의 비밀번호 정책 불일치 해소
- `Profile.bio` 저장 규칙 정합성 확보
- `Category` 중복 방지 전략 도입
- `User`/`Post`/`Profile` 삭제 정책 명시
- `POST /post` 작성자 위변조 가능성 제거
- `password` 필드 길이 여유 확보

특히 `Profile.bio`는 개선 아이디어가 아니라
**현재 버그로 간주하고 우선 수정해야 하는 항목**이다.

또한 로그인 DTO 불일치와 게시글 작성자 위변조 문제는
스키마와 맞물린 **실제 기능 버그/보안 이슈**로 봐야 한다.

이 항목들은 단순한 미관 개선이 아니라,
실제 장애/운영 혼선/데이터 정합성 이슈를 줄이는 방향의 개선이다.
