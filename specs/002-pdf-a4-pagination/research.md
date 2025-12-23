# Research: PDF A4 페이지 분할

**Feature**: 002-pdf-a4-pagination
**Date**: 2025-12-23

## Overview

이 문서는 PDF A4 페이지 분할 기능 구현을 위한 기술 연구 결과를 정리합니다.

## 1. 기존 구현 분석

### A4PageLayout (화면용)

**현재 상태**: `src/components/A4PageLayout.tsx`에 페이지 분할 알고리즘 구현됨

**핵심 로직**:
- A4 높이 260mm (297mm - 37mm 여백) 기준
- DOM 측정 후 children을 페이지별로 분할
- 아이템이 남은 공간에 들어가지 않으면 다음 페이지로 이동

**제한사항**:
- DOM 기반 측정으로 PDF 렌더링과 별도
- @react-pdf/renderer는 별도의 렌더링 엔진 사용

### pdfDownload.ts (PDF 생성)

**현재 상태**: 청크 단위로 PDF 생성 후 병합

**핵심 로직**:
- CHUNK_SIZE (200개) 단위로 데이터 분할
- 각 청크를 별도 PDF로 생성
- pdf-lib로 병합 및 페이지 번호 추가

**제한사항**:
- 콘텐츠 블록 단위 분할 로직 없음
- 페이지 경계에서 콘텐츠가 잘릴 수 있음

## 2. @react-pdf/renderer 페이지 분할 메커니즘

### Decision: @react-pdf/renderer 내장 wrap 속성 활용

**Rationale**:
- @react-pdf/renderer의 View 컴포넌트는 `wrap={false}` 속성 지원
- `wrap={false}` 설정 시 해당 View가 페이지 경계에서 분할되지 않음
- View가 현재 페이지에 들어가지 않으면 자동으로 다음 페이지로 이동

**사용법**:
```tsx
<View wrap={false}>
  {/* 이 블록은 페이지 경계에서 분할되지 않음 */}
  <QuestionCard question={question} />
</View>
```

**Alternatives considered**:
- 수동 높이 계산 후 Page 분할: 거부 - 복잡하고 오류 발생 가능성 높음
- 청크별 PDF 병합 시 페이지 재계산: 거부 - 성능 오버헤드 큼

## 3. 콘텐츠 블록 분할 전략

### Decision: 논리적 단위별 wrap={false} 적용

**적용 대상**:
| 콘텐츠 유형 | 분할 불가 단위 | wrap 적용 위치 |
|-------------|---------------|----------------|
| 문제지 | 문제 1개 (지문+보기) | QuestionCard 래퍼 |
| 해설지 | 해설 카드 1개 | ExplanationCard 래퍼 |
| 단어장 | 단어 카드 1개 | VocabularyCard 래퍼 |
| 테이블 | 테이블 행 그룹 | 행 래퍼 View |

**문제 그룹 처리**:
- 같은 지문 공유 문제 그룹이 페이지 경계에서 잘릴 경우
- 첫 문제는 현재 페이지에 배치 (wrap={false})
- 두 번째 문제부터는 별도 블록으로 처리
- 후속 문제와 같은 지문 공유 시 새 그룹 형성

## 4. 페이지 여백 설정

### Decision: A4 표준 인쇄 여백 적용

**설정값**:
```tsx
<Page
  size="A4"
  style={{
    paddingTop: 20,      // 약 7mm
    paddingBottom: 40,   // 약 14mm (페이지 번호 공간 확보)
    paddingLeft: 30,     // 약 10.5mm
    paddingRight: 30     // 약 10.5mm
  }}
>
```

**Rationale**:
- 대부분의 프린터는 5-10mm 비인쇄 영역 보유
- 15mm 이상 여백으로 안전한 인쇄 영역 확보
- 현재 A4PageLayout의 `padding: '17mm 20mm 20mm 20mm'`와 유사

## 5. 페이지 번호 표시

### Decision: 각 Page 컴포넌트 내 Text로 표시

**방법**:
```tsx
<Page size="A4">
  {/* 콘텐츠 */}
  <Text
    fixed
    style={{ position: 'absolute', bottom: 20, right: 30 }}
    render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
  />
</Page>
```

**Rationale**:
- @react-pdf/renderer의 render prop으로 동적 페이지 번호 지원
- fixed 속성으로 모든 페이지에 자동 표시
- 기존 pdf-lib 기반 페이지 번호 추가 불필요

## 6. 성능 최적화

### Decision: 청크 분할 유지 + wrap 적용

**Rationale**:
- 대용량 데이터(200개 이상) 시 메모리 최적화 필요
- 기존 청크 분할 로직 유지
- 각 청크 내에서 wrap={false} 적용

**청크 병합 시 주의사항**:
- 페이지 번호는 병합 후 pdf-lib로 재계산
- 청크 간 콘텐츠 연속성 표시 불필요 (자연스러운 페이지 전환)

## Summary

| 항목 | 결정 | 구현 영향도 |
|------|------|-----------|
| 페이지 분할 메커니즘 | wrap={false} 속성 | 중간 |
| 콘텐츠 블록 단위 | 문제/해설/카드 단위 | 중간 |
| 여백 설정 | 상20/하40/좌우30 pt | 낮음 |
| 페이지 번호 | render prop 또는 pdf-lib | 낮음 |
| 성능 최적화 | 기존 청크 분할 유지 | 없음 |

## Next Steps

1. data-model.md: 콘텐츠 블록 타입 정의
2. QuestionPDF.tsx, VocabularyPDF.tsx에 wrap={false} 적용
3. 테스트: 30문제, 100문제 PDF 생성 확인
