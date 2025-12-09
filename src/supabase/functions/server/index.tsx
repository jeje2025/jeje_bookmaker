import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-7e289e1b/health", (c) => {
  return c.json({ status: "ok" });
});

// Gemini API를 통한 단어 정보 자동 생성 (배치 모드)
app.post("/make-server-7e289e1b/generate-word-info", async (c) => {
  try {
    console.log('=== 새로운 요청 시작 ===');
    
    // Body 파싱
    let body;
    try {
      body = await c.req.json();
      console.log('Body 파싱 성공:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.log('Body 파싱 실패:', parseError);
      return c.json({ success: false, error: 'Invalid JSON in request body' }, 400);
    }

    const { words } = body;

    console.log('words 타입:', typeof words);
    console.log('words isArray:', Array.isArray(words));
    console.log('words length:', words?.length);

    // 검증 1: words가 배열인지
    if (!words || !Array.isArray(words)) {
      console.log('❌ words가 배열이 아님');
      return c.json({ 
        success: false, 
        error: 'words must be an array',
        received: typeof words
      }, 400);
    }

    // 검증 2: words가 비어있지 않은지
    if (words.length === 0) {
      console.log('❌ words 배열이 비어있음');
      return c.json({ success: false, error: 'words array is empty' }, 400);
    }

    console.log('✅ words 배열 검증 통과:', words.length, '개');

    // 검증 3: 각 단어 객체 검증
    const validWords = [];
    const invalidWords = [];

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      console.log(`단어 ${i + 1}:`, JSON.stringify(w));

      if (!w || typeof w !== 'object') {
        console.log(`❌ 단어 ${i + 1}: 객체가 아님`);
        invalidWords.push({ index: i, reason: 'not an object', data: w });
        continue;
      }

      if (!w.word || typeof w.word !== 'string') {
        console.log(`❌ 단어 ${i + 1}: word 속성이 없거나 문자열이 아님`);
        invalidWords.push({ index: i, reason: 'word is not a string', data: w });
        continue;
      }

      if (w.word.trim() === '') {
        console.log(`❌ 단어 ${i + 1}: word가 빈 문자열`);
        invalidWords.push({ index: i, reason: 'word is empty', data: w });
        continue;
      }

      validWords.push(w);
      console.log(`✅ 단어 ${i + 1}: ${w.word}`);
    }

    if (invalidWords.length > 0) {
      console.log('❌ 유효하지 않은 단어들:', invalidWords);
      return c.json({ 
        success: false, 
        error: 'Some words are invalid',
        invalidWords 
      }, 400);
    }

    console.log('✅ 모든 단어 검증 통과:', validWords.length, '개');

    // Gemini API 키 확인
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.log('❌ GEMINI_API_KEY 없음');
      return c.json({ success: false, error: 'API key not configured' }, 500);
    }
    
    console.log('✅ API Key 확인:', apiKey.substring(0, 10) + '...');

    // 프롬프트 생성
    const wordList = validWords.map((w: any, idx: number) => 
      `${idx + 1}. "${w.word}"${w.meaning ? ` (뜻: ${w.meaning})` : ''}`
    ).join('\n');

    console.log('처리할 단어 목록:\n' + wordList);

    const prompt = `You are a professional English vocabulary expert. You will receive a list of English words and generate comprehensive information for each word.

INPUT WORDS:
${wordList}

TASK:
For EACH word, generate a JSON object with the following fields:

1. pronunciation: IPA phonetic notation (example: "/ˈwɜːrd/")
2. partOfSpeech: Part of speech abbreviation (examples: "n.", "v.", "adj.", "adv.", "v., n.")
3. meaning: Korean meaning WITH part of speech prefix for EACH meaning group. When a word has multiple parts of speech, prefix each meaning group with its part of speech. (example for single: "행복, 기쁨" / example for multiple: "v. 겹치다, 중복되다; n. 중복, 겹침")
4. definition: Short English definition in 8-12 words (example: "a feeling of great happiness and pleasure")
5. synonyms: Array of 3-5 English synonym strings (example: ["happy", "joyful", "glad"])
6. antonyms: Array of 2-3 English antonym strings (example: ["sad", "unhappy"])
7. derivatives: Array of 2-3 derivative word objects with format {word: "string", meaning: "Korean meaning"}
8. example: One natural English sentence using the word
9. translation: Korean translation of the example sentence
10. translationHighlight: The Korean word/phrase in the translation that corresponds to the main word
11. etymology: Interesting etymology story in Korean (1-2 sentences explaining the word's origin, roots, and original meaning)

CRITICAL REQUIREMENTS:
- definition MUST be a short, clear English definition in 8-12 words
- synonyms MUST be an array of strings: ["word1", "word2", "word3"]
- antonyms MUST be an array of strings: ["word1", "word2"]
- derivatives MUST be an array of objects: [{"word": "happiness", "meaning": "행복"}]
- etymology should be engaging and informative, showing word roots and meaning evolution
- Return a JSON array with ${validWords.length} objects
- Objects must be in the SAME ORDER as the input words
- Return ONLY valid JSON, NO markdown, NO code blocks, NO additional text

EXAMPLE OUTPUT FORMAT:
[
  {
    "pronunciation": "/ɪˈfemərəl/",
    "partOfSpeech": "adj.",
    "meaning": "일시적인, 덧없는",
    "definition": "lasting for a very short time",
    "synonyms": ["transient", "fleeting", "temporary", "brief"],
    "antonyms": ["permanent", "lasting", "eternal"],
    "derivatives": [
      {"word": "ephemerally", "meaning": "일시적으로"},
      {"word": "ephemerality", "meaning": "덧없음"}
    ],
    "example": "The beauty of cherry blossoms is ephemeral.",
    "translation": "벚꽃의 아름다움은 일시적이다.",
    "translationHighlight": "일시적",
    "etymology": "그리스어 'ephemeros'에서 유래. '하루 동안만 지속되는'이라는 의미."
  },
  {
    "pronunciation": "/nɒˈstældʒə/",
    "partOfSpeech": "n.",
    "meaning": "향수, 그리움",
    "definition": "a sentimental longing for the past",
    "synonyms": ["longing", "yearning", "reminiscence", "wistfulness"],
    "antonyms": ["indifference", "present-mindedness"],
    "derivatives": [
      {"word": "nostalgic", "meaning": "향수를 불러일으키는"},
      {"word": "nostalgically", "meaning": "향수에 젖어"}
    ],
    "example": "The old photos filled her with nostalgia.",
    "translation": "오래된 사진들이 그녀를 향수로 가득 채웠다.",
    "translationHighlight": "향수",
    "etymology": "그리스어 'nostos'(귀향)와 'algos'(고통)의 결합. 원래는 '향수병'을 의미."
  }
]

NOW GENERATE THE JSON ARRAY:`;

    console.log('🤖 Gemini API 호출 중...');
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192
          }
        })
      }
    );

    console.log('Gemini 응답 상태:', geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.log('❌ Gemini API 오류:', errorText);
      return c.json({ 
        success: false, 
        error: 'Gemini API request failed',
        details: errorText,
        status: geminiResponse.status
      }, 500);
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini 응답 받음');
    
    // 토큰 사용량 추출
    const inputTokens = geminiData.usageMetadata?.promptTokenCount || 0;
    const outputTokens = geminiData.usageMetadata?.candidatesTokenCount || 0;
    console.log(`📊 토큰 사용량 - 입력: ${inputTokens}, 출력: ${outputTokens}`);
    
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.log('❌ 생성된 텍스트 없음');
      console.log('전체 응답:', JSON.stringify(geminiData, null, 2));
      return c.json({ 
        success: false, 
        error: 'No content generated',
        fullResponse: geminiData 
      }, 500);
    }

    console.log('생성된 텍스트 길이:', generatedText.length);
    console.log('생성된 텍스트 미리보기:', generatedText.substring(0, 200));

    // JSON 파싱
    let cleanedText = generatedText.trim();
    
    // 마크다운 코드 블록 제거
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    
    cleanedText = cleanedText.trim();
    
    console.log('정리된 텍스트 미리보기:', cleanedText.substring(0, 200));
    
    let wordInfoArray;
    try {
      wordInfoArray = JSON.parse(cleanedText);
      console.log('✅ JSON 파싱 성공');
    } catch (parseError) {
      console.log('❌ JSON 파싱 실패:', parseError);
      console.log('파싱 시도한 텍스트:', cleanedText);
      return c.json({ 
        success: false, 
        error: 'Failed to parse JSON',
        parseError: String(parseError),
        rawText: cleanedText.substring(0, 500)
      }, 500);
    }
    
    if (!Array.isArray(wordInfoArray)) {
      console.log('❌ 결과가 배열이 아님');
      return c.json({ 
        success: false, 
        error: 'Result is not an array',
        type: typeof wordInfoArray
      }, 500);
    }
    
    console.log('✅ 최종 결과:', wordInfoArray.length, '개 단어 정보 생성 완료');
    
    return c.json({ 
      success: true, 
      data: wordInfoArray,
      inputTokens,
      outputTokens
    });

  } catch (error) {
    console.log('❌ 예상치 못한 오류:', error);
    console.log('Error stack:', error.stack);
    return c.json({ 
      success: false, 
      error: 'Unexpected server error',
      message: String(error),
      stack: error.stack 
    }, 500);
  }
});

