import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Supabase 클라이언트
const supabase = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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

// 단일 배치를 Gemini API로 처리하는 헬퍼 함수
async function processGeminiBatch(validWords: any[], apiKey: string, batchIndex: number): Promise<{
  success: boolean;
  data?: any[];
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}> {
  const wordList = validWords.map((w: any, idx: number) => {
    let entry = `${idx + 1}. "${w.word}"`;
    const provided: string[] = [];
    if (w.meaning) provided.push(`뜻: ${w.meaning}`);
    if (w.synonyms) provided.push(`동의어: ${w.synonyms}`);
    if (w.antonyms) provided.push(`반의어: ${w.antonyms}`);
    if (w.derivatives) provided.push(`파생어: ${w.derivatives}`);
    if (w.example) provided.push(`예문: ${w.example}`);
    if (w.translation) provided.push(`번역: ${w.translation}`);
    if (provided.length > 0) {
      entry += ` (${provided.join(', ')})`;
    }
    return entry;
  }).join('\n');

  const prompt = `You are a professional English vocabulary expert. You will receive a list of English words with some pre-filled data. Generate ONLY the missing information.

INPUT WORDS (with any pre-filled data in parentheses):
${wordList}

TASK:
For EACH word, generate a JSON object. IMPORTANT RULES:
- If data is provided in parentheses (뜻, 동의어, 반의어, 파생어, 예문, 번역), USE IT AS-IS without modification
- Only generate data for fields that are NOT provided
- For derivatives (파생어): If only derivative words are provided without meanings, generate the Korean meaning AND part of speech for each

FIELDS TO GENERATE (only if not provided):
1. word: The original input word (MUST include)
2. pronunciation: IPA phonetic notation (example: "/ˈwɜːrd/")
3. partOfSpeech: Part of speech in Korean (examples: "n.", "v.", "adj.", "adv.")
4. meaning: Korean meaning
5. definition: Short English definition in 8-12 words
6. synonyms: Array of 3-5 English synonym strings
7. antonyms: Array of 2-3 English antonym strings
8. derivatives: List based PURELY on ACTUAL real-world usage frequency
   FORMAT: {"word": "string", "meaning": "Korean meaning", "partOfSpeech": "n./v./adj./adv./idiom/phrasal v."}

   INCLUDE IF AND ONLY IF commonly used in real English:
   - Suffixed forms (-tion, -ness, -ly, -ment, -able, -ive, -er, etc.)
   - Prefixed forms (un-, dis-, re-, im-, in-, mis-, etc.)
   - Phrasal verbs (verb + preposition)
   - Compound words

   CRITICAL: The count varies by word based on ACTUAL usage:
   - "run" has MANY derivatives (runner, running, run out, run into, run away, run over, rerun, outrun, runaway, runway...)
   - "happy" has several (happiness, happily, unhappy, unhappiness, unhappily)
   - "compel" has some (compelling, compelled, compulsion, compulsive, compulsively, compulsory, compulsorily)
   - Some rare words may have 0 or 1 derivative

   DO NOT artificially limit or pad the count. Just include what ACTUALLY exists and is commonly used.
9. example: One natural English sentence using the word
10. translation: Korean translation of the example sentence
11. translationHighlight: The Korean word/phrase corresponding to the main word
12. etymology: REQUIRED - Interesting etymology, memory tip, or word origin in Korean (1-2 sentences)
    MUST ALWAYS INCLUDE. Examples:
    - 어원: "라틴어 'compellere'(강제로 몰아가다)에서 유래"
    - 암기 팁: "com(함께) + pel(밀다) = 함께 밀어붙이다 → 강요하다"
    - 연상법: "happy의 'hap'은 운(luck)을 의미, 운이 좋으면 행복하다"
    - 관련어: "port(나르다)가 들어간 단어들: import, export, transport, portable"
    This field is MANDATORY for EVERY word. Never leave it empty.

CRITICAL REQUIREMENTS:
- PRESERVE user-provided data exactly as given
- For derivatives: user may provide just words (e.g., "runner, running"), you must add meaning AND partOfSpeech
- derivatives MUST be array of: [{"word": "happiness", "meaning": "행복", "partOfSpeech": "n."}]
- synonyms/antonyms: if user provided comma-separated string, convert to array
- etymology: MUST be non-empty for EVERY word (어원, 암기 팁, 연상법 등)
- Return a JSON array with ${validWords.length} objects in SAME ORDER
- Return ONLY valid JSON, NO markdown, NO code blocks

NOW GENERATE THE JSON ARRAY:`;

  try {
    console.log(`🤖 배치 ${batchIndex + 1}: Gemini API 호출 중... (${validWords.length}개 단어)`);

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

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.log(`❌ 배치 ${batchIndex + 1}: Gemini API 오류:`, errorText);
      return { success: false, error: errorText };
    }

    const geminiData = await geminiResponse.json();
    const inputTokens = geminiData.usageMetadata?.promptTokenCount || 0;
    const outputTokens = geminiData.usageMetadata?.candidatesTokenCount || 0;

    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      return { success: false, error: 'No content generated' };
    }

    let cleanedText = generatedText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    cleanedText = cleanedText.trim();

    const wordInfoArray = JSON.parse(cleanedText);
    console.log(`✅ 배치 ${batchIndex + 1}: ${wordInfoArray.length}개 단어 처리 완료`);

    return { success: true, data: wordInfoArray, inputTokens, outputTokens };
  } catch (error) {
    console.log(`❌ 배치 ${batchIndex + 1}: 오류:`, error);
    return { success: false, error: String(error) };
  }
}

