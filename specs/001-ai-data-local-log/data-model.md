# Data Model: AI 생성 데이터 로컬 기록

**Date**: 2025-12-23
**Feature**: 001-ai-data-local-log

## Entity Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    StorageData                               │
│  (localStorage root)                                         │
├─────────────────────────────────────────────────────────────┤
│  version: string                                             │
│  sessions: SavedSession[]  ───────────────────┐              │
└─────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    SavedSession                              │
│  (저장된 세션 단위)                                           │
├─────────────────────────────────────────────────────────────┤
│  id: string (ISO 8601 timestamp)                             │
│  createdAt: string                                           │
│  questionCount: number                                       │
│  questions: QuestionItem[]  ────────────────────┐            │
│  explanations: [id, ExplanationData][]  ────────┼───┐        │
│  vocabularyList?: VocaPreviewWord[]             │   │        │
└─────────────────────────────────────────────────────────────┘
                                                  │   │
                              ┌───────────────────┘   │
                              ▼                       ▼
┌──────────────────────┐  ┌──────────────────────────────────┐
│    QuestionItem      │  │        ExplanationData           │
│    (기존 타입)        │  │        (기존 유니온 타입)         │
├──────────────────────┤  ├──────────────────────────────────┤
│  id: string          │  │  type: string                    │
│  questionNumber: int │  │  passageTranslation?: string     │
│  passage: string     │  │  choiceTranslations?: array      │
│  choices: string[]   │  │  ... (유형별 필드)               │
│  answer: string      │  └──────────────────────────────────┘
│  categoryMain: str   │
│  categorySub: str    │
│  instruction: str    │
└──────────────────────┘
```

## Type Definitions

### StorageData (신규)

localStorage에 저장되는 루트 객체.

```typescript
interface StorageData {
  version: string;           // 데이터 스키마 버전 ("1.0")
  sessions: SavedSession[];  // 저장된 세션 배열 (최대 2개)
}
```

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| version | string | 스키마 버전 | 필수, "1.0" |
| sessions | SavedSession[] | 세션 배열 | 필수, 최대 2개 |

### SavedSession (신규)

하나의 저장된 세션을 나타냄.

```typescript
interface SavedSession {
  id: string;                              // 세션 ID (ISO 8601 타임스탬프)
  createdAt: string;                       // 생성 일시 (ISO 8601)
  questionCount: number;                   // 문제 수
  questions: QuestionItem[];               // 문제 목록
  explanations: [string, ExplanationData][]; // Map을 배열로 변환
  vocabularyList?: VocaPreviewWord[];      // 단어장 (선택)
}
```

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | string | 세션 고유 ID | 필수, ISO 8601 형식 |
| createdAt | string | 생성 일시 | 필수, ISO 8601 형식 |
| questionCount | number | 문제 수 | 필수, >= 0 |
| questions | QuestionItem[] | 문제 목록 | 필수 |
| explanations | [string, ExplanationData][] | 해설 맵 | 필수, 튜플 배열 |
| vocabularyList | VocaPreviewWord[] | 단어장 | 선택 |

## Validation Rules

### StorageData
1. `version`은 지원되는 버전이어야 함 (현재: "1.0")
2. `sessions` 배열 길이는 0-2 사이

### SavedSession
1. `id`는 유효한 ISO 8601 형식
2. `createdAt`은 유효한 ISO 8601 형식
3. `questionCount`는 `questions.length`와 일치해야 함
4. `explanations`의 각 키는 `questions`의 id와 대응해야 함

## State Transitions

```
[없음] ──(첫 세션 저장)──> [1개 세션]
           │
           ▼
[1개 세션] ──(세션 저장)──> [2개 세션]
           │
           ▼
[2개 세션] ──(세션 저장)──> [2개 세션] (FIFO: 오래된 것 삭제)
           │
           ▼
[N개 세션] ──(세션 삭제)──> [N-1개 세션]
           │
           ▼
[N개 세션] ──(전체 삭제)──> [0개 세션]
```

## Map ↔ Array Conversion

App.tsx의 `questionExplanations`는 `Map<string, ExplanationData>` 타입.
localStorage 저장을 위해 배열로 변환 필요.

```typescript
// 저장 시: Map → Array
const explanationsArray = Array.from(questionExplanations.entries());

// 복원 시: Array → Map
const explanationsMap = new Map(explanationsArray);
```

## localStorage Key

```typescript
const STORAGE_KEY = 'jeje-bookmaker-sessions';
```

## Example Data

```json
{
  "version": "1.0",
  "sessions": [
    {
      "id": "2025-12-23T10:30:00.000Z",
      "createdAt": "2025-12-23T10:30:00.000Z",
      "questionCount": 3,
      "questions": [
        {
          "id": "q1",
          "questionNumber": 1,
          "passage": "The scientist _established_ a new theory...",
          "choices": ["proved", "disproved", "ignored", "questioned", "modified"],
          "answer": "1",
          "categoryMain": "어휘",
          "categorySub": "동의어",
          "instruction": "밑줄 친 단어와 의미가 같은 것을 고르시오."
        }
      ],
      "explanations": [
        ["q1", {
          "type": "vocabulary",
          "wordExplanation": "establish는 '확립하다, 증명하다'의 의미...",
          "synonyms": [{"english": "prove", "korean": "증명하다"}],
          "passageTranslation": "그 과학자는 새로운 이론을 확립했다...",
          "choiceTranslations": [...]
        }]
      ],
      "vocabularyList": [
        {"questionNumber": 1, "word": "establish", "meaning": "확립하다"}
      ]
    }
  ]
}
```

## Related Existing Types

기존 `src/types/question.ts`에 정의된 타입 재사용:

- `QuestionItem`: 문제 데이터 (그대로 사용)
- `ExplanationData`: AI 해설 유니온 타입 (그대로 사용)
- `VocaPreviewWord`: 단어 데이터 (그대로 사용)
