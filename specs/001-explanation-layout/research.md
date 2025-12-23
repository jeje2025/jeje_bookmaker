# Research: 해설지 레이아웃 개선

**Feature**: 001-explanation-layout
**Date**: 2025-12-23

## Overview

이 문서는 해설지 레이아웃 개선 기능 구현을 위한 기술 연구 결과를 정리합니다.

## 1. 기존 ExplanationView 구조 분석

### Decision: 기존 컴포넌트 구조 유지 및 확장

**Rationale:**
- `ExplanationView.tsx`는 이미 7가지 문제 유형별 섹션 컴포넌트를 포함
- 유형별 컴포넌트: `VocabularySection`, `GrammarSection`, `LogicSection`, `MainIdeaSection`, `InsertionSection`, `OrderSection`, `WordAppropriatenessSection`
- 지문 그룹핑 로직 (`groupByPassage`) 이미 구현됨
- Quick Answer 표 (`QuickAnswerTable`) 이미 구현됨

**Alternatives considered:**
- 컴포넌트 분리 (각 섹션을 별도 파일로): 거부 - 현재 규모에서 불필요한 복잡성
- 전면 재작성: 거부 - 기존 구현이 대부분 요구사항 충족

## 2. 번역 토글 기능 구현 방식

### Decision: App.tsx 상태 + ExplanationView props

**Rationale:**
- 프로젝트 헌법에 따라 React 내장 상태 사용 (외부 상태 라이브러리 금지)
- App.tsx에서 `showTranslation: boolean` 상태 관리
- ExplanationView에 props로 전달
- 기존 패턴과 일관성 유지 (fontSize, colorPalette 등)

**Alternatives considered:**
- Context API: 거부 - 단일 boolean 상태에 과도함
- localStorage 직접 사용: 거부 - 상태 동기화 복잡성

## 3. Quick Answer 표 자동 확장

### Decision: 동적 행 계산 (7열 고정)

**Rationale:**
- 현재 구현: 5행 7열 (35문제) 고정
- 수정 방향: `Math.ceil(questions.length / 7)` 로 행 수 동적 계산
- 7열 유지로 채점 편의성 보장

**Implementation:**
```typescript
const cols = 7;
const rows = Math.ceil(questions.length / cols);
```

## 4. 정답 표시 형식

### Decision: 일반 숫자(1-5) 형식 사용

**Rationale:**
- spec.md에서 FR-002 명시: "시스템은 정답을 일반 숫자(1-5) 형식으로 표시해야 한다"
- 기존 구현: `getAnswerNumber` 함수에서 ①→1 변환 이미 처리
- Quick Answer 표와 해설 섹션 모두 동일 형식 적용

**Current implementation:**
```typescript
const getAnswerNumber = (answer: string): string => {
  const map: Record<string, string> = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5' };
  return map[answer] || answer;
};
```

## 5. 지문/선지 번역 표시 위치

### Decision: 지문 아래, 선지 옆에 표시

**Rationale:**
- 기존 `TranslationFields` 인터페이스 활용
- `passageTranslation`: 영어 지문 바로 아래에 한글 번역 표시
- `choiceTranslations`: 각 선지와 함께 표시 (영어 + 한글)
- 토글로 전체 번역 숨김/표시

**Data structure (existing):**
```typescript
interface TranslationFields {
  passageTranslation?: string;
  choiceTranslations?: ChoiceTranslation[];
}
```

## 6. CSS 클래스 및 스타일링

### Decision: 기존 CSS 클래스 확장

**Rationale:**
- `index.css`에 이미 `.explanation-*` 클래스 정의됨
- `.quick-answer-*` 클래스 존재
- Pantone 컬러는 `--badge-text` CSS 변수로 적용
- 폰트 스케일은 `scaledSize()` 유틸리티 사용

**Key classes to modify/add:**
- `.translation-section`: 번역 표시 영역
- `.translation-toggle-hidden`: 번역 숨김 상태

## 7. PDF 출력 최적화

### Decision: html2canvas + pdf-lib 조합 유지

**Rationale:**
- 기존 `pdfDownload.ts` 유틸리티 활용
- A4PageLayout 컴포넌트가 페이지 분할 자동 처리
- 추가 최적화 불필요 (SC-002: 10초 이내 목표 달성 가능)

## Summary

| 항목 | 결정 | 구현 영향도 |
|------|------|-----------|
| 컴포넌트 구조 | 기존 유지 | 낮음 |
| 번역 토글 | App.tsx 상태 | 중간 |
| Quick Answer 확장 | 동적 행 계산 | 낮음 |
| 정답 형식 | 숫자(1-5) | 이미 구현됨 |
| 번역 위치 | 지문 아래, 선지 옆 | 중간 |
| 스타일링 | 기존 클래스 확장 | 낮음 |
| PDF 출력 | 기존 유지 | 없음 |

## Next Steps

1. data-model.md: 상태 및 props 정의
2. Phase 1 설계 진행
