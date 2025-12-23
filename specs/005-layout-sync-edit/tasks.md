# Tasks: 웹/PDF 레이아웃 동기화 및 텍스트 편집 기능

**Input**: Design documents from `/specs/005-layout-sync-edit/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: 수동 테스트 (npm run dev, PDF 다운로드 검증) - 자동화된 테스트 미포함

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Structure**: React SPA at repository root
- **Components**: `src/components/`
- **Services**: `src/services/`
- **Types**: `src/types/`
- **Utils**: `src/utils/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 의존성 설치 및 타입 정의

- [x] T001 Install pdfjs-dist dependency via `npm install pdfjs-dist`
- [x] T002 [P] Add EditableFieldType union type in src/types/question.ts
- [x] T003 [P] Add EditedField interface in src/types/question.ts
- [x] T004 [P] Add EditableRegion interface in src/types/question.ts
- [x] T005 [P] Add PdfPreviewState interface in src/types/question.ts
- [x] T006 Update SavedSession interface to include editedFields in src/types/question.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: PDF→이미지 변환 서비스 - 모든 User Story의 기반

**⚠️ CRITICAL**: US1이 이 Phase에 의존

- [x] T007 Create pdfImageRenderer.ts service file in src/services/pdfImageRenderer.ts
- [x] T008 Configure pdfjs-dist worker source for Vite environment in src/services/pdfImageRenderer.ts
- [x] T009 Implement renderPdfToImages function (PDF Blob → Canvas → PNG data URL) in src/services/pdfImageRenderer.ts
- [x] T010 Add page caching logic to renderPdfToImages in src/services/pdfImageRenderer.ts
- [x] T011 Add error handling for PDF loading failures in src/services/pdfImageRenderer.ts

**Checkpoint**: pdfImageRenderer 서비스 완료 - PDF를 이미지로 변환 가능

---

## Phase 3: User Story 1 - 웹 미리보기와 PDF 출력 일치 (Priority: P1) 🎯 MVP

**Goal**: PDF 렌더링 결과를 이미지로 웹에 표시하여 WYSIWYG 보장

**Independent Test**: 웹 미리보기 스크린샷과 PDF 다운로드 후 동일 페이지 비교

### Implementation for User Story 1

- [x] T012 [US1] Create PdfPreview.tsx component skeleton in src/components/PdfPreview.tsx
- [x] T013 [US1] Add PDF Blob generation using @react-pdf/renderer pdf() function in src/components/PdfPreview.tsx
- [x] T014 [US1] Integrate pdfImageRenderer to convert PDF to page images in src/components/PdfPreview.tsx
- [x] T015 [US1] Implement page image display with A4 aspect ratio in src/components/PdfPreview.tsx
- [x] T016 [US1] Add page navigation (prev/next, page number display) in src/components/PdfPreview.tsx
- [x] T017 [US1] Add loading state UI (spinner during PDF rendering) in src/components/PdfPreview.tsx
- [x] T018 [US1] Add error state UI (fallback message on render failure) in src/components/PdfPreview.tsx
- [x] T019 [US1] Add pdfPreviewState state to App.tsx for PDF preview management
- [x] T020 [US1] Integrate PdfPreview component into ExplanationView or create new preview tab in src/App.tsx
- [x] T021 [US1] Add usePdfPreview toggle flag for fallback to existing view in src/App.tsx

**Checkpoint**: 웹에서 PDF 이미지로 미리보기 가능 - 레이아웃 100% 일치

---

## Phase 4: User Story 2 - 해설지에 어휘 문제 정답 표시 (Priority: P2)

**Goal**: 어휘(동의어) 유형 문제의 정답을 볼드+색상으로 강조

**Independent Test**: 어휘 문제 해설지에서 정답 번호와 보기가 시각적으로 강조되어 있음

### Implementation for User Story 2

- [x] T022 [P] [US2] Add VocabAnswerHighlight component for PDF in src/components/QuestionPDF.tsx
- [x] T023 [P] [US2] Add vocabulary answer highlight section in ExplanationView.tsx for web display in src/components/ExplanationView.tsx
- [x] T024 [US2] Style vocabulary answer with bold + colorPalette.primary in QuestionPDF.tsx StyleSheet
- [x] T025 [US2] Style vocabulary answer with Tailwind classes in ExplanationView.tsx
- [x] T026 [US2] Ensure only vocabulary type questions show answer highlight (type guard check) in src/components/QuestionPDF.tsx
- [x] T027 [US2] Ensure only vocabulary type questions show answer highlight in src/components/ExplanationView.tsx

**Checkpoint**: 어휘 문제 정답이 웹과 PDF 모두에서 강조 표시됨

---

## Phase 5: User Story 3 - 모든 텍스트 인라인 편집 (Priority: P3)

**Goal**: PDF 이미지 위 오버레이로 모든 텍스트 요소 인라인 편집

**Independent Test**: 텍스트 클릭 → 편집 → Enter → PDF 다운로드 시 수정 내용 반영

### Implementation for User Story 3

