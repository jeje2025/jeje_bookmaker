# Implementation Plan: 웹/PDF 레이아웃 동기화 및 텍스트 편집 기능

**Branch**: `005-layout-sync-edit` | **Date**: 2025-12-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-layout-sync-edit/spec.md`

## Summary

웹 미리보기와 PDF 출력의 완벽한 레이아웃 일치를 위해 PDF 렌더링 결과를 이미지로 변환하여 웹에 표시하고, 이미지 위 오버레이 편집 영역을 통해 모든 텍스트 요소의 인라인 편집을 지원한다. 어휘 문제 해설에는 정답을 볼드+색상으로 강조 표시한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+
**Primary Dependencies**: @react-pdf/renderer, pdf-lib, pdfjs-dist (PDF→이미지 변환용)
**Storage**: localStorage (세션 저장), React 상태 (App.tsx 중앙 관리)
**Testing**: 수동 테스트 (npm run dev, PDF 다운로드 검증)
**Target Platform**: 웹 브라우저 (Chrome, Safari, Firefox)
**Project Type**: Web (React SPA)
**Performance Goals**: PDF 이미지 렌더링 <2초, 편집 반영 <1초, 60fps UI
**Constraints**: A4 레이아웃 정확도 95%+, 메모리 <500MB
**Scale/Scope**: 단일 사용자, 최대 100문제/세션

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `.specify/memory/constitution.md`:

- [x] **I. UX-First**: PDF 이미지를 웹에 직접 표시하여 WYSIWYG 보장. 인쇄 테스트는 PDF 다운로드 후 수행.
- [x] **II. Data Integrity**: 정답 형식(숫자 저장, ①②③④⑤ 표시), 마크업 규칙(`_word_`, `__________`) 유지. 편집 시에도 마크업 파싱 적용.
- [x] **III. Modular Views**: 새 컴포넌트는 기존 네이밍 규칙 준수 (PdfPreview.tsx, EditableOverlay.tsx). ui/ 디렉토리에 공통 컴포넌트 배치.
- [x] **IV. AI Reliability**: AI 호출과 무관한 기능 (레이아웃 동기화, 편집). 편집 기능은 AI 생성 결과 수정용이므로 AI 실패 시에도 수동 입력 가능.
- [x] **V. Print Optimization**: PDF 렌더링을 웹 미리보기에 사용하므로 인쇄 결과와 100% 일치 보장. A4PageLayout 기반.

## Project Structure

### Documentation (this feature)

```text
specs/005-layout-sync-edit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── PdfPreview.tsx          # [NEW] PDF→이미지 렌더링 및 표시
│   ├── EditableOverlay.tsx     # [NEW] PDF 이미지 위 편집 오버레이
│   ├── ExplanationView.tsx     # [MOD] 어휘 정답 강조 추가
│   ├── QuestionPDF.tsx         # [MOD] 어휘 정답 스타일링
│   ├── A4PageLayout.tsx        # 기존 유지
│   └── ui/
│       └── EditableText.tsx    # 기존 활용
├── services/
│   └── pdfImageRenderer.ts     # [NEW] PDF→Canvas 변환 서비스
├── utils/
│   └── pdfDownload.ts          # [MOD] 편집 데이터 반영
└── types/
    └── question.ts             # [MOD] 편집 상태 타입 추가
```

**Structure Decision**: 기존 React SPA 구조 유지. 새 컴포넌트는 components/ 디렉토리에, 서비스 로직은 services/ 디렉토리에 배치.

## Complexity Tracking

> Constitution Check 통과 - 위반 사항 없음

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| PDF→이미지 변환 | pdfjs-dist 사용 | @react-pdf/renderer 출력을 직접 canvas로 변환하는 표준 방식 |
| 오버레이 편집 | 절대 좌표 매핑 | PDF 페이지 좌표와 1:1 매핑으로 정확한 위치 편집 가능 |
| 상태 관리 | App.tsx 중앙 관리 | 기존 패턴 유지, 외부 상태 라이브러리 금지(헌법 준수) |