// Gemini API를 통한 단어 정보 자동 생성 (서버 내부 병렬 배치 모드)
app.post("/make-server-7e289e1b/generate-word-info", async (c) => {
  try {
    console.log('=== 새로운 요청 시작 (병렬 모드) ===');

    // Body 파싱
    let body;
    try {
      body = await c.req.json();
      console.log('Body 파싱 성공, 단어 수:', body.words?.length);
    } catch (parseError) {
      console.log('Body 파싱 실패:', parseError);
      return c.json({ success: false, error: 'Invalid JSON in request body' }, 400);
    }

    const { words } = body;

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
    const validWords: any[] = [];
    const invalidWords: any[] = [];

    for (let i = 0; i < words.length; i++) {
      const w = words[i];

      if (!w || typeof w !== 'object') {
        invalidWords.push({ index: i, reason: 'not an object', data: w });
        continue;
      }

      if (!w.word || typeof w.word !== 'string') {
        invalidWords.push({ index: i, reason: 'word is not a string', data: w });
        continue;
      }

      if (w.word.trim() === '') {
        invalidWords.push({ index: i, reason: 'word is empty', data: w });
        continue;
      }

      validWords.push(w);
    }

    if (invalidWords.length > 0) {
      console.log('❌ 유효하지 않은 단어들:', invalidWords.length, '개');
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

    // 배치 크기: 20개씩 나누기
    const BATCH_SIZE = 20;
    // 동시 처리 개수: Gemini API rate limit 고려해서 10개까지 동시 처리
    const MAX_CONCURRENT = 10;

    const batches: any[][] = [];
    for (let i = 0; i < validWords.length; i += BATCH_SIZE) {
      batches.push(validWords.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 총 ${batches.length}개 배치 생성 (배치당 최대 ${BATCH_SIZE}개, 동시 처리 ${MAX_CONCURRENT}개)`);

    // 배치들을 MAX_CONCURRENT 개씩 묶어서 처리
    const allResults: any[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const errors: any[] = [];

    for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
      const concurrentBatches = batches.slice(i, i + MAX_CONCURRENT);
      console.log(`🚀 병렬 처리 그룹 ${Math.floor(i / MAX_CONCURRENT) + 1}: ${concurrentBatches.length}개 배치 동시 처리`);

      const batchPromises = concurrentBatches.map((batch, idx) =>
        processGeminiBatch(batch, apiKey, i + idx)
      );

      const results = await Promise.all(batchPromises);

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.success && result.data) {
          allResults.push(...result.data);
          totalInputTokens += result.inputTokens || 0;
          totalOutputTokens += result.outputTokens || 0;
        } else {
          errors.push({ batchIndex: i + j, error: result.error });
        }
      }
    }

    if (errors.length > 0) {
      console.log(`⚠️ ${errors.length}개 배치에서 오류 발생`);
    }

    console.log(`✅ 최종 결과: ${allResults.length}개 단어 정보 생성 완료`);
    console.log(`📊 총 토큰 사용량 - 입력: ${totalInputTokens}, 출력: ${totalOutputTokens}`);

    return c.json({
      success: true,
      data: allResults,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      batchCount: batches.length,
      errors: errors.length > 0 ? errors : undefined
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

// 사용 로그 저장 (정규화 테이블 사용)
app.post("/make-server-7e289e1b/log", async (c) => {
  try {
    console.log('📥 Received log save request');
    const body = await c.req.json();
    console.log('📦 Request body:', JSON.stringify(body).substring(0, 200));

    const { timestamp, headerTitle, headerDescription, footerLeft, viewMode, wordCount, vocabularyList, inputTokens, outputTokens } = body;

    const hasVocabularyList = vocabularyList && Array.isArray(vocabularyList) && vocabularyList.length > 0;
    console.log(`📝 Saving log: ${timestamp}, title: ${headerTitle}, wordCount: ${wordCount}, vocabularyList: ${hasVocabularyList ? `${vocabularyList.length} words` : 'missing'}`);

    const db = supabase();

    // 1. shared_vocabularies에 단어장 생성
    const { data: vocabData, error: vocabError } = await db
      .from('shared_vocabularies')
      .insert({
        title: headerTitle || 'Untitled',
        description: headerDescription || '',
        category: footerLeft || '',
        total_words: wordCount || 0,
        input_tokens: inputTokens || 0,
        output_tokens: outputTokens || 0
      })
      .select()
      .single();

    if (vocabError) {
      console.error('❌ Failed to create vocabulary:', vocabError);
      return c.json({ success: false, error: vocabError.message }, 500);
    }

    const vocabularyId = vocabData.id;
    console.log(`✅ Created vocabulary with ID: ${vocabularyId}`);

    // 2. shared_words에 단어들 삽입
    if (hasVocabularyList) {
      const wordsToInsert = vocabularyList.map((word: any, index: number) => ({
        vocabulary_id: vocabularyId,
        word: word.word || '',
        pronunciation: word.pronunciation || '',
        part_of_speech: word.partOfSpeech || '',
        meaning: word.meaning || '',
        definition: word.definition || '',
        synonyms: word.synonyms || [],
        antonyms: word.antonyms || [],
        derivatives: word.derivatives || [],
        example_sentence: word.example || '',
        translation: word.translation || '',
        translation_highlight: word.translationHighlight || '',
        etymology: word.etymology || '',
        order_index: word.id || index + 1
      }));

      // 1000개씩 배치로 나눠서 INSERT (Supabase 제한 우회)
      const BATCH_SIZE = 500;
      for (let i = 0; i < wordsToInsert.length; i += BATCH_SIZE) {
        const batch = wordsToInsert.slice(i, i + BATCH_SIZE);
        const { error: wordsError } = await db
          .from('shared_words')
          .insert(batch);

        if (wordsError) {
          console.error(`❌ Failed to insert words batch ${i / BATCH_SIZE + 1}:`, wordsError);
          // 단어장 삭제 (롤백)
          await db.from('shared_vocabularies').delete().eq('id', vocabularyId);
          return c.json({ success: false, error: wordsError.message }, 500);
        }
        console.log(`✅ Inserted batch ${i / BATCH_SIZE + 1}: ${batch.length} words`);
      }

      console.log(`✅ Total inserted: ${wordsToInsert.length} words`);
    }

    return c.json({
      success: true,
      vocabularyId,
      vocabularyListCount: hasVocabularyList ? vocabularyList.length : 0
    });
  } catch (error) {
    console.error('Error saving log:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 최근 로그 메타데이터 조회
app.get("/make-server-7e289e1b/recent-logs", async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const db = supabase();

    const { data, error } = await db
      .from('shared_vocabularies')
      .select('id, title, description, category, total_words, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    const logs = data.map(v => ({
      id: v.id,
      timestamp: v.created_at,
      headerTitle: v.title,
      headerDescription: v.description,
      wordCount: v.total_words
    }));

    return c.json({ logs, total: logs.length });
  } catch (error) {
    console.log('Error fetching recent logs:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 특정 로그 로드 (단어 포함)
app.get("/make-server-7e289e1b/load-log/:id", async (c) => {
  try {
    const logId = c.req.param('id');
    const db = supabase();

    // 단어장 정보 가져오기
    const { data: vocab, error: vocabError } = await db
      .from('shared_vocabularies')
      .select('*')
      .eq('id', logId)
      .single();

    if (vocabError || !vocab) {
      return c.json({ success: false, error: 'Log not found' }, 404);
    }

    // 단어들 가져오기 (페이징으로 1000개 제한 우회)
    const allWords: any[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data: batch, error: batchError } = await db
        .from('shared_words')
        .select('*')
        .eq('vocabulary_id', logId)
        .order('order_index', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (batchError) {
        return c.json({ success: false, error: batchError.message }, 500);
      }

      if (!batch || batch.length === 0) break;

      allWords.push(...batch);
      console.log(`Fetched batch: offset=${offset}, count=${batch.length}, total=${allWords.length}`);

      if (batch.length < pageSize) break;
      offset += pageSize;
    }

    const words = allWords;

    // 프론트엔드 형식으로 변환
    const vocabularyList = words.map(w => ({
      id: w.order_index,
      word: w.word,
      pronunciation: w.pronunciation,
      partOfSpeech: w.part_of_speech,
      meaning: w.meaning,
      definition: w.definition,
      synonyms: w.synonyms || [],
      antonyms: w.antonyms || [],
      derivatives: w.derivatives || [],
      example: w.example_sentence,
      translation: w.translation,
      translationHighlight: w.translation_highlight,
      etymology: w.etymology
    }));

    // 전체 log 객체를 반환 (App.tsx의 handleLoadLog와 호환)
    return c.json({
      success: true,
      log: {
        id: vocab.id,
        timestamp: vocab.created_at,
        headerTitle: vocab.title,
        headerDescription: vocab.description,
        footerLeft: vocab.category,
        viewMode: vocab.view_mode,
        wordCount: vocab.total_words,
        vocabularyList,
        inputTokens: vocab.input_tokens,
        outputTokens: vocab.output_tokens
      }
    });
  } catch (error) {
    console.log('Error loading log:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 모든 사용 로그 조회 (메타데이터만 - 빠르고 가벼움)
app.get("/make-server-7e289e1b/logs", async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const db = supabase();

    // 전체 개수 조회
    const { count } = await db
      .from('shared_vocabularies')
      .select('*', { count: 'exact', head: true });

    // 메타데이터만 조회 (vocabularyList 제외 - 메모리 최적화)
    const { data, error } = await db
      .from('shared_vocabularies')
      .select(`
        id, title, description, category, total_words,
        input_tokens, output_tokens, created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    const logs = data.map(v => ({
      id: v.id,
      timestamp: v.created_at,
      headerTitle: v.title,
      headerDescription: v.description,
      footerLeft: v.category,
      wordCount: v.total_words,
      inputTokens: v.input_tokens,
      outputTokens: v.output_tokens
      // vocabularyList는 load-log/:id API로 개별 조회
    }));

    return c.json({ logs, total: count || logs.length });
  } catch (error) {
    console.log('Error fetching logs:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// KV Store에서 정규화 테이블로 마이그레이션
app.post("/make-server-7e289e1b/migrate-from-kv", async (c) => {
  try {
    const db = supabase();

    // KV Store에서 모든 로그 가져오기
    const { data: kvData, error: kvError } = await db
      .from('kv_store_7e289e1b')
      .select('key, value')
      .like('key', 'log_%');

    if (kvError) {
      return c.json({ success: false, error: kvError.message }, 500);
    }

    console.log(`Found ${kvData.length} logs in KV Store`);

    let migrated = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const kv of kvData) {
      try {
        const log = kv.value;

        if (!log || !log.vocabularyList || log.vocabularyList.length === 0) {
          console.log(`Skipping ${kv.key}: no vocabulary list`);
          skipped++;
          continue;
        }

        // 이미 마이그레이션된 데이터인지 확인 (title로 중복 체크)
        const { data: existing } = await db
          .from('shared_vocabularies')
          .select('id')
          .eq('title', log.headerTitle || 'Untitled')
          .eq('total_words', log.vocabularyList.length)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping ${kv.key}: already migrated`);
          skipped++;
          continue;
        }

        // 1. shared_vocabularies에 저장
        const { data: vocabData, error: vocabError } = await db
          .from('shared_vocabularies')
          .insert({
            title: log.headerTitle || 'Untitled',
            description: log.headerDescription || '',
            category: log.footerLeft || '',
            total_words: log.vocabularyList.length,
            input_tokens: log.inputTokens || 0,
            output_tokens: log.outputTokens || 0,
            created_at: log.timestamp || new Date().toISOString()
          })
          .select()
          .single();

        if (vocabError) {
          errors.push({ key: kv.key, error: vocabError.message });
          continue;
        }

        // 2. shared_words에 저장
        const wordsToInsert = log.vocabularyList.map((word: any, index: number) => ({
          vocabulary_id: vocabData.id,
          word: word.word || '',
          pronunciation: word.pronunciation || '',
          part_of_speech: word.partOfSpeech || '',
          meaning: word.meaning || '',
          definition: word.definition || '',
          synonyms: word.synonyms || [],
          antonyms: word.antonyms || [],
          derivatives: word.derivatives || [],
          example_sentence: word.example || '',
          translation: word.translation || '',
          translation_highlight: word.translationHighlight || '',
          etymology: word.etymology || '',
          order_index: word.id || index + 1,
          created_at: log.timestamp || new Date().toISOString()
        }));

        // 배치로 나눠서 INSERT (Supabase 1000개 제한 우회)
        const BATCH_SIZE = 500;
        let insertError = null;
        for (let i = 0; i < wordsToInsert.length; i += BATCH_SIZE) {
          const batch = wordsToInsert.slice(i, i + BATCH_SIZE);
          const { error: batchError } = await db
            .from('shared_words')
            .insert(batch);
          if (batchError) {
            insertError = batchError;
            break;
          }
          console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} words`);
        }

        if (insertError) {
          // 롤백
          await db.from('shared_vocabularies').delete().eq('id', vocabData.id);
          errors.push({ key: kv.key, error: insertError.message });
          continue;
        }

        migrated++;
        console.log(`Migrated ${kv.key}: ${wordsToInsert.length} words (in ${Math.ceil(wordsToInsert.length / BATCH_SIZE)} batches)`);

      } catch (error) {
        errors.push({ key: kv.key, error: String(error) });
      }
    }

    return c.json({
      success: true,
      total: kvData.length,
      migrated,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Migration error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 학교명으로 데이터 필터링
app.get("/make-server-7e289e1b/logs/filter", async (c) => {
  try {
    const schoolName = c.req.query('school');
    const format = c.req.query('format') || 'json';

    if (!schoolName) {
      return c.json({ success: false, error: 'school parameter is required' }, 400);
    }

    const db = supabase();

    const { data, error } = await db
      .from('shared_vocabularies')
      .select('*')
      .ilike('title', `%${schoolName}%`)
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    if (format === 'json') {
      return c.json({
        success: true,
        school: schoolName,
        total: data.length,
        logs: data
      });
    }

    return c.json({ success: false, error: 'Invalid format' }, 400);
  } catch (error) {
    console.log('Error filtering logs:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
