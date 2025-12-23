# Data Model: 해설지 레이아웃 개선

**Feature**: 001-explanation-layout
**Date**: 2025-12-23

## 1. 기존 엔티티 (수정 없음)

### QuestionItem

문제 데이터를 나타내는 핵심 엔티티입니다.

```typescript
interface QuestionItem {
  id: string;              // 고유번호 (예: 2025_DGU_01)
  year: number;            // 연도
  questionNumber: number;  // 문제 번호
  categoryMain: string;    // 유형 대분류
  categorySub: string;     // 유형 소분류
  instruction: string;     // 발문
  passage: string;         // 지문
  choices: string[];       // 보기 5개
  answer: string;          // 정답 (①-⑤)
}
```

### ExplanationData (Union Type)

7가지 문제 유형별 AI 해설 데이터입니다.

```typescript
type ExplanationData =
  | VocabularyExplanation    // 어휘(동의어)
  | GrammarExplanation       // 문법
  | LogicExplanation         // 논리/빈칸
  | MainIdeaExplanation      // 대의파악
  | InsertionExplanation     // 삽입
  | OrderExplanation         // 순서
  | WordAppropriatenessExplanation; // 어휘적절성
```

### TranslationFields (공통 인터페이스)

모든 해설 타입이 상속하는 번역 필드입니다.

```typescript
interface TranslationFields {
  passageTranslation?: string;           // 지문 한글 번역
  choiceTranslations?: ChoiceTranslation[]; // 보기 번역 (5개)
}

interface ChoiceTranslation {
  english: string;      // 원문
  korean: string;       // 한글 번역
  showEnglish: boolean; // 영어 원문 표시 여부
}
```

## 2. 내부 데이터 구조 (기존)

### PassageGroup

같은 지문을 공유하는 문제 그룹입니다.

```typescript
interface PassageGroup {
  passage: string;        // 공유 지문
  items: QuestionItem[];  // 그룹 내 문제들 (최대 2개)
}
```

### HeaderInfo

해설지 헤더 정보입니다.

```typescript
interface HeaderInfo {
  headerTitle: string;       // 제목
  headerDescription: string; // 설명
  footerLeft: string;        // 푸터 좌측 텍스트
}
```

## 3. 새로운 상태 (App.tsx)

### showTranslation

번역 표시 여부를 제어하는 상태입니다.

```typescript
// App.tsx에 추가
const [showTranslation, setShowTranslation] = useState<boolean>(true);
```

**기본값**: `true` (번역 표시)
**위치**: App.tsx 상태 관리 영역
**연동**: ExplanationView props로 전달

## 4. Props 인터페이스

### ExplanationViewProps (수정)

```typescript
interface ExplanationViewProps {
  questions: QuestionItem[];
  explanations: Map<string, ExplanationData>;
  headerInfo: HeaderInfo;
  colorPalette: ColorPalette;
  fontSize: FontSize;
  isEditMode: boolean;
  onUpdateExplanation: (id: string, data: ExplanationData) => void;
  onUpdatePassageTranslation: (id: string, translation: string) => void;
  // 새로 추가
  showTranslation: boolean;
}
```

## 5. 상태 전이 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                      App.tsx 상태                            │
├─────────────────────────────────────────────────────────────┤
│  questionList: QuestionItem[]                                │
│  questionExplanations: Map<string, ExplanationData>          │
│  showTranslation: boolean  ← 새로 추가                        │
│  viewMode: 'question' | 'answer' | 'vocabulary' | 'vocaPreview' │
│  colorPalette: ColorPalette                                  │
│  fontSize: FontSize                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ExplanationView                           │
├─────────────────────────────────────────────────────────────┤
│  1. groupByPassage() → PassageGroup[]                        │
│  2. 각 그룹별 렌더링:                                          │
│     - 지문 (+ 번역 if showTranslation)                        │
│     - Quick Answer 표                                        │
│     - 유형별 해설 섹션                                         │
└─────────────────────────────────────────────────────────────┘
```

## 6. 데이터 흐름

```
TSV 입력 → parseQuestionTSV() → questionList
                                      │
                                      ▼
                              Gemini API 호출
                                      │
                                      ▼
                         questionExplanations (Map)
                                      │
                                      ▼
                              ExplanationView
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            Quick Answer     유형별 섹션      지문 그룹
                              컴포넌트
                                      │
                                      ▼
                               A4PageLayout
                                      │
                                      ▼
                                PDF 다운로드
```

## 7. 유효성 규칙

| 필드 | 규칙 | 처리 방법 |
|------|------|----------|
| answer | ①-⑤ 또는 1-5 | `getAnswerNumber()` 변환 |
| passage 마크업 | `_word_`, `__________` | `formatPassageWithUnderline()` |
| choiceTranslations | 최대 5개 | 배열 길이 검증 |
| showTranslation | boolean | 기본값 true |

## 8. 관계도

```
QuestionItem 1 ──── 0..1 ExplanationData
      │
      │ (groupByPassage)
      ▼
PassageGroup 1 ──── 1..2 QuestionItem

App.tsx
  ├── questionList: QuestionItem[]
  ├── questionExplanations: Map<string, ExplanationData>
  └── showTranslation: boolean
          │
          └──→ ExplanationView (props)
                    │
                    ├──→ QuickAnswerTable
                    ├──→ VocabularySection
                    ├──→ GrammarSection
                    ├──→ LogicSection
                    ├──→ MainIdeaSection
                    ├──→ InsertionSection
                    ├──→ OrderSection
                    └──→ WordAppropriatenessSection
```
