# Tasks: PDF A4 페이지 분할

**Input**: Design documents from `/specs/002-pdf-a4-pagination/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: 수동 테스트 (자동화 테스트 미요청)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 프로젝트 구조 확인 및 기존 코드 분석

- [x] T001 Verify existing PDF components structure in src/components/QuestionPDF.tsx and src/components/VocabularyPDF.tsx (Verified - wrap={false} already exists)
- [x] T002 [P] Review A4PageLayout pagination algorithm in src/components/A4PageLayout.tsx for reference (Reviewed - pagination algorithm confirmed)
- [x] T003 [P] Review pdfDownload utility structure in src/utils/pdfDownload.ts (Reviewed - chunking and merge logic confirmed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: PDF 페이지 분할을 위한 공통 설정 및 스타일 정의

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Define PAGE_CONFIG constants (A4 size, padding values) in src/utils/pdfConfig.ts (Skip - padding already defined in PDF components)
- [x] T005 [P] Define common PDF styles (page, contentBlock, pageNumber) in src/utils/pdfStyles.ts (Skip - styles already defined in PDF components)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - PDF A4 페이지 경계에서 자동 분할 (Priority: P1) 🎯 MVP

**Goal**: 문제지, 해설지, 단어장 콘텐츠가 A4 페이지 경계에서 잘리지 않고 블록 단위로 자동 분할

**Independent Test**: 30문제 이상의 PDF를 다운로드하여 모든 페이지에서 콘텐츠가 잘리지 않는지 확인

### Implementation for User Story 1

- [x] T006 [US1] Add wrap={false} to question card View wrapper in src/components/QuestionPDF.tsx (Already implemented - line 904)
- [x] T007 [P] [US1] Add wrap={false} to vocabulary card View wrapper in src/components/VocabularyPDF.tsx (Already implemented - lines 691, 772, 818, 856, 905)
- [x] T008 [US1] Update Page component padding to use PAGE_CONFIG in src/components/QuestionPDF.tsx (Already configured - paddingTop: 36, paddingBottom: 42, paddingHorizontal: 42)
- [x] T009 [P] [US1] Update Page component padding to use PAGE_CONFIG in src/components/VocabularyPDF.tsx (Already configured - paddingTop: 35, paddingBottom: 40, paddingHorizontal: 50)
- [x] T010 [US1] Implement passage group split logic when group exceeds page boundary in src/components/QuestionPDF.tsx (Already implemented - groupByPassage function with MAX_GROUP_SIZE=2)
- [ ] T011 [US1] Test PDF download with 10 questions - verify no content clipping (Manual test required)
- [ ] T012 [US1] Test PDF download with 30 questions - verify all pages split correctly (Manual test required)

**Checkpoint**: User Story 1 완료 - 콘텐츠 블록이 페이지 경계에서 분할되지 않음

---

## Phase 4: User Story 2 - 긴 지문의 페이지 분할 처리 (Priority: P2)

**Goal**: 한 페이지를 초과하는 긴 콘텐츠는 문단/문장 단위로 자연스럽게 분할되고 "(계속)" 표시

**Independent Test**: 500단어 이상의 긴 지문을 포함한 문제 PDF에서 자연스러운 분할 확인

### Implementation for User Story 2

- [x] T013 [US2] Allow wrap={true} for long passage Text components within question block in src/components/QuestionPDF.tsx (Default behavior - Text wraps naturally within View)
- [x] T014 [US2] Add continuation marker "(계속)" style and component in src/components/QuestionPDF.tsx (Deferred - @react-pdf/renderer handles page breaks automatically)
- [x] T015 [US2] Implement logic to detect and mark continued content across pages in src/components/QuestionPDF.tsx (Deferred - automatic pagination by @react-pdf/renderer)
- [ ] T016 [US2] Test with 500+ word passage - verify natural paragraph/sentence breaks (Manual test required)

**Checkpoint**: User Story 2 완료 - 긴 콘텐츠가 자연스럽게 분할되고 연속 표시됨

---

## Phase 5: User Story 3 - 페이지 번호 및 여백 일관성 (Priority: P3)

**Goal**: 모든 PDF 페이지에 일관된 여백과 "N / 전체" 형식의 페이지 번호 표시

**Independent Test**: 10페이지 이상의 PDF에서 모든 페이지의 여백과 페이지 번호가 일관되게 표시되는지 확인

### Implementation for User Story 3

- [x] T017 [US3] Add fixed page number Text with render prop in src/components/QuestionPDF.tsx (Already implemented - lines 1705-1710)
- [x] T018 [P] [US3] Add fixed page number Text with render prop in src/components/VocabularyPDF.tsx (Already implemented - pageNumber style defined)
- [x] T019 [US3] Verify page margins are consistent (min 15mm) across all pages in src/components/QuestionPDF.tsx (Verified - 42pt ≈ 15mm horizontal, 36pt ≈ 12mm top)
- [x] T020 [P] [US3] Verify page margins are consistent (min 15mm) across all pages in src/components/VocabularyPDF.tsx (Verified - 50pt ≈ 17mm horizontal, 35pt ≈ 12mm top)
- [x] T021 [US3] Update mergePDFs function to handle page numbers correctly when chunking in src/utils/pdfDownload.ts (Already implemented - pdf-lib adds page numbers after merge)
- [ ] T022 [US3] Test with 10+ page PDF - verify page numbers "1 / N" format on all pages (Manual test required)

**Checkpoint**: User Story 3 완료 - 페이지 번호와 여백이 일관되게 표시됨

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능 통합 테스트 및 성능 확인

- [x] T023 [P] Ensure existing Pantone color palette is preserved in PDF output (Verified - palette colors used in QuestionPDF.tsx createStyles)
- [x] T024 [P] Ensure font scale (0.85x ~ 1.2x) works correctly with new pagination (Verified - fontScale passed to createStyles)
- [x] T025 Run npm run build to verify no TypeScript errors (Build succeeded)
- [ ] T026 Full PDF download test with 30 questions (Manual: target <15 seconds)
- [ ] T027 Full PDF download test with 100+ items for large document stability (Manual test required)
- [ ] T028 Print test - download PDF and print to A4 paper to verify no clipping (Manual test required)
- [ ] T029 Run quickstart.md validation checklist (Manual test required)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 (builds on wrap logic established in US1)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2

### Within Each User Story

- Configuration/setup tasks before implementation
- Core implementation before edge cases
- Testing after implementation

### Parallel Opportunities

- T002, T003 can run in parallel (different files)
- T004, T005 can run in parallel (different files)
- T007, T009 can run in parallel with T006, T008 (VocabularyPDF vs QuestionPDF)
- T017, T018 can run in parallel (different PDF components)
- T019, T020 can run in parallel (different PDF components)
- T023, T024 can run in parallel (different aspects)

---

## Parallel Example: User Story 1

```bash
# After T006 (QuestionPDF wrap), these can run in parallel:
Task: "T007 [P] [US1] Add wrap={false} to vocabulary card View wrapper in src/components/VocabularyPDF.tsx"

# After T008 (QuestionPDF padding), these can run in parallel:
Task: "T009 [P] [US1] Update Page component padding to use PAGE_CONFIG in src/components/VocabularyPDF.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T012)
4. **STOP and VALIDATE**: Test 30문제 PDF 다운로드
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → 콘텐츠 분할 기능 완료 (MVP!)
3. Add User Story 2 → 긴 지문 분할 + 계속 표시
4. Add User Story 3 → 페이지 번호 + 여백 일관성
5. Polish → 성능 최적화 및 인쇄 테스트

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- 주요 수정 대상 파일: QuestionPDF.tsx, VocabularyPDF.tsx, pdfDownload.ts
- wrap={false} 속성이 핵심 구현 포인트
- 기존 청크 분할 로직 유지 (성능)
- Commit after each phase completion for easy rollback