- [x] T028 [US3] Create EditableOverlay.tsx component skeleton in src/components/EditableOverlay.tsx
- [x] T029 [US3] Implement transparent overlay layer positioning over PDF image in src/components/EditableOverlay.tsx
- [x] T030 [US3] Implement editable region rendering with absolute coordinates in src/components/EditableOverlay.tsx
- [x] T031 [US3] Add click handler to activate contentEditable mode in src/components/EditableOverlay.tsx
- [x] T032 [US3] Add keyboard handlers (Enter to save, Escape to cancel) in src/components/EditableOverlay.tsx
- [x] T033 [US3] Add blur handler to save on focus out in src/components/EditableOverlay.tsx
- [x] T034 [US3] Implement empty value restoration (FR-011: restore original on empty) in src/components/EditableOverlay.tsx
- [x] T035 [US3] Add visual hint on hover (edit icon or border) in src/components/EditableOverlay.tsx
- [x] T036 [US3] Implement extractEditableRegions function to map explanation fields to coordinates in src/services/pdfImageRenderer.ts
- [x] T037 [US3] Add editedFields state (Map<string, EditedFieldMap>) to App.tsx
- [x] T038 [US3] Implement handleFieldEdit callback in App.tsx to update explanations and editedFields
- [x] T039 [US3] Connect EditableOverlay to PdfPreview with onSave/onCancel props in src/components/PdfPreview.tsx
- [x] T040 [US3] Trigger PDF re-render on edit completion (debounced) in src/components/PdfPreview.tsx
- [x] T041 [US3] Update sessionStorage service to save/load editedFields in src/services/sessionStorage.ts

**Checkpoint**: 모든 텍스트 요소 인라인 편집 가능, PDF에 반영됨

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 성능 최적화 및 엣지 케이스 처리

- [x] T042 [P] Add debounced PDF re-rendering (500ms delay) for performance in src/components/PdfPreview.tsx
- [x] T043 [P] Implement page image caching (limit to recent 5 pages) in src/services/pdfImageRenderer.ts
- [x] T044 [P] Add memory cleanup on component unmount in src/components/PdfPreview.tsx
- [x] T045 Verify markdown markup (_word_, __________) renders correctly after edit in src/components/EditableOverlay.tsx
- [ ] T046 Manual test: Run quickstart.md test scenarios 1-4
- [ ] T047 Manual test: Performance check - PDF rendering < 2s, edit reflection < 1s

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001 (pdfjs-dist install)
- **US1 (Phase 3)**: Depends on Foundational (T007-T011 완료 필수)
- **US2 (Phase 4)**: No dependencies on other user stories - can run in parallel with US1
- **US3 (Phase 5)**: Depends on US1 (PdfPreview component required)
- **Polish (Phase 6)**: Depends on US1, US3 completion

### User Story Dependencies

```
Phase 1 (Setup) ─────────────────────┐
                                     │
Phase 2 (Foundational) ◄─────────────┘
         │
         ├──► Phase 3 (US1: PDF Preview) ──► Phase 5 (US3: Editing)
         │                                          │
         └──► Phase 4 (US2: Vocab Answer)           │
                                                    ▼
                                          Phase 6 (Polish)
```

### Parallel Opportunities

**Phase 1 (동시 실행 가능)**:
```bash
# T002, T003, T004, T005 can run in parallel (different type definitions)
Task: "T002 Add EditableFieldType union type"
Task: "T003 Add EditedField interface"
Task: "T004 Add EditableRegion interface"
Task: "T005 Add PdfPreviewState interface"
```

**Phase 4 (동시 실행 가능)**:
```bash
# T022 and T023 can run in parallel (different files)
Task: "T022 Add VocabAnswerHighlight in QuestionPDF.tsx"
Task: "T023 Add vocabulary answer highlight in ExplanationView.tsx"
```

**Phase 6 (동시 실행 가능)**:
```bash
# T042, T043, T044 can run in parallel (independent optimizations)
Task: "T042 Add debounced PDF re-rendering"
Task: "T043 Implement page image caching"
Task: "T044 Add memory cleanup"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T011)
3. Complete Phase 3: User Story 1 (T012-T021)
4. **STOP and VALIDATE**: PDF 미리보기가 웹에서 정상 동작하는지 확인
5. Deploy/demo if ready - **핵심 가치: WYSIWYG 보장**

### Incremental Delivery

1. Setup + Foundational → PDF 이미지 변환 기능 준비
2. Add US1 → PDF 미리보기 완성 → **MVP 배포 가능**
3. Add US2 → 어휘 정답 강조 → 배포
4. Add US3 → 인라인 편집 → 배포 (전체 기능 완성)
5. Polish → 성능 최적화 → 최종 배포

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | 6 | 의존성 및 타입 정의 |
| Phase 2: Foundational | 5 | PDF→이미지 서비스 |
| Phase 3: US1 | 10 | PDF 미리보기 (MVP) |
| Phase 4: US2 | 6 | 어휘 정답 강조 |
| Phase 5: US3 | 14 | 인라인 편집 |
| Phase 6: Polish | 6 | 성능 및 검증 |
| **Total** | **47** | |

---

## Notes

- [P] tasks = 서로 다른 파일, 의존성 없음
- [Story] label = 해당 User Story에 매핑
- US1 완료 후 MVP 배포 가능 (WYSIWYG 핵심 기능)
- US2는 US1과 독립적으로 개발 가능
- US3는 US1에 의존 (PdfPreview 컴포넌트 필요)
- 각 Checkpoint에서 해당 기능 독립 테스트 수행
