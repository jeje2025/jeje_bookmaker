# Implementation Plan: 해설지 레이아웃 개선

**Branch**: `001-explanation-layout` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-explanation-layout/spec.md`

## Summary

해설지 레이아웃을 개선하여 7가지 문제 유형별 최적화된 해설 표시, Quick Answer 표, 지문 그룹핑, 번역 토글 기능을 구현합니다. 기존 `ExplanationView.tsx` 컴포넌트를 확장하여 A4 PDF 출력에 최적화된 레이아웃을 제공합니다.

## Technical Context

**Language/Version**: TypeScript (ES2020), React 18.3
**Primary Dependencies**: React, @react-pdf/renderer 4.3, pdf-lib 1.17, Tailwind CSS 4, Radix UI
**Storage**: N/A (클라이언트 사이드 상태 관리, App.tsx 중앙 관리)
**Testing**: 수동 테스트 (npm run dev → 브라우저 확인 → PDF 다운로드)
**Target Platform**: Web (Chrome, Firefox, Safari - 최신 버전)
**Project Type**: Web application (React SPA)
**Performance Goals**: PDF 생성 10초 이내 (30문제 기준), UI 반응 200ms 이내
**Constraints**: A4 인쇄 호환성, Pretendard 한글 폰트 필수, 클라이언트 전용
**Scale/Scope**: 단일 사용자, 최대 100문제 처리

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `.specify/memory/constitution.md`:

- [x] **I. UX-First**: PDF 출력물 가독성/인쇄 품질 검증 계획 포함
  - FR-006: A4 크기 PDF 내보내기
  - SC-003: 인쇄 시 텍스트 잘림 0건 목표
  - 실제 인쇄 테스트 포함

- [x] **II. Data Integrity**: 데이터 형식(정답, 마크업) 규칙 준수 확인
  - FR-002: 정답을 일반 숫자(1-5) 형식으로 표시
  - FR-004: 지문 마크업(_word_, __________) 시각적 구분
  - 기존 `question.ts` 타입 시스템 활용

- [x] **III. Modular Views**: 컴포넌트 네이밍 및 디렉토리 구조 준수
  - 기존 `ExplanationView.tsx` 확장
  - 공통 컴포넌트: A4PageLayout, HeaderFooter 재사용
  - 새 컴포넌트: `ExplanationSection*.tsx` 네이밍 패턴

- [x] **IV. AI Reliability**: AI 실패 시 대안 동작 설계 포함
  - FR-005: AI 해설 없는 경우 플레이스홀더 표시
  - 기존 구현에서 이미 처리됨 (placeholder-text 클래스)

- [x] **V. Print Optimization**: A4PageLayout 활용 및 인쇄 테스트 계획
  - 기존 A4PageLayout 컴포넌트 활용
  - FR-008: Pantone 컬러 팔레트 적용
  - FR-010: 글씨 크기 스케일 (0.85x ~ 1.2x) 반영

## Project Structure

### Documentation (this feature)

```text
specs/001-explanation-layout/
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
│   ├── ExplanationView.tsx          # 메인 해설지 뷰 (수정)
│   ├── A4PageLayout.tsx             # A4 레이아웃 (재사용)
│   ├── HeaderFooter.tsx             # 헤더/푸터 (재사용)
│   └── ui/                          # 공통 UI 컴포넌트
├── types/
│   └── question.ts                  # 타입 정의 (기존 활용)
├── utils/
│   ├── fontScale.ts                 # 폰트 스케일 유틸리티
│   └── pdfDownload.ts               # PDF 다운로드 유틸리티
└── App.tsx                          # 상태 관리 (번역 토글 상태 추가)

public/
└── fonts/
    └── Pretendard*.woff2            # 한글 폰트
```

**Structure Decision**: 기존 프로젝트 구조 유지. `ExplanationView.tsx` 단일 파일 내에서 유형별 섹션 컴포넌트를 정의하는 현재 패턴을 유지합니다.

## Complexity Tracking

> No violations - all requirements align with Constitution principles.

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First | ✅ Pass | 인쇄 품질 검증 계획 포함 |
| II. Data Integrity | ✅ Pass | 기존 타입 시스템 활용 |
| III. Modular Views | ✅ Pass | 컴포넌트 네이밍 준수 |
| IV. AI Reliability | ✅ Pass | 플레이스홀더 구현 |
| V. Print Optimization | ✅ Pass | A4PageLayout 활용 |
