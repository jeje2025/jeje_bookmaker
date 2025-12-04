# 제제보카 (2) 마이그레이션 가이드

## 개요
Aesthetic Vocabulary Layout에서 생성한 단어장 데이터를 제제보카 (2) 앱의 `shared_vocabularies`와 `shared_words` 테이블로 마이그레이션하는 기능입니다.

## 사용 방법

### 1. 관리자 대시보드 열기
1. Settings 아이콘을 4번 빠르게 클릭
2. 비밀번호 `1111` 입력
3. 관리자 대시보드가 열립니다

### 2. 마이그레이션할 데이터 선택
1. 테이블에서 마이그레이션하고 싶은 단어장 옆의 체크박스 선택
2. 여러 개를 선택할 수 있습니다
3. 전체 선택: 헤더의 체크박스 클릭

### 3. 마이그레이션 실행
1. "제제보카로 마이그레이션 (N)" 버튼 클릭
2. 다이얼로그에서 정보 입력:
   - **카테고리** (필수): 토익, 수능, 텝스, 편입 등
   - **난이도**: 초급, 중급, 고급 중 선택
3. "마이그레이션 시작" 버튼 클릭
4. 완료 메시지 확인

## 데이터 매핑

### shared_vocabularies 테이블
- `title` ← headerTitle
- `description` ← headerDescription
- `category` ← 사용자 입력 카테고리
- `difficulty_level` ← 사용자 선택 난이도
- `total_words` ← vocabularyList.length
- `language` ← 'english' (고정)

### shared_words 테이블
- `word` ← word
- `pronunciation` ← pronunciation
- `meaning` ← meaning
- `example_sentence` ← example
- `order_index` ← id

## API 엔드포인트

### 마이그레이션 API
```
POST https://vaufmrxfpynrvtvynhbh.supabase.co/functions/v1/make-server-7e289e1b/migrate
```

**요청 본문:**
```json
{
  "logIds": ["2025-11-18T12:34:56.789Z", "..."],
  "category": "토익",
  "difficultyLevel": "intermediate",
  "targetProjectId": "ooxinxuphknbfhbancgs",
  "targetAnonKey": "eyJhbGci..."
}
```

**응답:**
```json
{
  "success": true,
  "totalRequested": 2,
  "totalFound": 2,
  "totalMigrated": 2,
  "totalErrors": 0,
  "migratedVocabularies": [
    {
      "logId": "2025-11-18T12:34:56.789Z",
      "vocabularyId": "uuid",
      "title": "토익 필수 단어",
      "totalWords": 50
    }
  ]
}
```

### 학교별 필터링 API (선택사항)
```
GET https://vaufmrxfpynrvtvynhbh.supabase.co/functions/v1/make-server-7e289e1b/logs/filter?school=서울중
```

### 데이터 내보내기 API (선택사항)
```
GET https://vaufmrxfpynrvtvynhbh.supabase.co/functions/v1/make-server-7e289e1b/export?school=서울중
```

## 프로그래밍 방식 마이그레이션

JavaScript/TypeScript로 직접 마이그레이션할 수도 있습니다:

```typescript
const response = await fetch(
  'https://vaufmrxfpynrvtvynhbh.supabase.co/functions/v1/make-server-7e289e1b/migrate',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ANON_KEY'
    },
    body: JSON.stringify({
      logIds: ['timestamp1', 'timestamp2'],
      category: '토익',
      difficultyLevel: 'intermediate',
      targetProjectId: 'ooxinxuphknbfhbancgs',
      targetAnonKey: 'TARGET_ANON_KEY'
    })
  }
);

const result = await response.json();
console.log(`${result.totalMigrated}개 마이그레이션 완료!`);
```

## 주의사항

1. **중복 확인**: 같은 데이터를 여러 번 마이그레이션하면 중복 단어장이 생성됩니다
2. **권한**: 제제보카 (2)의 RLS 정책상 누구나 `shared_vocabularies`와 `shared_words`를 읽을 수 있지만, 쓰기는 제한될 수 있습니다
3. **데이터 검증**: vocabularyList가 없는 로그는 자동으로 스킵됩니다
4. **에러 처리**: 일부 항목이 실패해도 나머지는 계속 진행됩니다

## 트러블슈팅

### "마이그레이션할 데이터를 선택해주세요" 오류
→ 체크박스를 선택했는지 확인하세요

### "카테고리를 입력해주세요" 오류
→ 카테고리 필드가 비어있지 않은지 확인하세요

### "Failed to create vocabulary" 오류
→ 제제보카 (2)의 RLS 정책을 확인하세요
→ anon key가 올바른지 확인하세요

### 일부만 마이그레이션된 경우
→ 콘솔 로그에서 errors 배열을 확인하세요
→ vocabularyList가 있는지 확인하세요

## 확인 방법

마이그레이션 후 제제보카 (2) 앱에서 확인:

1. Supabase Dashboard: https://supabase.com/dashboard/project/ooxinxuphknbfhbancgs/editor
2. `shared_vocabularies` 테이블에서 새로 생성된 단어장 확인
3. `shared_words` 테이블에서 단어들이 올바르게 들어갔는지 확인

SQL로 확인:
```sql
-- 최근 생성된 단어장 확인
SELECT * FROM shared_vocabularies
ORDER BY created_at DESC
LIMIT 10;

-- 특정 단어장의 단어들 확인
SELECT * FROM shared_words
WHERE vocabulary_id = 'YOUR_VOCABULARY_ID'
ORDER BY order_index;
```
