# FIX: 추가 개선사항

> 작성일: 2026-04-11
> 대상 브랜치: develop
> 기준 커밋: e051fea

---

## 권장 작업 방식

잔여 항목은 한 번에 처리하지 않고 목적별 브랜치로 나눠 순차 진행합니다.

권장 순서:

1. `fix/security-category-user-create`
   - `category.controller.ts` POST/PATCH/DELETE에 `@Roles('ADMIN')` 추가
   - `user.controller.ts` POST에 권한 제한 또는 role 강제 고정
   - `logger.middleware.ts` 요청 body 로깅 시 비밀번호 마스킹 적용

2. `fix/e2e-login-field`
   - `test/app.e2e-spec.ts` 로그인 요청 필드 `name` → `email` 수정
   - `signin-user.dto.ts` `@ApiProperty` minLength와 `@Length` 수치 통일

3. `feat/post-category-relation`
   - `create-post.dto.ts` / `update-post.dto.ts`에 `categoryIds?: number[]` 필드 추가
   - `post.service.ts` create/update 시 Category 관계 연결 로직 추가
   - 관련 테스트 작성

4. `feat/profile-api`
   - Profile 컨트롤러, 서비스, DTO 구현
   - 또는 User 업데이트 API에 profile 필드 통합

5. `chore/type-cleanup-strategy`
   - `jwt.strategy.ts` `payload: any` → `JwtPayload` 인터페이스 정의 후 적용
   - `local.strategy.ts` `Promise<any>` → `Promise<Omit<User, 'password'>>` 타입 지정

---

## 보안

- `fix` **`category.controller.ts` — 생성·수정·삭제에 권한 검증 없음**
  - POST/PATCH/DELETE 엔드포인트에 역할 기반 접근 제어가 전혀 없음
  - 인증된 모든 사용자가 카테고리를 생성·수정·삭제 가능
  - 수정: `@Roles('ADMIN')` 데코레이터를 POST, PATCH, DELETE 메서드에 추가

- `fix` **`user.controller.ts:59` — User 생성 시 role 임의 지정 가능**
  - 클라이언트가 `role: 'ADMIN'`을 직접 전달해 권한 상향 가능
  - 수정: `@Roles('ADMIN')`으로 생성 자체를 관리자 전용으로 제한하거나, 공개 가입 기능이라면 서비스 레이어에서 role을 `USER`로 강제 고정

- `fix` **`logger.middleware.ts:30` — 요청 body 전체 로깅 → 비밀번호 평문 노출**
  - `req.body`를 그대로 로깅해 로그인·회원가입 요청 시 비밀번호가 로그에 기록됨
  - `maskSensitiveData` 유틸이 이미 `src/common/logging/mask.util.ts`에 구현되어 있음
  - 수정: `body: maskSensitiveData(req.body)` 적용

---

## 버그

- `fix` **`test/app.e2e-spec.ts:56` — 로그인 요청 필드 오류**
  - `LocalStrategy`는 `email`을 기대하지만 테스트에서 `name`으로 전송 중
  - 수정: 요청 필드를 `name` → `email`로 수정

- `fix` **`src/auth/dto/signin-user.dto.ts:13` — 문서와 검증 수치 불일치**
  - `@ApiProperty({ minLength: 5, maxLength: 20 })`이지만 `@Length(6, 60)` 검증 적용
  - 수정: `@ApiProperty`와 `@Length` 수치 통일

---

## 기능 누락

- `feat` **Post 생성·수정 시 Category 연결 API 없음**
  - Prisma 스키마에 Post↔Category 다대다 관계가 정의되어 있으나
  - `CreatePostDto` / `UpdatePostDto`에 `categoryIds` 필드가 없어 Post 생성 시 카테고리 지정 불가
  - 수정: DTO에 `categoryIds?: number[]` 추가, `post.service.ts` create/update에 `categories: { connect: [...] }` 연결 로직 추가

- `feat` **Profile 관리 API 없음**
  - Prisma 스키마에 `Profile` 모델이 있고 User와 1:1 관계가 정의되어 있으나
  - Profile 컨트롤러·서비스·DTO가 전혀 구현되지 않음
  - 수정: Profile CRUD API 구현 또는 User 업데이트 DTO에 profile 필드 통합

- `feat` **목록 API에 검색 필터·정렬 없음**
  - User/Post/Category 목록 조회 시 검색 필터, 정렬 파라미터 미지원
  - 수정: `search`, `orderBy` 쿼리 파라미터 추가 (Post: title/content, User: email/name, Category: name 기준)

---

## 코드 품질

- `chore` **`jwt.strategy.ts:16` — `payload: any` 타입**
  - `validate(payload: any)` 메서드 파라미터 및 반환값이 `any` 타입
  - 수정: `JwtPayload` 인터페이스(`{ sub: number; name: string; role: Role }`) 정의 후 적용

- `chore` **`local.strategy.ts:13` — `Promise<any>` 반환 타입**
  - `validate()` 반환 타입이 `any`
  - 수정: `Promise<Omit<User, 'password'>>` 타입 지정
