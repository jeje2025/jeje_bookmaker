# 제제 교재 (JEJE Transfer Workbook Generator)

영어 학습 교재 및 문제집 생성 도구입니다. AI 기반 단어장 생성, 문제집/해설지 제작, 구문 교재 생성 등 다양한 학습 자료를 PDF로 출력할 수 있습니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프론트엔드** | React 18, TypeScript, Vite 6 |
| **UI** | Radix UI, Tailwind CSS 4, Lucide Icons |
| **백엔드** | Supabase Edge Functions (Deno), Hono.js |
| **AI** | Google Gemini API |
| **PDF** | pdf-lib, html2canvas |
| **배포** | Vercel (프론트엔드), Supabase (백엔드) |

---

## 앱 모드

앱은 3가지 모드를 지원합니다:

### 1. 문제집 모드 (Question Mode)

편입/수능 영어 기출문제를 분석하고 문제지/해설지를 생성합니다.

**뷰 모드:**
- **문제지** - 문제 + 유형별 분석 사이드바 (Final Pick 스타일)
- **해설지** - 정답 표시 포함 버전
- **어휘 문제지** - 어휘 유형 문제의 단어만 추출하여 표 형태로 출력

**레이아웃 특징 (Final Pick 스타일):**
```
┌─────────────────────────────────────────────────────────┐
│ [HEADER] FINAL Pick 로고 + 학교/연도 라벨               │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌──────────────────┐   │
│  │      문제 영역 (좌측)        │  │  사이드바 (우측)  │   │
│  │      약 60% 너비            │  │   약 40% 너비    │   │
│  │                            │  │                  │   │
│  │  [번호] 지문...             │  │  유형별 힌트 박스 │   │
│  │  ① ② ③ ④ 선지             │  │                  │   │
│  └────────────────────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ [FOOTER] JEJE TRANSFER + 페이지 번호                    │
└─────────────────────────────────────────────────────────┘
```

**유형별 사이드바 힌트:**

| 유형 | 사이드바 내용 |
|------|--------------|
| 어휘 (동의어) | MY VOCA 리스트 (체크박스 + 번호 + 빈칸) |
| 문법 | 1단계: 출제 포인트 파악 → 2단계: 알고리즘 분석 → Feed Back |
| 빈칸/논리 | 1단계: 빈칸 정체성 파악 → 2단계: 단서 수집 (시그널) → Feed Back |
| 대의파악 (제목/요지) | 중심 소재 + 중심 내용 파악 → Feed Back |
| 어휘 적절성/밑줄 추론 | 1단계: 중심 소재 파악 → 2단계: 각 보기 반의어 의심 → Feed Back |

**지문 마크업:**
- `_word_` → 밑줄 표시 (어휘 문제의 출제 단어)
- `__________` (5개 이상 언더스코어) → 빈칸 표시

---

### 2. 단어장 모드 (Vocabulary Mode)

AI 기반 영어 단어 학습 자료를 생성합니다.

**뷰 모드:**
- **카드형** - 단어별 상세 카드 레이아웃 (발음, 뜻, 예문, 어원 등)
- **표버전** - 전체 정보 표 형식
- **간단** - 미니멀 학습용 표 (번호 + 단어 + 뜻)
- **간단 테스트** - 뜻 가림 버전
- **동의어 테스트** - 동의어 보기 중 정답 찾기
- **영영 테스트** - 영영 정의 보기 중 정답 찾기
- **동의어 답지** / **영영 답지** - 각 테스트의 정답지
- **표지** - 학습 가이드 표지 (사진/그라데이션/미니멀 스타일)

