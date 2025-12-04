# 🚀 배포 가이드 (상세 단계)

이 프로젝트를 Vercel에 배포하는 방법을 단계별로 설명합니다.

## 📋 사전 준비

- [GitHub](https://github.com) 계정
- [Vercel](https://vercel.com) 계정
- [Supabase](https://supabase.com) 계정
- [Google AI Studio](https://makersuite.google.com/app/apikey) Gemini API 키

---

## 1️⃣ Supabase 백엔드 설정

### 1.1 Supabase 프로젝트 생성

1. [Supabase Dashboard](https://app.supabase.com)에 접속
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 입력
4. Region 선택 (추천: Northeast Asia (Tokyo))
5. 프로젝트 생성 완료 대기 (1-2분)

### 1.2 프로젝트 정보 확인

프로젝트 대시보드에서 다음 정보를 복사해두세요:

- **Project URL**: `https://xxxxx.supabase.co`
- **Anon Key**: `eyJhbGc...` (Settings > API > anon public)
- **Project Ref**: `xxxxx` (URL의 subdomain 부분)

### 1.3 Edge Functions 배포

로컬 터미널에서:

```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. Supabase 로그인
supabase login

# 3. 프로젝트 디렉토리로 이동
cd your-project-folder

# 4. Supabase 프로젝트와 연결
supabase link --project-ref your-project-ref

# 5. Edge Functions 배포
supabase functions deploy server
```

### 1.4 환경 변수 설정 (Supabase)

```bash
# Gemini API 키 설정
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 2️⃣ GitHub 저장소 준비

### 2.1 새 GitHub 저장소 생성

1. [GitHub](https://github.com/new)에서 새 저장소 생성
2. 저장소 이름 입력 (예: `vocabulary-maker`)
3. Public/Private 선택
4. "Create repository" 클릭

### 2.2 코드 푸시

로컬에서:

```bash
# Git 초기화
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit"

# 원격 저장소 연결 (GitHub에서 제공하는 URL 사용)
git remote add origin https://github.com/your-username/vocabulary-maker.git

# 푸시
git branch -M main
git push -u origin main
```

---

## 3️⃣ Vercel 프론트엔드 배포

### 3.1 Vercel에서 Import

1. [Vercel Dashboard](https://vercel.com/new) 접속
2. "Import Git Repository" 선택
3. GitHub 계정 연결 (처음인 경우)
4. 방금 만든 저장소 선택 (`vocabulary-maker`)
5. "Import" 클릭

### 3.2 환경 변수 설정

"Environment Variables" 섹션에서 다음 변수들을 추가:

| Name | Value | Example |
|------|-------|---------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGc...` |

**중요**: 
- 이름에 `VITE_` 접두사 필수! (Vite 환경 변수 규칙)
- 모든 환경 (Production, Preview, Development)에 체크

### 3.3 배포

1. "Deploy" 버튼 클릭
2. 빌드 완료 대기 (1-2분)
3. 배포 완료! 🎉

---

## 4️⃣ 배포 후 확인

### 4.1 프론트엔드 확인

1. Vercel이 제공하는 URL 방문 (예: `https://vocabulary-maker.vercel.app`)
2. 단어 입력 후 "🤖 생성" 버튼 테스트
3. 레이아웃 전환 확인

### 4.2 백엔드 확인

1. 브라우저 콘솔(F12) 열기
2. Network 탭에서 API 요청 확인
3. `/functions/v1/make-server-7e289e1b/generate-word-info` 요청이 200 OK인지 확인

### 4.3 문제 해결

**API 요청 실패 시:**
- Supabase 환경 변수가 올바른지 확인
- Edge Functions가 제대로 배포되었는지 확인: `supabase functions list`
- GEMINI_API_KEY가 설정되었는지 확인: Supabase Dashboard > Edge Functions > server > Settings

**빌드 실패 시:**
- Vercel 환경 변수에 `VITE_` 접두사가 있는지 확인
- package.json이 올바르게 생성되었는지 확인

---

## 5️⃣ 업데이트 배포

코드를 수정한 후:

### 프론트엔드 업데이트
```bash
git add .
git commit -m "Update frontend"
git push
```
→ Vercel이 자동으로 재배포합니다!

### 백엔드 업데이트
```bash
supabase functions deploy server
```

---

## 📝 추가 설정 (선택사항)

### Custom Domain 연결

1. Vercel Dashboard > 프로젝트 선택 > Settings > Domains
2. 도메인 입력 (예: `vocabulary.yourdomain.com`)
3. DNS 레코드 설정 (Vercel이 안내)

### Analytics 설정

1. Vercel Dashboard > 프로젝트 선택 > Analytics
2. Enable Analytics

---

## 🆘 도움이 필요하신가요?

- Vercel 문서: https://vercel.com/docs
- Supabase 문서: https://supabase.com/docs
- Edge Functions 가이드: https://supabase.com/docs/guides/functions

---

## ✅ 체크리스트

배포 전 확인 사항:

- [ ] Supabase 프로젝트 생성 완료
- [ ] Edge Functions 배포 완료
- [ ] GEMINI_API_KEY 환경 변수 설정 완료
- [ ] GitHub 저장소에 코드 푸시 완료
- [ ] Vercel 환경 변수 설정 완료
- [ ] Vercel 배포 성공
- [ ] 프론트엔드 정상 작동 확인
- [ ] AI 생성 기능 테스트 완료

모든 항목이 체크되면 배포 완료입니다! 🎉