// 사용 로그 저장
app.post("/make-server-7e289e1b/log", async (c) => {
  try {
    const body = await c.req.json();
    const { timestamp, headerTitle, headerDescription, footerLeft, footerRight, viewMode, wordCount, vocabularyList, inputTokens, outputTokens } = body;

    // vocabularyList가 있는지 확인하고 로깅
    const hasVocabularyList = vocabularyList && Array.isArray(vocabularyList) && vocabularyList.length > 0;
    console.log(`Saving log: ${timestamp}, wordCount: ${wordCount}, vocabularyList: ${hasVocabularyList ? `${vocabularyList.length} words` : 'missing'}`);

    // KV 스토어에 저장 (키: log_타임스탬프) - vocabularyList 및 토큰 정보 포함
    const key = `log_${timestamp}`;
    const logData = {
      id: timestamp,
      timestamp,
      headerTitle: headerTitle || '',
      headerDescription: headerDescription || '',
      footerLeft: footerLeft || '',
      footerRight: footerRight || '',
      viewMode: viewMode || '',
      wordCount: wordCount || 0,
      vocabularyList: vocabularyList || [], // 전체 단어 목록 저장 (모든 단어 정보 포함)
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0
    };

    await kv.set(key, logData);
    console.log(`Log saved successfully: ${key}, vocabularyList size: ${hasVocabularyList ? vocabularyList.length : 0}`);

    return c.json({ success: true, saved: true, vocabularyListCount: hasVocabularyList ? vocabularyList.length : 0 });
  } catch (error) {
    console.error('Error saving log:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 최근 로그 메타데이터 조회 (vocabularyList 제외, 무한 저장 가능)
app.get("/make-server-7e289e1b/recent-logs", async (c) => {
  try {
    // log_ 프리픽스로 모든 로그 가져오기
    const logs = await kv.getByPrefix('log_');
    
    // 타임스탬프로 정렬 (최신순)
    const sortedLogs = logs.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // 쿼리 파라미터로 개수 제한 (기본값: 50개)
    const limit = parseInt(c.req.query('limit') || '50');
    
    // 메타데이터만 반환 (vocabularyList 제외하여 가볍게)
    const recentLogs = sortedLogs.slice(0, limit).map(log => ({
      id: log.timestamp,
      timestamp: log.timestamp,
      headerTitle: log.headerTitle,
      headerDescription: log.headerDescription,
      viewMode: log.viewMode,
      wordCount: log.wordCount
    }));

    return c.json({ logs: recentLogs, total: sortedLogs.length });
  } catch (error) {
    console.log('Error fetching recent logs:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 특정 로그 로드 (vocabularyList 포함)
app.get("/make-server-7e289e1b/load-log/:id", async (c) => {
  try {
    const rawLogId = c.req.param('id');
    // URL에서 + 기호가 공백으로 변환되는 문제 해결
    const logId = decodeURIComponent(rawLogId.replace(/\+/g, '%2B'));
    const key = `log_${logId}`;

    console.log('Loading log with key:', key);

    const log = await kv.get(key);

    if (!log) {
      return c.json({ success: false, error: 'Log not found' }, 404);
    }

    // 전체 log 객체를 반환
    return c.json({
      success: true,
      log: {
        id: log.id || logId,
        timestamp: log.timestamp,
        headerTitle: log.headerTitle,
        headerDescription: log.headerDescription,
        footerLeft: log.footerLeft,
        footerRight: log.footerRight,
        viewMode: log.viewMode,
        wordCount: log.wordCount,
        vocabularyList: log.vocabularyList || [],
        inputTokens: log.inputTokens,
        outputTokens: log.outputTokens
      }
    });
  } catch (error) {
    console.log('Error loading log:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 모든 사용 로그 조회
app.get("/make-server-7e289e1b/logs", async (c) => {
  try {
    // log_ 프리픽스로 모든 로그 가져오기
    const logs = await kv.getByPrefix('log_');

    // 타임스탬프로 정렬 (최신순)
    const sortedLogs = logs.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // 페이지네이션 파라미터 처리
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // offset과 limit 적용
    const paginatedLogs = sortedLogs.slice(offset, offset + limit);

    return c.json({ logs: paginatedLogs, total: sortedLogs.length });
  } catch (error) {
    console.log('Error fetching logs:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 학교명으로 데이터 필터링 (headerTitle 기준)
app.get("/make-server-7e289e1b/logs/filter", async (c) => {
  try {
    const schoolName = c.req.query('school');
    const format = c.req.query('format') || 'json'; // json 또는 csv

    if (!schoolName) {
      return c.json({ success: false, error: 'school parameter is required' }, 400);
    }

    // 모든 로그 가져오기
    const logs = await kv.getByPrefix('log_');

    // 학교명으로 필터링 (headerTitle에 학교명 포함된 것만)
    const filteredLogs = logs.filter(log =>
      log.headerTitle && log.headerTitle.includes(schoolName)
    );

    // 최신순 정렬
    const sortedLogs = filteredLogs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    console.log(`Filtered ${sortedLogs.length} logs for school: ${schoolName}`);

    // JSON 형식으로 반환
    if (format === 'json') {
      return c.json({
        success: true,
        school: schoolName,
        total: sortedLogs.length,
        logs: sortedLogs
      });
    }

    // CSV 형식으로 반환
    if (format === 'csv') {
      const csvRows = [];

      // CSV 헤더
      csvRows.push([
        'timestamp',
        'headerTitle',
        'headerDescription',
        'footerLeft',
        'viewMode',
        'wordCount',
        'inputTokens',
        'outputTokens',
        'vocabularyList'
      ].join(','));

      // 데이터 행
      sortedLogs.forEach(log => {
        csvRows.push([
          log.timestamp || '',
          `"${(log.headerTitle || '').replace(/"/g, '""')}"`,
          `"${(log.headerDescription || '').replace(/"/g, '""')}"`,
          `"${(log.footerLeft || '').replace(/"/g, '""')}"`,
          log.viewMode || '',
          log.wordCount || 0,
          log.inputTokens || 0,
          log.outputTokens || 0,
          `"${JSON.stringify(log.vocabularyList || []).replace(/"/g, '""')}"`
        ].join(','));
      });

      const csvContent = csvRows.join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="school_${schoolName}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return c.json({ success: false, error: 'Invalid format. Use json or csv' }, 400);
  } catch (error) {
    console.log('Error filtering logs:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 마이그레이션용 전체 데이터 내보내기 (vocabularyList 포함)
app.get("/make-server-7e289e1b/export", async (c) => {
  try {
    const schoolName = c.req.query('school'); // 선택적: 특정 학교만

    // 모든 로그 가져오기
    let logs = await kv.getByPrefix('log_');

    // 학교명 필터링 (옵션)
    if (schoolName) {
      logs = logs.filter(log =>
        log.headerTitle && log.headerTitle.includes(schoolName)
      );
    }

    // 타임스탬프로 정렬 (최신순)
    const sortedLogs = logs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // 마이그레이션에 필요한 전체 데이터 반환
    const exportData = {
      exportDate: new Date().toISOString(),
      school: schoolName || 'all',
      totalRecords: sortedLogs.length,
      data: sortedLogs.map(log => ({
        timestamp: log.timestamp,
        headerTitle: log.headerTitle,
        headerDescription: log.headerDescription,
        footerLeft: log.footerLeft,
        footerRight: log.footerRight,
        viewMode: log.viewMode,
        wordCount: log.wordCount,
        inputTokens: log.inputTokens || 0,
        outputTokens: log.outputTokens || 0,
        vocabularyList: log.vocabularyList || []
      }))
    };

    console.log(`Exporting ${sortedLogs.length} records${schoolName ? ` for school: ${schoolName}` : ''}`);

    return c.json(exportData);
  } catch (error) {
    console.log('Error exporting data:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 제제보카 (2)로 마이그레이션
app.post("/make-server-7e289e1b/migrate", async (c) => {
  try {
    const body = await c.req.json();
    const {
      logIds,           // 마이그레이션할 로그 ID들 (배열)
      category,         // '토익', '수능', '텝스' etc.
      difficultyLevel,  // 'beginner', 'intermediate', 'advanced'
      targetProjectId,  // 제제보카 (2)의 프로젝트 ID
      targetAnonKey     // 제제보카 (2)의 anon key
    } = body;

    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return c.json({ success: false, error: 'logIds array is required' }, 400);
    }

    if (!targetProjectId || !targetAnonKey) {
      return c.json({ success: false, error: 'targetProjectId and targetAnonKey are required' }, 400);
    }

    console.log(`Starting migration for ${logIds.length} logs...`);

    // 모든 로그 가져오기
    const allLogs = await kv.getByPrefix('log_');

    // 선택된 로그만 필터링
    const selectedLogs = allLogs.filter(log =>
      logIds.includes(log.timestamp) || logIds.includes(log.id)
    );

    if (selectedLogs.length === 0) {
      return c.json({ success: false, error: 'No matching logs found' }, 404);
    }

    console.log(`Found ${selectedLogs.length} logs to migrate`);

    const migratedVocabularies = [];
    const errors = [];

    // 각 로그를 순회하며 마이그레이션
    for (const log of selectedLogs) {
      try {
        if (!log.vocabularyList || log.vocabularyList.length === 0) {
          console.log(`Skipping log ${log.timestamp}: no vocabulary list`);
          errors.push({ logId: log.timestamp, error: 'No vocabulary list' });
          continue;
        }

        // 1. shared_vocabularies에 단어장 생성
        const vocabularyData = {
          title: log.headerTitle || 'Untitled',
          description: log.headerDescription || '',
          language: 'english',
          difficulty_level: difficultyLevel || 'intermediate',
          total_words: log.vocabularyList.length,
          category: category || log.footerLeft || ''
        };

        console.log(`Creating vocabulary: ${vocabularyData.title}`);

        const vocabResponse = await fetch(
          `https://${targetProjectId}.supabase.co/rest/v1/shared_vocabularies`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${targetAnonKey}`,
              'apikey': targetAnonKey,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(vocabularyData)
          }
        );

        if (!vocabResponse.ok) {
          const errorText = await vocabResponse.text();
          console.error(`Failed to create vocabulary: ${errorText}`);
          errors.push({ logId: log.timestamp, error: `Failed to create vocabulary: ${errorText}` });
          continue;
        }

        const createdVocabulary = await vocabResponse.json();
        const vocabularyId = createdVocabulary[0]?.id;

        if (!vocabularyId) {
          console.error('No vocabulary ID returned');
          errors.push({ logId: log.timestamp, error: 'No vocabulary ID returned' });
          continue;
        }

        console.log(`Created vocabulary with ID: ${vocabularyId}`);

        // 2. shared_words에 단어들 삽입
        const wordsData = log.vocabularyList.map((word: any, index: number) => ({
          vocabulary_id: vocabularyId,
          word: word.word || '',
          pronunciation: word.pronunciation || '',
          meaning: word.meaning || '',
          example_sentence: word.example || '',
          order_index: word.id || index + 1
        }));

        console.log(`Inserting ${wordsData.length} words...`);

        const wordsResponse = await fetch(
          `https://${targetProjectId}.supabase.co/rest/v1/shared_words`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${targetAnonKey}`,
              'apikey': targetAnonKey,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(wordsData)
          }
        );

        if (!wordsResponse.ok) {
          const errorText = await wordsResponse.text();
          console.error(`Failed to insert words: ${errorText}`);
          errors.push({ logId: log.timestamp, error: `Failed to insert words: ${errorText}` });
          continue;
        }

        const insertedWords = await wordsResponse.json();
        console.log(`Successfully inserted ${insertedWords.length} words`);

        migratedVocabularies.push({
          logId: log.timestamp,
          vocabularyId: vocabularyId,
          title: vocabularyData.title,
          totalWords: wordsData.length
        });

      } catch (error) {
        console.error(`Error migrating log ${log.timestamp}:`, error);
        errors.push({ logId: log.timestamp, error: String(error) });
      }
    }

    const result = {
      success: true,
      totalRequested: logIds.length,
      totalFound: selectedLogs.length,
      totalMigrated: migratedVocabularies.length,
      totalErrors: errors.length,
      migratedVocabularies,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Migration completed:', result);

    return c.json(result);

  } catch (error) {
    console.error('Migration error:', error);
    return c.json({
      success: false,
      error: 'Migration failed',
      details: String(error)
    }, 500);
  }
});

Deno.serve(app.fetch);