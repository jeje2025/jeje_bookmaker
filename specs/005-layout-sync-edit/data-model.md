# Data Model: 웹/PDF 레이아웃 동기화 및 텍스트 편집 기능

**Date**: 2025-12-23
**Branch**: 005-layout-sync-edit

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App.tsx (중앙 상태)                          │
├─────────────────────────────────────────────────────────────────────┤
│  questionList: QuestionItem[]                                        │
│  questionExplanations: Map<string, ExplanationData>                 │
│  editedFields: Map<string, EditedFieldMap>  ← [NEW]                 │
│  pdfPreviewState: PdfPreviewState           ← [NEW]                 │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PdfPreview Component                            │
├─────────────────────────────────────────────────────────────────────┤
│  pageImages: string[]         (각 페이지 PNG data URL)              │
│  editableRegions: EditableRegion[]                                   │
│  currentPage: number                                                 │
│  scale: number                                                       │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EditableOverlay Component                         │
├─────────────────────────────────────────────────────────────────────┤
│  regions: EditableRegion[]    (현재 페이지의 편집 영역)             │
│  activeRegionId: string | null                                       │
│  onSave: (regionId, newText) => void                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## New Types (src/types/question.ts에 추가)

### 1. EditableFieldType

편집 가능한 필드 유형을 정의합니다.

```typescript
/**
 * 인라인 편집 가능한 필드 유형
 */
export type EditableFieldType =
  | 'passageTranslation'      // 지문 번역
  | 'wordExplanation'         // 어휘 해설 (VocabularyExplanation)
  | 'answerChange'            // 정답 변환 (GrammarExplanation)
  | 'testPoint'               // 출제 포인트 (GrammarExplanation)
  | 'correctExplanation'      // 정답 해설 (여러 타입 공통)
  | 'wrongExplanation'        // 오답 해설 (index 필요)
  | 'step1Targeting'          // Step 1 (LogicExplanation)
  | 'step2Evidence'           // Step 2 (LogicExplanation)
  | 'step3Choice'             // Step 3 보기 판단 (index 필요)
  | 'passageAnalysis'         // 지문 분석 (MainIdeaExplanation)
  | 'positionExplanation'     // 위치 설명 (InsertionExplanation, index 필요)
  | 'firstParagraph'          // 1열 (OrderExplanation)
  | 'splitPoint'              // 쪼개기 포인트 (OrderExplanation)
  | 'conclusion'              // 결론 (OrderExplanation)
  | 'mainTopic'               // 핵심 주제 (WordAppropriatenessExplanation)
  | 'choiceExplanation';      // 보기 해설 (index 필요)
```

### 2. EditedField

단일 편집 필드의 상태를 추적합니다.

```typescript
/**
 * 편집된 필드 정보
 */
export interface EditedField {
  fieldType: EditableFieldType;
  index?: number;              // 배열 필드의 경우 인덱스
  originalValue: string;       // 원본 값 (빈값 복원용)
  currentValue: string;        // 현재 값
  lastEditedAt: string;        // 마지막 편집 시간 (ISO 8601)
}

/**
 * 문제 ID별 편집된 필드 맵
 * key: `${fieldType}` 또는 `${fieldType}_${index}`
 */
export type EditedFieldMap = Map<string, EditedField>;
```

### 3. EditableRegion

PDF 위 편집 가능 영역의 좌표 및 메타데이터를 정의합니다.

```typescript
/**
 * PDF 페이지 내 편집 가능 영역
 */
export interface EditableRegion {
  id: string;                  // 고유 ID: `${questionId}_${fieldType}_${index?}`
  questionId: string;          // 연결된 문제 ID
  fieldType: EditableFieldType;
  index?: number;              // 배열 필드의 인덱스

  pageIndex: number;           // PDF 페이지 번호 (0-based)

  /** PDF 좌표계 (포인트 단위, 좌하단 원점) */
  pdfRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** 현재 텍스트 */
  text: string;

  /** 원본 텍스트 (빈값 복원용) */
  originalText: string;
}
```

### 4. PdfPreviewState

PDF 미리보기 컴포넌트의 상태를 관리합니다.

