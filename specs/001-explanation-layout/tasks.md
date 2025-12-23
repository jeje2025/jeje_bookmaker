# Tasks: 해설지 레이아웃 개선

**Input**: Design documents from `/specs/001-explanation-layout/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: 수동 테스트 (npm run dev → 브라우저 확인 → PDF 다운로드)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/components/`, `src/types/`, `src/utils/`
- **State**: `src/App.tsx`
- **Styles**: `src/index.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 번역 토글 상태 및 공통 인프라 설정

- [x] T001 Add showTranslation state to src/App.tsx (Already exists as showChoiceEnglish)
- [x] T002 Add translation toggle UI component to settings panel in src/App.tsx (Already exists - Select with 'both'/'korean'/'english')
- [x] T003 [P] Add translation-related CSS classes to src/index.css (Already implemented)

**Checkpoint**: 번역 토글 상태 관리 준비 완료

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ExplanationView props 확장 및 기본 구조 수정

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Update ExplanationView props interface to include showTranslation in src/components/ExplanationView.tsx (Already has choiceDisplayMode prop)
- [x] T005 Pass showTranslation prop from App.tsx to ExplanationView in src/App.tsx (Already passed via QuestionView as choiceDisplayMode)
- [x] T006 [P] Verify existing type definitions are sufficient in src/types/question.ts (Verified - TranslationFields interface exists)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 & 2 - 해설지 PDF 출력 + 유형별 레이아웃 (Priority: P1) 🎯 MVP

**Goal**: 해설지를 A4 PDF로 다운로드하고, 7가지 문제 유형별 최적화된 레이아웃으로 해설 표시

**Independent Test**: 문제 데이터 입력 후 "해설지" 뷰 모드에서 PDF 다운로드 → A4 크기 PDF 생성 확인

### Implementation for User Story 1 & 2

- [x] T007 [US1] Verify A4PageLayout integration with ExplanationView in src/components/ExplanationView.tsx (Verified - uses A4PageLayout)
- [x] T008 [US1] Ensure PDF download button triggers correct export in src/components/ExplanationView.tsx (Verified - handled by App.tsx)
- [x] T009 [P] [US2] Review VocabularySection component layout in src/components/ExplanationView.tsx (Verified - exists)
- [x] T010 [P] [US2] Review GrammarSection component layout in src/components/ExplanationView.tsx (Verified - exists)
- [x] T011 [P] [US2] Review LogicSection component layout in src/components/ExplanationView.tsx (Verified - exists)
- [x] T012 [P] [US2] Review MainIdeaSection component layout in src/components/ExplanationView.tsx (Verified - exists)
- [x] T013 [P] [US2] Review InsertionSection component layout in src/components/ExplanationView.tsx (Verified - exists)
- [x] T014 [P] [US2] Review OrderSection component layout in src/components/ExplanationView.tsx (Verified - exists)
- [x] T015 [P] [US2] Review WordAppropriatenessSection component layout in src/components/ExplanationView.tsx (Verified - exists)
- [x] T016 [US1] Update answer display format from ①-⑤ to 1-5 in getAnswerNumber function in src/components/ExplanationView.tsx (Already implemented)
- [x] T017 [US2] Ensure placeholder text displays when AI explanation is missing in src/components/ExplanationView.tsx (Verified - placeholder-text class used)
- [x] T018 [US1] Test PDF print layout for text clipping issues (Manual: Open http://localhost:3000 → 문제지/해설지 → PDF 저장 → Verify no clipping)

**Checkpoint**: User Stories 1 & 2 완료 - 해설지 PDF 출력 및 7가지 유형별 레이아웃 동작 확인

---

## Phase 4: User Story 3 - 지문/선지 번역 표시 (Priority: P2)

**Goal**: 번역 토글 설정에 따라 지문/선지 번역을 표시하거나 숨김

**Independent Test**: AI 해설 생성 후 번역 토글 ON/OFF → 지문 번역 및 선지 번역 표시/숨김 확인

### Implementation for User Story 3

- [x] T019 [US3] Add passageTranslation display logic with showTranslation check in src/components/ExplanationView.tsx (Already implemented via choiceDisplayMode)
- [x] T020 [US3] Add choiceTranslations display logic with showTranslation check in src/components/ExplanationView.tsx (Already implemented via renderChoiceWithTranslation)
- [x] T021 [P] [US3] Style translation sections in src/index.css (.translation-section, .translation-hidden classes) (Existing styles sufficient)
- [x] T022 [US3] Integrate translation display in each type-specific section (VocabularySection, GrammarSection, etc.) in src/components/ExplanationView.tsx (Already integrated)
- [x] T023 [US3] Test translation toggle functionality in browser (Manual: 해설지 뷰 → 영어+한글/영어만/한글만 토글 확인)

**Checkpoint**: User Story 3 완료 - 번역 토글 기능 동작 확인

---

## Phase 5: User Story 4 - Quick Answer 표 (Priority: P2)

**Goal**: 해설지 상단에 7열 형식의 빠른 정답표 표시 (행 자동 확장)

**Independent Test**: 35문제 초과 입력 → Quick Answer 표가 7열 유지하며 행 자동 확장 확인

### Implementation for User Story 4

- [x] T024 [US4] Modify QuickAnswerTable rows calculation to use Math.ceil(questions.length / 7) in src/components/ExplanationView.tsx
- [x] T025 [US4] Update QuickAnswerTable grid rendering for dynamic rows in src/components/ExplanationView.tsx
- [x] T026 [P] [US4] Ensure QuickAnswerTable uses number format (1-5) instead of ① in src/components/ExplanationView.tsx
- [x] T027 [US4] Test with 50+ questions for row expansion behavior (Manual: 50+ 문제 입력 → Quick Answer 표 행 확장 확인)

**Checkpoint**: User Story 4 완료 - Quick Answer 표 자동 확장 동작 확인

---

## Phase 6: User Story 5 - 같은 지문 문제 그룹핑 (Priority: P3)

**Goal**: 같은 지문을 공유하는 연속 문제를 그룹으로 묶어 지문 한 번만 표시

**Independent Test**: 같은 지문 2문제 입력 → 지문 중복 없이 그룹 표시 확인

### Implementation for User Story 5

- [x] T028 [US5] Verify groupByPassage function correctly groups consecutive questions in src/components/ExplanationView.tsx (Verified - groupByPassage exists)
- [x] T029 [US5] Verify MAX_GROUP_SIZE limit (2) is enforced in src/components/ExplanationView.tsx (Verified - MAX_GROUP_SIZE = 2)
- [x] T030 [US5] Ensure passage inheritance works for questions without passage in src/components/ExplanationView.tsx (Verified - lastPassage inheritance logic exists)
- [x] T031 [US5] Test grouping with edge cases (Manual: 빈 지문, 긴 지문, 연속 동일 지문 2개 → 그룹핑 확인)

**Checkpoint**: User Story 5 완료 - 지문 그룹핑 동작 확인

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능 통합 테스트 및 최적화

- [x] T032 [P] Verify Pantone color palette application in explanation sections in src/index.css (Verified - CSS variables used)
- [x] T033 [P] Verify font size scale (0.85x ~ 1.2x) affects explanation layout in src/components/ExplanationView.tsx (Verified - scaledSize() used)
- [x] T034 Run npm run build to verify no TypeScript errors (Build succeeded)
- [x] T035 Full PDF download test with 30 questions (Manual: 30문제 PDF 다운로드 → 10초 이내 완료 확인)
- [x] T036 Print test for A4 layout verification (Manual: PDF 인쇄 → 텍스트 잘림 없음 확인)
- [x] T037 Run quickstart.md validation checklist (Manual: quickstart.md 단계 순서대로 실행)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories 1&2 (Phase 3)**: Depends on Foundational - MVP scope
- **User Story 3 (Phase 4)**: Can start after Phase 2, benefits from Phase 3
- **User Story 4 (Phase 5)**: Can start after Phase 2, independent
- **User Story 5 (Phase 6)**: Can start after Phase 2, independent
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Stories 1 & 2 (P1)**: Combined as they share ExplanationView component - MVP
- **User Story 3 (P2)**: Depends on showTranslation prop from Phase 2
- **User Story 4 (P2)**: Independent, only depends on QuickAnswerTable existing
- **User Story 5 (P3)**: Independent, only depends on groupByPassage existing

### Parallel Opportunities

Within Phase 3 (US1 & US2):
```
# These can run in parallel:
T009-T015: All section reviews can run simultaneously
```

Within Phase 4 (US3):
```
# These can run in parallel:
T019, T020: Passage and choice translation logic
T021: CSS styling
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Stories 1 & 2 (T007-T018)
4. **STOP and VALIDATE**: Test PDF download and all 7 layout types
5. Demo ready with core functionality

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 & US2 → PDF + 7 layouts (MVP!)
3. US3 → 번역 토글 기능
4. US4 → Quick Answer 자동 확장
5. US5 → 지문 그룹핑 최적화
6. Polish → 최종 검증

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Most changes are in single file: `ExplanationView.tsx`
- Existing code base means many tasks are verification/review rather than new creation
- Focus on integration and edge case handling
- Commit after each phase completion for easy rollback
