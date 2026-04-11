# TODO: 잔여 개선사항

> 작성일: 2026-04-10
> 대상 브랜치: develop
> 기준 커밋: bd7a369

---

## 권장 작업 방식

잔여 항목은 한 번에 처리하지 않고 목적별 브랜치로 나눠 순차 진행합니다.

권장 순서:

1. `fix/user-pagination-password-cache`
   - `user.controller.ts`의 `DefaultValuePipe` 누락 수정
   - `user.service.ts` 비밀번호 업데이트 시 bcrypt 재해시 적용
   - `cache.interceptor.ts` 제거 또는 안전한 비활성화

2. `fix/authz-roles-ownership`
   - `RolesGuard`를 앱에 실제 등록
   - 게시글/사용자 수정·삭제 시 소유자 검증 추가

3. `test/service-spec-hardening`
   - 서비스 메서드 self-mock 제거
   - `PrismaService` mock 기반 테스트로 전환
   - `NotFoundException` 등 에러 케이스 테스트 추가

4. `feat/category-crud`
   - `Category` 컨트롤러, 서비스, DTO 구현

5. `feat/pagination-total-count`
   - 목록 응답에 `total` 또는 `X-Total-Count` 추가

6. `chore/code-cleanup-auth-post-user`
   - 주석 처리된 코드 제거
   - `auth.service.ts`의 `user: any` 타입 정리

브랜치를 나누는 이유:

- 버그 수정, 보안, 테스트, 기능 추가, 코드 정리를 분리하면 리뷰가 쉬움
- 권한/소유자 검증처럼 동작 영향이 큰 변경을 독립적으로 검토 가능
- 중간에 문제 생겨도 브랜치 단위로 되돌리기 쉬움
- 테스트 강화 후 기능 추가로 넘어가면 이후 변경의 안정성이 높아짐

---

## 버그

- `fix` **`user.controller.ts:74` — `findAll` DefaultValuePipe 누락**
  - `post.controller.ts`는 PR #6에서 수정됐지만 `user.controller.ts`는 빠짐
  - `skip`/`take` 없이 호출하면 `ParseIntPipe`가 400 에러 반환
  - 수정: `@Query('skip', new DefaultValuePipe(0), ParseIntPipe)` 적용

- `fix` **`user.service.ts:78` — 비밀번호 업데이트 시 bcrypt 미적용**
  - `create()`에서는 bcrypt 해시하지만 `update()`에서는 평문 그대로 저장
  - 수정: `update()` 내 `data.password` 존재 시 재해시 처리 필요

- `fix` **`common/interceptors/cache.interceptor.ts` — `isCached = true` 하드코딩**
  - 항상 빈 배열 `[]`을 반환하는 미완성 코드
  - 실제로 등록해서 사용하면 모든 응답이 깨짐
  - 수정: 실제 캐시 로직 구현 또는 파일 제거

---

## 보안

- `fix` **`RolesGuard`가 `app.module.ts`에 등록되지 않음**
  - `roles.decorator.ts`, `roles.guard.ts` 모두 구현되어 있지만 앱에 연결되지 않음
  - `@Roles()` 데코레이터를 붙여도 실제로 권한 검사가 동작하지 않음
  - 수정: `app.module.ts` providers에 `{ provide: APP_GUARD, useClass: RolesGuard }` 추가

- `feat` **소유자 검증 없음**
  - 로그인한 사용자가 타인의 게시글·계정을 수정·삭제 가능
  - 수정: `@User()` 데코레이터로 JWT payload의 `sub`를 꺼내 대상 리소스 소유자와 비교

---

## 테스트

- `chore` **서비스 스펙 테스트가 서비스 메서드 자체를 mock**
  - `jest.spyOn(service, 'create').mockImplementation(...)` 구조라 실제 로직을 전혀 검증하지 않음
  - 수정: PrismaService를 mock하고 실제 서비스 메서드 실행으로 전환

- `chore` **에러 케이스 테스트 없음**
  - `NotFoundException`, 유효성 검증 실패 등 에러 분기 테스트 미작성
  - 대상: `post.service.spec.ts`, `user.service.spec.ts`

---

## 기능 누락

- `feat` **Category CRUD API 없음**
  - Prisma 스키마에 `Category` 모델이 있지만 컨트롤러·서비스·DTO 미구현

- `feat` **페이지네이션 total count 없음**
  - 현재 목록 API가 데이터 배열만 반환
  - 클라이언트가 전체 페이지 수를 계산할 수 없음
  - 수정: `{ data: [], total: number }` 형태로 응답 구조 변경 또는 `X-Total-Count` 헤더 추가

---

## 코드 정리

- `chore` **주석 처리된 코드 잔존**
  - `user.service.ts:60–67` — 이전 `findOne` 구현체
  - `auth.service.ts:4` — 사용하지 않는 import
  - `post.controller.ts:90–91` — `where`, `orderBy` 주석

- `chore` **`auth.service.ts:30` — `user: any` 타입**
  - `login(user: any)` 메서드의 파라미터 타입 미지정
  - 수정: JWT payload 인터페이스 정의 후 적용