```typescript
/**
 * PDF 미리보기 상태
 */
export interface PdfPreviewState {
  /** 렌더링 상태 */
  status: 'idle' | 'rendering' | 'ready' | 'error';

  /** 에러 메시지 (status가 'error'일 때) */
  errorMessage?: string;

  /** 총 페이지 수 */
  totalPages: number;

  /** 현재 표시 중인 페이지 (1-based) */
  currentPage: number;

  /** 페이지별 이미지 캐시 (data URL) */
  pageImages: Map<number, string>;

  /** 모든 편집 가능 영역 */
  editableRegions: EditableRegion[];

  /** PDF 렌더링 스케일 (기본값: 2.0 for 고해상도) */
  scale: number;

  /** 마지막 렌더링 시간 */
  lastRenderedAt?: string;
}
```

---

## Updated Types (기존 타입 수정)

### SavedSession (확장)

세션 저장 시 편집 정보도 함께 저장합니다.

```typescript
export interface SavedSession {
  id: string;
  createdAt: string;
  questionCount: number;
  questions: QuestionItem[];
  explanations: [string, ExplanationData][];
  vocabularyList?: VocaPreviewWord[];

  /** [NEW] 편집된 필드 정보 */
  editedFields?: [string, [string, EditedField][]][];  // Map<questionId, EditedFieldMap> 직렬화
}
```

---

## Entity Relationships

```
QuestionItem (1) ←──── (1) ExplanationData
      │                        │
      │                        │ passageTranslation, wordExplanation, etc.
      │                        ▼
      │              EditableRegion (N) ◄─── 좌표 매핑
      │                        │
      ▼                        ▼
EditedFieldMap ◄──────── 편집 시 업데이트
      │
      ▼
SavedSession ◄──────── localStorage 저장
```

---

## State Transitions

### PDF Preview 렌더링 상태

```
idle ──[데이터 로드]──► rendering ──[성공]──► ready
                           │
                           └──[실패]──► error

ready ──[데이터 변경]──► rendering
```

### 편집 필드 상태

```
[원본] ──[클릭]──► [편집 중] ──[Enter/blur]──► [저장됨]
                       │
                       └──[Escape]──► [원본 복원]

                       └──[빈값 입력]──► [원본 복원] (FR-011)
```

---

## Validation Rules

### EditableRegion
- `id`: 필수, 형식: `${questionId}_${fieldType}` 또는 `${questionId}_${fieldType}_${index}`
- `pageIndex`: 0 이상, totalPages 미만
- `pdfRect`: 모든 값 0 이상
- `text`: 빈 문자열 불허 (빈 입력 시 originalText로 복원)

### PdfPreviewState
- `scale`: 0.5 ~ 4.0 범위
- `currentPage`: 1 ~ totalPages 범위

---

## Key Functions (Interface Contracts)

### pdfImageRenderer.ts

```typescript
/**
 * PDF Blob을 페이지별 이미지로 변환
 */
export async function renderPdfToImages(
  pdfBlob: Blob,
  options?: {
    scale?: number;           // 기본값: 2.0
    pageRange?: [number, number];  // 특정 페이지만 렌더링
  }
): Promise<{
  images: Map<number, string>;  // pageIndex → data URL
  totalPages: number;
}>;

/**
 * 편집 가능 영역 좌표 추출
 * (PDF 구조 분석하여 텍스트 영역 식별)
 */
export function extractEditableRegions(
  questions: QuestionItem[],
  explanations: Map<string, ExplanationData>,
  pageLayouts: PageLayout[]    // PDF 렌더링 시 계산된 레이아웃 정보
): EditableRegion[];
```

### EditableOverlay.tsx Props

```typescript
interface EditableOverlayProps {
  regions: EditableRegion[];
  scale: number;
  pageHeight: number;
  onSave: (regionId: string, newText: string) => void;
  onCancel: (regionId: string) => void;
}
```

---

## Migration Notes

기존 세션 데이터와의 호환성:
- `editedFields`가 없는 기존 세션 로드 시 빈 Map으로 초기화
- 버전 체크: `StorageData.version`이 "1.0"인 경우 마이그레이션 불필요 (필드 추가만)