**단어 데이터 구조:**
```typescript
interface VocabularyItem {
  id: number;
  word: string;           // 단어
  pronunciation: string;  // 발음 기호
  partOfSpeech: string;   // 품사
  meaning: string;        // 한글 뜻
  definition?: string;    // 영영 정의
  synonyms: string[];     // 동의어
  antonyms: string[];     // 반의어
  derivatives: Array<{    // 파생어
    word: string;
    meaning: string;
    partOfSpeech?: string;
  }>;
  example: string;        // 예문
  translation: string;    // 예문 번역
  etymology: string;      // 어원
}
```

---

### 3. 구문교재 모드 (Grammar Mode)

문법 요소별 구문 분석 교재를 생성합니다.

**지원 문법 유형:**
- 관계사 (관계대명사, 관계부사)
- 분사구문
- 가정법
- 비교구문
- 도치
- 강조
- 접속사
- 기타

---

## 프로젝트 구조

```
src/
├── App.tsx                        # 메인 앱 컴포넌트 (3가지 모드 관리)
├── main.tsx                       # 엔트리 포인트
├── index.css                      # Tailwind 진입점
├── styles/
│   └── globals.css               # 전역 스타일 (인쇄, 문제집 레이아웃 등)
│
├── types/
│   └── question.ts               # 문제집 타입 정의
│
├── utils/
│   ├── fontScale.ts              # 글씨 크기 스케일 헬퍼
│   ├── pdfDownload.ts            # PDF 다운로드 유틸
│   └── supabase/
│       └── info.tsx              # Supabase 연결 정보
│
└── components/
    ├── ui/                       # Radix UI 기반 공통 컴포넌트
    │
    ├── A4PageLayout.tsx          # A4 인쇄 레이아웃 (자동 페이지 분할)
    ├── HeaderFooter.tsx          # 헤더/푸터 컴포넌트
    │
    │ # 문제집 관련
    ├── QuestionInput.tsx         # 문제 데이터 입력 (TSV 파싱, 엑셀 그리드)
    ├── QuestionCard.tsx          # 개별 문제 카드 (Final Pick 스타일)
    ├── QuestionView.tsx          # 문제집 뷰 (그룹핑 + 사이드바)
    │
    │ # 단어장 관련
    ├── VocabularyInput.tsx       # 단어 입력 (AI 생성 지원)
    ├── VocabularyView.tsx        # 단어장 뷰 라우터
    ├── VocabularyCard.tsx        # 단어 카드 뷰
    ├── VocabularyTable.tsx       # 단어 표 뷰
    ├── VocabularyTableSimple.tsx # 간단 표 뷰
    ├── VocabularyTableSimpleTest.tsx # 간단 테스트 뷰
    ├── VocabularyTest.tsx        # 동의어 테스트지
    ├── VocabularyTestAnswer.tsx  # 동의어 답지
    ├── VocabularyTestDefinition.tsx   # 영영 테스트지
    ├── VocabularyTestDefinitionAnswer.tsx # 영영 답지
    ├── VocabularyCover.tsx       # 학습 가이드 표지
    │
    │ # 구문교재 관련
    ├── GrammarSelector.tsx       # 문법 요소 선택기
    ├── GrammarTable.tsx          # 구문 분석 표
    │
    │ # 설정/유틸
    ├── ColorPaletteSelector.tsx  # 컬러 팔레트 선택기 (Pantone 색상)
    ├── FontSizeSelector.tsx      # 글씨 크기 선택기
    ├── UnitSplitButton.tsx       # 유닛 분할 설정
    ├── AdminDashboard.tsx        # 관리자 대시보드
    └── PDFSaveModal.tsx          # PDF 저장 모달

supabase/
└── functions/
    └── make-server-7e289e1b/     # Edge Function
        ├── index.ts              # API 핸들러 (Gemini 연동)
        └── kv_store.ts           # KV 스토어 유틸
```

---

## 문제 데이터 형식

### TSV 입력 형식 (QuestionInput)

```
ID	연도	번호	대분류	소분류	발문	지문	①	②	③	④	⑤	정답
2025_DGU_01	2025	1	어휘	동의어	Choose the word closest in meaning...	Perhaps the Japanese commitment... _maverick_ creativity...	orthodox	adulator	zealot	iconoclast		④
```

