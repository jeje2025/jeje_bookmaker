# Data Model: PDF A4 페이지 분할

**Feature**: 002-pdf-a4-pagination
**Date**: 2025-12-23

## 1. 기존 엔티티 (수정 없음)

### QuestionItem

문제 데이터를 나타내는 핵심 엔티티입니다. (기존 정의 유지)

```typescript
interface QuestionItem {
  id: string;
  year: number;
  questionNumber: number;
  categoryMain: string;
  categorySub: string;
  instruction: string;
  passage: string;
  choices: string[];
  answer: string;
}
```

### VocabularyItem

단어 데이터를 나타내는 엔티티입니다. (기존 정의 유지)

```typescript
interface VocabularyItem {
  id: number;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  definition?: string;
  synonyms: string[];
  antonyms: string[];
  derivatives: Array<{ word: string; meaning: string }>;
  example: string;
  translation: string;
  etymology: string;
}
```

## 2. PDF 렌더링 관련 개념

### ContentBlock (개념적 정의)

PDF에서 분할 불가능한 논리적 콘텐츠 단위입니다.
실제 타입 정의가 아닌 @react-pdf/renderer의 `wrap={false}` View로 구현됩니다.

**특성**:
- 페이지 경계에서 분할되지 않음
- 현재 페이지에 들어가지 않으면 다음 페이지로 이동
- 단일 블록이 한 페이지를 초과할 수 없음 (디자인 제약)

**콘텐츠 유형별 블록 정의**:

| 뷰 모드 | ContentBlock 구성 | 비고 |
|---------|------------------|------|
| question (문제지) | 문제 번호 + 발문 + 지문 + 보기 5개 | 한 문제가 하나의 블록 |
| answer (해설지) | 문제 번호 + 지문(번역) + 해설 섹션 | 한 해설이 하나의 블록 |
| vocabulary (단어장) | 단어 카드 전체 | 한 단어가 하나의 블록 |
| table (테이블) | 테이블 행 1개 | 각 행이 하나의 블록 |

### PageConfig (PDF 페이지 설정)

PDF 페이지의 공통 설정입니다.

```typescript
const PAGE_CONFIG = {
  size: 'A4' as const,           // 210mm × 297mm
  orientation: 'portrait' as const,
  padding: {
    top: 20,      // pt (약 7mm)
    bottom: 40,   // pt (약 14mm) - 페이지 번호 공간
    left: 30,     // pt (약 10.5mm)
    right: 30     // pt (약 10.5mm)
  }
};
```

### PassageGroup (문제 그룹)

같은 지문을 공유하는 문제 그룹입니다. (기존 정의 활용)

```typescript
interface PassageGroup {
  passage: string;
  items: QuestionItem[];  // 최대 2개
}
```

**페이지 분할 시 그룹 처리**:
1. 그룹 전체가 현재 페이지에 들어가면 → 함께 배치
2. 그룹이 페이지 경계에서 잘릴 경우 → 그룹 해제
   - 첫 문제: 현재 페이지에 배치
   - 나머지: 다음 페이지로 이동
   - 같은 지문 공유하는 후속 문제와 새 그룹 형성 가능

## 3. PDF 스타일 정의

### PDFStyles (공통 스타일)

```typescript
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 30,
    fontFamily: 'Pretendard',
  },
  contentBlock: {
    // wrap={false}가 적용되는 View
    marginBottom: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 30,
    fontSize: 8,
    color: '#9ca3af',
  },
  continuationMarker: {
    // "(계속)" 표시용
    fontSize: 8,
    color: '#6b7280',
    marginTop: 5,
  }
});
```

## 4. 데이터 흐름

```
QuestionItem[] / VocabularyItem[]
          │
          ▼
  groupByPassage() (문제지의 경우)
          │
          ▼
  ContentBlock 단위로 분할
          │
          ▼
  @react-pdf/renderer
    └── Document
          └── Page (A4)
                └── View (wrap={false})
                      └── 콘텐츠 렌더링
          │
          ▼
    PDF Blob 생성
          │
          ▼
    다운로드
```

## 5. 유효성 규칙

| 규칙 | 검증 방법 |
|------|----------|
| 콘텐츠 블록 ≤ 1페이지 | 디자인 시 블록 크기 제한 |
| 페이지 여백 ≥ 15mm | PAGE_CONFIG 상수로 강제 |
| 페이지 번호 표시 | render prop 또는 pdf-lib 후처리 |
| A4 세로 방향 | PAGE_CONFIG.orientation 고정 |
