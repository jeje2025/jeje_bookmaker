# 📚 AI 단어장 생성기

인쇄 친화적인 AI 기반 영어 단어장 생성 웹 애플리케이션

## ✨ 주요 기능

- **9가지 레이아웃**: 카드형, 표버전, 간단버전, 간단테스트, 동의어 테스트지/답지, 영영정의 테스트지/답지, 표지
- **AI 자동 생성**: Gemini API로 발음, 뜻, 영영정의, 동의어, 반의어, 파생어, 예문, 어원 자동 생성
- **인쇄 최적화**: A4 용지 최적화, 페이지 중간 분할 방지, 잉크 절약형 디자인
- **실시간 편집**: 미리보기에서 직접 텍스트 수정 가능
- **엑셀 입력**: 엑셀처럼 동작하는 단어 입력 시스템
- **양방향 동기화**: 사이드바 입력창 ↔ PDF 미리보기 실시간 동기화
- **관리자 대시보드**: AI 사용 기록 및 비용 분석
- **최근 생성 기록**: 최근 10개 생성 내역 저장 및 불러오기
- **메모리 최적화**: 이미지 lazy loading, 테스트 문제 캐싱, localStorage 최적화

## 🚀 배포 방법

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. Supabase CLI 설치:
   ```bash
   npm install -g supabase
   ```

3. 프로젝트 연결 및 Edge Functions 배포:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   supabase functions deploy server
   ```

4. Supabase 환경 변수 설정:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key
   ```

### 2. Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 Import Project
3. 환경 변수 설정:
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key
   
4. Deploy 클릭!

### 3. 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 📝 환경 변수

프로젝트에 필요한 환경 변수:

### Vercel (프론트엔드)
- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Anon 키

### Supabase (백엔드)
- `GEMINI_API_KEY`: Google Gemini API 키

## 🛠 기술 스택

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno + Hono)
- **AI**: Google Gemini 2.0 Flash
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel + Supabase

## 📄 라이선스

MIT License

## 🤝 기여

이슈와 PR을 환영합니다!