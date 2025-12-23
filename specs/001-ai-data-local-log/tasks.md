# Tasks: AI 생성 데이터 로컬 기록

**Input**: Design documents from `/specs/001-ai-data-local-log/`
**Prerequisites**: plan.md ✓, spec.md ✓, data-model.md ✓, quickstart.md ✓

**Tests**: 수동 테스트 (기존 프로젝트 패턴) - 자동화된 테스트 태스크 없음

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project structure**: 기존 React SPA (`src/` at repository root)
- Paths shown below are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 타입 정의 및 서비스 파일 생성

- [x] T001 [P] Add SavedSession and StorageData types to src/types/question.ts
- [x] T002 [P] Create sessionStorage service file at src/services/sessionStorage.ts with empty exports

---

## Phase 2: Foundational (Core Storage Logic)

**Purpose**: localStorage 핵심 로직 구현 - 모든 User Story의 기반

**⚠️ CRITICAL**: 이 단계가 완료되어야 User Story 구현 가능

- [x] T003 Implement loadStorageData() function in src/services/sessionStorage.ts (version check, JSON parse)
- [x] T004 Implement saveSession() function in src/services/sessionStorage.ts (FIFO logic, max 2 sessions)
- [x] T005 Implement getSessions() function in src/services/sessionStorage.ts
- [x] T006 Implement deleteSession() and deleteAllSessions() functions in src/services/sessionStorage.ts

**Checkpoint**: 기본 저장/불러오기/삭제 로직 완료 - User Story 구현 가능

---

## Phase 3: User Story 1 - AI 생성 결과 자동 저장 (Priority: P1) 🎯 MVP

**Goal**: AI 해설 생성 완료 시 자동으로 localStorage에 저장

**Independent Test**: 문제 해설 생성 후 브라우저 새로고침 → 개발 도구에서 `jeje-bookmaker-sessions` 키 확인

### Implementation for User Story 1

- [x] T007 [US1] Add session save trigger after AI explanation generation in src/App.tsx (generateExplanations 완료 후)
- [x] T008 [US1] Create SavedSession object from current state (questionList, questionExplanations Map→Array, vocabularyList) in src/App.tsx
- [x] T009 [US1] Add error handling for storage quota exceeded with toast notification in src/App.tsx
- [x] T010 [US1] Add vocabulary generation save trigger after generateVocaPreview completion in src/App.tsx

**Checkpoint**: AI 해설/단어장 생성 시 자동 저장 완료 - 브라우저 개발 도구에서 확인 가능

---

## Phase 4: User Story 2 - 저장된 데이터 불러오기 (Priority: P2)

**Goal**: 사용자가 저장된 세션을 선택하여 앱 상태 복원

**Independent Test**: 저장된 세션 선택 → 문제 목록과 해설이 화면에 표시

### Implementation for User Story 2

- [x] T011 [P] [US2] Create SessionManager component at src/components/SessionManager.tsx (기본 구조)
- [x] T012 [US2] Implement session list display in SessionManager.tsx (getSessions 호출, 날짜/문제 수 표시)
- [x] T013 [US2] Add loadSession callback prop and implement in src/App.tsx (Array→Map 변환, 상태 복원)
- [x] T014 [US2] Integrate SessionManager into App.tsx layout (불러오기 버튼/패널)
- [x] T015 [US2] Add loading state and error handling for session restore

**Checkpoint**: 저장된 세션 목록 조회 및 불러오기 완료 - PDF 생성까지 정상 동작

---

## Phase 5: User Story 3 - 저장된 데이터 관리 (Priority: P3)

**Goal**: 사용자가 개별 또는 전체 세션 삭제 가능

**Independent Test**: 세션 삭제 → 목록에서 사라짐, 새로고침 후에도 삭제 유지

### Implementation for User Story 3

- [x] T016 [US3] Add delete button per session in SessionManager.tsx (deleteSession 호출)
- [x] T017 [US3] Add "모두 삭제" button in SessionManager.tsx (deleteAllSessions 호출)
- [x] T018 [US3] Add confirmation dialog before delete actions (기존 ui 컴포넌트 활용)
- [x] T019 [US3] Refresh session list after delete operations

**Checkpoint**: 세션 삭제 기능 완료 - 개별/전체 삭제 동작

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 마무리 및 UX 개선

- [x] T020 Add session count indicator in App.tsx header (현재 저장된 세션 수 표시) - SessionManager에 (N/2) 형식으로 표시
- [x] T021 Test FIFO behavior: 3번째 세션 저장 시 첫 번째 자동 삭제 확인 - sessionStorage.ts에 구현됨
- [x] T022 Run quickstart.md validation checklist - 모든 파일 체크리스트 확인 완료
- [x] T023 Build verification: npm run build 성공 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P3)
  - P1 (자동 저장)이 없으면 P2/P3 테스트 불가
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 완료 후 시작 - 다른 스토리에 의존 없음
- **User Story 2 (P2)**: Foundational 완료 후 시작 - US1 완료 후 테스트 가능 (저장된 데이터 필요)
- **User Story 3 (P3)**: Foundational 완료 후 시작 - US2와 동시에 개발 가능

### Within Each User Story

1. 서비스 로직 before UI 통합
2. 기본 기능 before 에러 처리
3. 핵심 구현 before 부가 기능

### Parallel Opportunities

- T001, T002: 타입과 서비스 파일 동시 생성 가능
- T011: SessionManager 컴포넌트는 US1 완료 전에 구조 생성 가능

---

## Parallel Example: Phase 1 Setup

```bash
# Launch both setup tasks together:
Task: "Add SavedSession and StorageData types to src/types/question.ts"
Task: "Create sessionStorage service file at src/services/sessionStorage.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006)
3. Complete Phase 3: User Story 1 (T007-T010)
4. **STOP and VALIDATE**: 브라우저 개발 도구에서 저장 확인
5. 이 시점에서 자동 저장 기능만으로도 가치 제공

### Incremental Delivery

1. Setup + Foundational → 저장 로직 준비
2. Add User Story 1 → 자동 저장 동작 (MVP!)
3. Add User Story 2 → 불러오기 UI 추가
4. Add User Story 3 → 삭제 기능 추가
5. Polish → 마무리

### Estimated Task Distribution

- **Phase 1 (Setup)**: 2 tasks
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (US1)**: 4 tasks
- **Phase 4 (US2)**: 5 tasks
- **Phase 5 (US3)**: 4 tasks
- **Phase 6 (Polish)**: 4 tasks

**Total**: 23 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 수동 테스트: 브라우저 개발 도구 Application > localStorage 확인
- Commit after each task or logical group
- 기존 앱의 토스트 알림 패턴 재사용
- Map ↔ Array 변환 주의 (questionExplanations)