### QuestionItem 타입

```typescript
interface QuestionItem {
  id: string;              // 고유번호 (예: 2025_DGU_01)
  year: number;            // 연도
  questionNumber: number;  // 문제 번호
  categoryMain: string;    // 유형 대분류 (어휘, 문법, 논리, 대의 파악, 빈칸, 정보 파악)
  categorySub: string;     // 유형 소분류 (동의어, 밑줄형, 제목, 요지 등)
  instruction: string;     // 발문
  passage: string;         // 지문 (_word_ 밑줄, __________ 빈칸)
  choices: string[];       // 보기 5개
  answer: string;          // 정답 (①~⑤)
}
```

---

## 설정 옵션

### 컬러 팔레트

Pantone 올해의 색상 기반:
- Viva Magenta (2023)
- Very Peri (2022)
- Ultimate Gray (2021)
- Classic Blue (2020)
- Living Coral (2019)
- 기타...

### 글씨 크기

- 아주 작게 (0.85x)
- 작게 (0.9x)
- 보통 (1.0x) - 기본값
- 크게 (1.1x)
- 아주 크게 (1.2x)

### 유닛 분할

- 10개씩 / 20개씩 / 30개씩 / 50개씩
- PDF 저장 시 유닛별 개별 파일 생성

---

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 http://localhost:3000 에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

`dist/` 폴더에 빌드 결과물이 생성됩니다.

---

## 환경 변수

Vercel 배포 시 다음 환경 변수를 설정하세요:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `/generate-word-info` | AI 단어 정보 생성 (Gemini) |
| `/log` | 단어 세션 저장 |
| `/logs` | 최근 세션 목록 조회 |
| `/load-log/{id}` | 특정 세션 불러오기 |
| `/migrate` | 데이터 마이그레이션 |

---

## CSS 클래스 가이드

### 문제집 레이아웃

```css
/* 문제 그룹 레이아웃 (6:4 비율) */
.question-group-layout { display: flex; gap: 20px; }
.questions-column { flex: 6; }
.sidebar-column { flex: 4; }

/* 문제 컴팩트 스타일 */
.question-compact { margin-bottom: 12px; }
.instruction-line { border-bottom: 1px solid #333; }
.question-row { display: flex; gap: 8px; }
.q-number { color: var(--badge-text); font-weight: 700; }
.q-passage { text-align: justify; }
.q-choices { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.q-choice.correct { font-weight: 600; color: var(--badge-text); }

/* MY VOCA 사이드바 */
.myvoca-sidebar { }
.myvoca-title { text-align: center; letter-spacing: 3px; }
.myvoca-row { display: flex; align-items: center; gap: 4px; }
.myvoca-check { font-size: 7px; }
.myvoca-num { color: var(--badge-text); }
.myvoca-line { flex: 1; border-bottom: 1px solid #ddd; }

/* 분석 사이드바 */
.analysis-sidebar { display: flex; flex-direction: column; gap: 8px; }
.analysis-section-title { color: var(--badge-text); font-weight: 500; }
.analysis-box-sm { min-height: 40px; background: #f8f8f8; }
.analysis-box-md { min-height: 60px; background: #f8f8f8; }
.analysis-box-lg { min-height: 80px; background: #f8f8f8; }
```

### CSS 변수 (테마)

```css
:root {
  --badge-bg: #f1f5f9;      /* 배지 배경 */
  --badge-border: #cbd5e1;  /* 배지 테두리 */
  --badge-text: #9b59b6;    /* 주요 강조색 (보라색) */
  --font-scale: 1;          /* 글씨 크기 배율 */
}
```

---

## 참고 문서

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 상세 배포 가이드
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - 데이터 마이그레이션 가이드

---

## 라이선스

Private - Made by 제제샘
