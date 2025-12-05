# 제제보카 (Aesthetic Vocabulary Layout)

AI 기반 영어 단어 학습 자료 생성 도구입니다. Google Gemini API를 활용하여 단어 정보를 자동 생성하고, 다양한 형식의 인쇄용 학습 자료(PDF)를 만들 수 있습니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프론트엔드** | React 18, TypeScript, Vite |
| **UI** | Radix UI, Tailwind CSS, Lucide Icons |
| **백엔드** | Supabase Edge Functions (Deno), Hono.js |
| **AI** | Google Gemini API |
| **배포** | Vercel (프론트엔드), Supabase (백엔드) |

## 주요 기능

- **AI 단어 정보 생성**: 발음, 정의, 예문, 어원 자동 생성
- **다양한 뷰 모드**:
  - 카드형 - 단어별 상세 카드 레이아웃
  - 표버전 - 전체 정보 표 형식
  - 간단버전 - 미니멀 학습용 표
  - 테스트지 - 동의어/정의 테스트 페이퍼
  - 표지 - 학습 가이드 표지 (사진/그라데이션/미니멀 스타일)
- **PDF 출력**: 인쇄 최적화된 A4 레이아웃
- **데이터 관리**: Supabase + localStorage 연동
- **관리자 대시보드**: 데이터 분석 및 관리

## 프로젝트 구조

```
src/
├── components/                # React 컴포넌트
│   ├── ui/                   # Radix UI 기반 공통 컴포넌트
│   ├── VocabularyCard.tsx    # 단어 카드 뷰
│   ├── VocabularyTable.tsx   # 단어 표 뷰
│   ├── VocabularyTableSimple.tsx  # 간단 표 뷰
│   ├── VocabularyTest.tsx    # 동의어 테스트지
│   ├── VocabularyTestDefinition.tsx  # 정의 테스트지
│   ├── VocabularyCover.tsx   # 학습 가이드 표지
│   ├── VocabularyInput.tsx   # 단어 입력 인터페이스
│   ├── AdminDashboard.tsx    # 관리자 패널
│   ├── A4PageLayout.tsx      # A4 인쇄 레이아웃
│   └── PDFSaveModal.tsx      # PDF 내보내기 모달
├── styles/                    # 전역 스타일
├── utils/                     # 유틸리티 함수
├── App.tsx                    # 메인 앱 컴포넌트
└── main.tsx                   # 엔트리 포인트

supabase/
└── functions/
    └── make-server-7e289e1b/  # Edge Function
        ├── index.ts          # API 핸들러 (Gemini 연동)
        └── kv_store.ts       # KV 스토어 유틸
```

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

## 환경 변수

Vercel 배포 시 다음 환경 변수를 설정하세요:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `/generate-word-info` | AI 단어 정보 생성 |
| `/log` | 단어 세션 저장 |
| `/logs` | 최근 세션 목록 조회 |
| `/load-log/{id}` | 특정 세션 불러오기 |
| `/migrate` | 데이터 마이그레이션 |

## 참고 문서

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 상세 배포 가이드
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - 데이터 마이그레이션 가이드

## 라이선스

Private
