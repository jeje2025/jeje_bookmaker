# Implementation Plan: PDF A4 페이지 분할

**Branch**: `002-pdf-a4-pagination` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-pdf-a4-pagination/spec.md`

## Summary

PDF 다운로드 시 콘텐츠가 A4 페이지 크기에 맞게 자동으로 분할되어 텍스트나 요소가 페이지 경계에서 잘리지 않도록 개선한다. 기존 A4PageLayout 컴포넌트의 페이지 분할 알고리즘을 활용하되, @react-pdf/renderer의 Page 컴포넌트와 연동하여 PDF에서도 동일한 분할 로직이 적용되도록 한다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+
**Primary Dependencies**: @react-pdf/renderer, pdf-lib, Vite
**Storage**: N/A (클라이언트 사이드 PDF 생성)
**Testing**: 수동 테스트 (npm run dev → 브라우저 확인 → PDF 다운로드)
**Target Platform**: Chrome 브라우저 (웹 앱)
**Project Type**: Single (프론트엔드 전용)
**Performance Goals**: 30문제 기준 PDF 생성 15초 이내
**Constraints**: A4 세로 방향 전용, 클라이언트 사이드 렌더링
**Scale/Scope**: 100페이지 이상 대용량 PDF 지원

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `.specify/memory/constitution.md`:

- [x] **I. UX-First**: PDF 출력물 가독성/인쇄 품질 검증 계획 포함 - PDF 다운로드 후 A4 인쇄 테스트 포함
- [x] **II. Data Integrity**: 데이터 형식(정답, 마크업) 규칙 준수 확인 - 기존 데이터 형식 유지
- [x] **III. Modular Views**: 컴포넌트 네이밍 및 디렉토리 구조 준수 - QuestionPDF.tsx, VocabularyPDF.tsx 기존 구조 활용
- [x] **IV. AI Reliability**: AI 실패 시 대안 동작 설계 포함 - PDF 생성은 AI 독립적
- [x] **V. Print Optimization**: A4PageLayout 활용 및 인쇄 테스트 계획 - 핵심 구현 대상

## Project Structure

### Documentation (this feature)

```text
specs/002-pdf-a4-pagination/
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
│   ├── A4PageLayout.tsx       # 기존 페이지 분할 로직 (화면용)
│   ├── QuestionPDF.tsx        # 문제집 PDF 컴포넌트 (수정 대상)
│   ├── VocabularyPDF.tsx      # 단어장 PDF 컴포넌트 (수정 대상)
│   ├── ExplanationView.tsx    # 해설지 뷰 (참조)
│   └── ui/                    # 공통 UI 컴포넌트
├── utils/
│   └── pdfDownload.ts         # PDF 생성/다운로드 유틸 (수정 대상)
└── types/
    └── question.ts            # 타입 정의
```

**Structure Decision**: 기존 프론트엔드 단일 프로젝트 구조 유지. PDF 관련 컴포넌트와 유틸리티만 수정.
