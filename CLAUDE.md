# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

제제 교재(JEJE Bookmaker)는 영어 학습 교재 생성 도구입니다. 편입/수능 영어 문제집, AI 기반 단어장, 구문 교재를 PDF로 출력합니다.

## 개발 명령어

```bash
npm install    # 의존성 설치
npm run dev    # 개발 서버 (http://localhost:3000)
npm run build  # 프로덕션 빌드 (dist/)
```

## 환경 변수

`.env` 파일에 설정:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## 아키텍처

### 3가지 앱 모드 (App.tsx에서 `appMode` 상태로 관리)

1. **문제집 모드 (`question`)**: 편입/수능 문제지, 해설지 생성
2. **단어장 모드 (`vocabulary`)**: AI 기반 단어장 (카드, 테스트지 등)
3. **구문교재 모드 (`grammar`)**: 문법 요소별 구문 분석 표

### 핵심 데이터 흐름

```
사용자 입력 (TSV) → QuestionInput.tsx 파싱 → App.tsx 상태 저장
                                              ↓
                              Gemini API (geminiExplanation.ts)
                                              ↓
                              해설/단어 생성 → PDF 렌더링 → 다운로드
```

### 주요 타입 (src/types/question.ts)

- `QuestionItem`: 문제 데이터 (id, passage, choices, answer 등)
- `ExplanationData`: AI 해설 타입 (7가지 유형별 유니온 타입)
  - `VocabularyExplanation`: 어휘(동의어)
  - `GrammarExplanation`: 문법
  - `LogicExplanation`: 빈칸/논리
  - `MainIdeaExplanation`: 제목/요지
  - `InsertionExplanation`: 삽입
  - `OrderExplanation`: 순서
  - `WordAppropriatenessExplanation`: 어휘 적절성

### 상태 관리

App.tsx에서 30개 이상의 상태를 직접 관리. 주요 상태:
- `questionList`: QuestionItem[]
- `questionExplanations`: Map<id, ExplanationData>
- `vocabularyList`: 단어 배열
- `viewMode`: 현재 뷰 모드
- `colorPalette`: Pantone 색상 테마
- `fontSize`: 글씨 크기 스케일

### AI 서비스 (src/services/geminiExplanation.ts)

- Google Gemini API 통합
- 문제 유형별 프롬프트 템플릿
- 배치 처리 및 번역 규칙 적용

### 컴포넌트 구조

- `src/components/ui/`: Radix UI 기반 공통 컴포넌트 (50+)
- `src/components/Question*.tsx`: 문제집 관련
- `src/components/Vocabulary*.tsx`: 단어장 관련
- `src/components/Grammar*.tsx`: 구문교재 관련
- `A4PageLayout.tsx`: A4 인쇄 레이아웃 (자동 페이지 분할)

### 백엔드 (Supabase Edge Functions)

`supabase/functions/make-server-7e289e1b/index.ts`: Hono.js 기반 API
- `/gemini/vocabulary-batch`: 단어장 배치 생성
- `/gemini/grammar-batch`: 구문 해설 배치 생성
- `/logs`, `/load-log/:logId`: 세션 저장/불러오기

## 코드 규칙

### 정답 형식
- 내부 저장: 숫자 (1, 2, 3, 4, 5)
- 화면 표시: 동그라미 (①, ②, ③, ④, ⑤) - `QuestionCard.tsx`, `ExplanationView.tsx`에서 변환

### 지문 마크업
- `_word_`: 밑줄 표시 (어휘 문제 출제 단어)
- `__________` (5개 이상 언더스코어): 빈칸

### PDF 생성
- `@react-pdf/renderer`: React 컴포넌트 → PDF
- `pdf-lib`: PDF 조작/병합
- Pretendard 한글 폰트 내장 (`public/fonts/`)
