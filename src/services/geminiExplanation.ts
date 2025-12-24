import type { QuestionItem, ExplanationData, VocaPreviewWord } from '../types/question';

// ===== AI 설정 타입 =====
export type AIProvider = 'gemini' | 'openai' | 'claude';

export interface AISettings {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

// API URL 생성 함수
function getGeminiApiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// 기본 Gemini URL (하위 호환성)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// 번역 관련 공통 지침
const TRANSLATION_INSTRUCTION = `
번역 규칙:
1. passageTranslation: 지문 전체를 자연스러운 한국어로 번역
2. instructionTranslation: 발문(문제 지시문)을 자연스러운 한국어로 번역
3. choiceTranslations: 각 보기를 번역. 보기가 짧으면(단어/짧은 구) showEnglish=true, 길면(문장/긴 구절) showEnglish=false
   - 짧은 보기 기준: 영어 원문 30자 이하
`;

// 유형별 기본 프롬프트 템플릿
export const DEFAULT_PROMPTS: Record<string, string> = {
  vocabulary: `당신은 영어 어휘 전문가입니다. 다음 어휘 문제에 대한 해설을 생성해주세요.

문제:
{{passage}}

보기:
{{choices}}

정답: {{answer}}
${TRANSLATION_INSTRUCTION}
다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "type": "vocabulary",
  "wordExplanation": "밑줄 친 단어의 어원과 의미를 설명 (2-3문장)",
  "synonyms": [
    {"english": "동의어1", "korean": "한국어 뜻1"},
    {"english": "동의어2", "korean": "한국어 뜻2"},
    {"english": "동의어3", "korean": "한국어 뜻3"},
    {"english": "동의어4", "korean": "한국어 뜻4"},
    {"english": "동의어5", "korean": "한국어 뜻5"}
  ],
  "passageTranslation": "지문 전체 한국어 번역",
  "instructionTranslation": "발문 한국어 번역",
  "choiceTranslations": [
    {"english": "보기1 원문", "korean": "보기1 번역", "showEnglish": true},
    {"english": "보기2 원문", "korean": "보기2 번역", "showEnglish": true},
    {"english": "보기3 원문", "korean": "보기3 번역", "showEnglish": true},
    {"english": "보기4 원문", "korean": "보기4 번역", "showEnglish": true},
    {"english": "보기5 원문", "korean": "보기5 번역", "showEnglish": true}
  ]
}`,

  grammar: `당신은 영문법 전문가입니다. 다음 문법 문제에 대한 해설을 생성해주세요.

문제:
{{passage}}

보기:
{{choices}}

정답: {{answer}}
${TRANSLATION_INSTRUCTION}
다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "type": "grammar",
  "answerChange": "오답 → 정답 형태 (예: established → establishing)",
  "testPoint": "출제 포인트 (예: 준동사 - 분사구문)",
  "correctExplanation": "정답인 이유를 상세히 설명 (2-3문장)",
  "wrongExplanations": [
    "A번 보기가 틀린 이유",
    "B번 보기가 틀린 이유",
    "C번 보기가 틀린 이유",
    "D번 보기가 틀린 이유",
    "E번 보기가 틀린 이유"
  ],
  "passageTranslation": "지문 전체 한국어 번역",
  "instructionTranslation": "발문 한국어 번역",
  "choiceTranslations": [
    {"english": "보기1 원문", "korean": "보기1 번역", "showEnglish": true/false},
    {"english": "보기2 원문", "korean": "보기2 번역", "showEnglish": true/false},
    {"english": "보기3 원문", "korean": "보기3 번역", "showEnglish": true/false},
    {"english": "보기4 원문", "korean": "보기4 번역", "showEnglish": true/false},
    {"english": "보기5 원문", "korean": "보기5 번역", "showEnglish": true/false}
  ]
}

참고: wrongExplanations에서 정답에 해당하는 항목은 "정답" 이라고만 적어주세요.`,

  logic: `당신은 영어 독해 전문가입니다. 다음 빈칸/논리 문제에 대한 해설을 생성해주세요.

발문: {{instruction}}

지문:
{{passage}}

보기:
{{choices}}

정답: {{answer}}
${TRANSLATION_INSTRUCTION}
다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "type": "logic",
  "step1Targeting": "빈칸이 무엇을 묻는지 파악 (빈칸의 역할, 문맥상 필요한 내용)",
  "step2Evidence": "지문에서 찾은 단서와 근거 설명 (시그널 워드, 논리 관계 등)",
  "step3Choices": [
    "① 보기 판단 - 정답이면 왜 맞는지, 오답이면 왜 틀린지",
    "② 보기 판단",
    "③ 보기 판단",
    "④ 보기 판단",
    "⑤ 보기 판단"
  ],
  "passageTranslation": "지문 전체 한국어 번역",
  "instructionTranslation": "발문 한국어 번역",
  "choiceTranslations": [
    {"english": "보기1 원문", "korean": "보기1 번역", "showEnglish": true/false},
    {"english": "보기2 원문", "korean": "보기2 번역", "showEnglish": true/false},
    {"english": "보기3 원문", "korean": "보기3 번역", "showEnglish": true/false},
    {"english": "보기4 원문", "korean": "보기4 번역", "showEnglish": true/false},
    {"english": "보기5 원문", "korean": "보기5 번역", "showEnglish": true/false}
  ]
}`,

  mainIdea: `당신은 영어 독해 전문가입니다. 다음 대의파악 문제에 대한 해설을 생성해주세요.

발문: {{instruction}}

지문:
{{passage}}

보기:
{{choices}}

정답: {{answer}}
${TRANSLATION_INSTRUCTION}
다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "type": "mainIdea",
  "passageAnalysis": "지문의 핵심 내용과 구조 분석 (중심 소재, 주제문, 논지 전개 등 2-3문장)",
  "correctExplanation": "정답이 맞는 이유 설명 (2문장)",
  "wrongExplanations": [
    "① 오답인 이유 (정답이면 '정답'이라고만 표시)",
    "② 오답인 이유",
    "③ 오답인 이유",
    "④ 오답인 이유",
    "⑤ 오답인 이유"
  ],
  "passageTranslation": "지문 전체 한국어 번역",
  "instructionTranslation": "발문 한국어 번역",
  "choiceTranslations": [
    {"english": "보기1 원문", "korean": "보기1 번역", "showEnglish": true/false},
    {"english": "보기2 원문", "korean": "보기2 번역", "showEnglish": true/false},
    {"english": "보기3 원문", "korean": "보기3 번역", "showEnglish": true/false},
    {"english": "보기4 원문", "korean": "보기4 번역", "showEnglish": true/false},
    {"english": "보기5 원문", "korean": "보기5 번역", "showEnglish": true/false}
  ]
}`,

  insertion: `당신은 영어 독해 전문가입니다. 다음 문장 삽입 문제에 대한 해설을 생성해주세요.

발문: {{instruction}}

지문:
{{passage}}

정답: {{answer}}
${TRANSLATION_INSTRUCTION}
다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "type": "insertion",
  "correctExplanation": "정답 위치에 삽입해야 하는 이유 (연결어, 지시어, 논리적 흐름 등 2-3문장)",
  "positionExplanations": [
    "A 위치: 이 위치가 적절/부적절한 이유",
    "B 위치: 이 위치가 적절/부적절한 이유",
    "C 위치: 이 위치가 적절/부적절한 이유",
    "D 위치: 이 위치가 적절/부적절한 이유",
    "E 위치: 이 위치가 적절/부적절한 이유"
  ],
  "passageTranslation": "지문 전체 한국어 번역",
  "instructionTranslation": "발문 한국어 번역"
}`,

  order: `당신은 영어 독해 전문가입니다. 다음 문장 순서 문제에 대한 해설을 생성해주세요.

발문: {{instruction}}

지문:
{{passage}}

보기:
{{choices}}

정답: {{answer}}
${TRANSLATION_INSTRUCTION}
다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "type": "order",
  "firstParagraph": "주어진 문장/첫 단락의 핵심 내용과 다음에 올 내용 예측",
  "splitPoint": "각 단락(A, B, C)의 연결 단서 분석 (지시어, 연결어, 논리적 흐름)",
  "conclusion": "따라서 정답은 {{answer}}. 최종 순서와 그 이유 요약",
  "passageTranslation": "지문 전체 한국어 번역",
  "instructionTranslation": "발문 한국어 번역",
  "choiceTranslations": [
    {"english": "보기1 원문", "korean": "보기1 번역", "showEnglish": true/false},
    {"english": "보기2 원문", "korean": "보기2 번역", "showEnglish": true/false},
    {"english": "보기3 원문", "korean": "보기3 번역", "showEnglish": true/false},
    {"english": "보기4 원문", "korean": "보기4 번역", "showEnglish": true/false},
    {"english": "보기5 원문", "korean": "보기5 번역", "showEnglish": true/false}
  ]
}`,

  wordAppropriateness: `당신은 영어 독해 전문가입니다. 다음 어휘 적절성/밑줄 추론 문제에 대한 해설을 생성해주세요.

발문: {{instruction}}

지문:
{{passage}}

보기:
{{choices}}

정답: {{answer}}
${TRANSLATION_INSTRUCTION}
다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "type": "wordAppropriateness",
  "mainTopic": "지문의 핵심 주제/논지 (1-2문장)",
  "choiceExplanations": [
    "A: 해당 어휘가 적절/부적절한 이유",
    "B: 해당 어휘가 적절/부적절한 이유",
    "C: 해당 어휘가 적절/부적절한 이유",
    "D: 해당 어휘가 적절/부적절한 이유",
    "E: 해당 어휘가 적절/부적절한 이유"
  ],
  "passageTranslation": "지문 전체 한국어 번역",
  "instructionTranslation": "발문 한국어 번역",
  "choiceTranslations": [
    {"english": "보기1 원문", "korean": "보기1 번역", "showEnglish": true/false},
    {"english": "보기2 원문", "korean": "보기2 번역", "showEnglish": true/false},
    {"english": "보기3 원문", "korean": "보기3 번역", "showEnglish": true/false},
    {"english": "보기4 원문", "korean": "보기4 번역", "showEnglish": true/false},
    {"english": "보기5 원문", "korean": "보기5 번역", "showEnglish": true/false}
  ]
}`,

  default: `당신은 영어 독해 전문가입니다. 다음 문제에 대한 해설을 생성해주세요.

발문: {{instruction}}

지문:
{{passage}}

보기:
{{choices}}

정답: {{answer}}
${TRANSLATION_INSTRUCTION}
다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "type": "mainIdea",
  "passageAnalysis": "지문 분석 (2-3문장)",
  "correctExplanation": "정답 해설 (2문장)",
  "wrongExplanations": [
    "① 오답 해설",
    "② 오답 해설",
    "③ 오답 해설",
    "④ 오답 해설",
    "⑤ 오답 해설"
  ],
  "passageTranslation": "지문 전체 한국어 번역",
  "instructionTranslation": "발문 한국어 번역",
  "choiceTranslations": [
    {"english": "보기1 원문", "korean": "보기1 번역", "showEnglish": true/false},
    {"english": "보기2 원문", "korean": "보기2 번역", "showEnglish": true/false},
    {"english": "보기3 원문", "korean": "보기3 번역", "showEnglish": true/false},
    {"english": "보기4 원문", "korean": "보기4 번역", "showEnglish": true/false},
    {"english": "보기5 원문", "korean": "보기5 번역", "showEnglish": true/false}
  ]
}`
};

// 프롬프트 유형 라벨
export const PROMPT_LABELS: Record<string, string> = {
  vocabulary: '어휘 (동의어)',
  grammar: '문법',
  logic: '논리/빈칸',
  mainIdea: '대의파악',
  insertion: '삽입',
  order: '순서',
  wordAppropriateness: '어휘 적절성',
  default: '기본'
};

// 커스텀 프롬프트 저장소
let customPrompts: Record<string, string> = {};

// 커스텀 프롬프트 설정
export function setCustomPrompts(prompts: Record<string, string>) {
  customPrompts = { ...prompts };
}

// 커스텀 프롬프트 가져오기
export function getCustomPrompts(): Record<string, string> {
  return { ...customPrompts };
}

// 프롬프트 템플릿에 변수 치환
function fillPromptTemplate(template: string, question: QuestionItem): string {
  const { passage, choices, answer, instruction, hint } = question;
  const choiceLabels = ['①', '②', '③', '④', '⑤'];
  const choicesText = choices
    .map((c, i) => c ? `${choiceLabels[i]} ${c}` : '')
    .filter(Boolean)
    .join('\n');

  // 힌트가 있으면 추가, 없으면 빈 문자열
  const hintText = hint && hint.trim() ? hint.trim() : '';

  return template
    .replace(/\{\{passage\}\}/g, passage)
    .replace(/\{\{choices\}\}/g, choicesText)
    .replace(/\{\{answer\}\}/g, answer)
    .replace(/\{\{instruction\}\}/g, instruction)
    .replace(/\{\{hint\}\}/g, hintText);
}

// 카테고리에 맞는 프롬프트 키 반환
function getPromptKey(question: QuestionItem): string {
  const { categoryMain, categorySub } = question;

  if (categoryMain === '어휘') return 'vocabulary';
  if (categoryMain === '문법') return 'grammar';
  if (categoryMain === '논리' || categoryMain === '빈칸') return 'logic';
  if (categoryMain === '대의 파악') return 'mainIdea';
  if (categoryMain === '정보 파악' && (categorySub === '삽입' || categorySub === '문장 삽입')) return 'insertion';
  if (categoryMain === '정보 파악' && (categorySub === '순서' || categorySub === '문장 순서')) return 'order';
  if (categorySub === '어휘 적절성' || categorySub === '밑줄 추론') return 'wordAppropriateness';
  if (categoryMain === '정보 파악') return 'mainIdea';

  return 'default';
}

// localStorage에서 커스텀 프롬프트 로드
function loadCustomPromptsFromStorage(): Record<string, string> {
  try {
    const saved = localStorage.getItem('custom-prompts');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // 파싱 실패 시 빈 객체 반환
  }
  return {};
}

// 유형별 프롬프트 생성 (커스텀 프롬프트 우선)
function getPromptByCategory(question: QuestionItem): string {
  const key = getPromptKey(question);
  // localStorage에서 직접 로드하여 항상 최신 값 사용
  const savedPrompts = loadCustomPromptsFromStorage();
  const template = savedPrompts[key] || customPrompts[key] || DEFAULT_PROMPTS[key] || DEFAULT_PROMPTS.default;
  return fillPromptTemplate(template, question);
}

// ===== 통합 AI API 호출 함수 =====

/**
 * AI 제공자에 따라 적절한 API를 호출하여 텍스트 생성
 */
async function callAI(
  prompt: string,
  aiSettings: AISettings,
  maxRetries: number = 3
): Promise<string | null> {
  const { provider, model, apiKey } = aiSettings;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let response: Response;
      let generatedText: string | undefined;

      if (provider === 'gemini') {
        // Gemini API
        const url = getGeminiApiUrl(model);
        response = await fetch(`${url}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        }
      } else if (provider === 'openai') {
        // OpenAI API
        response = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 4096
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data.choices?.[0]?.message?.content;
        }
      } else if (provider === 'claude') {
        // Claude API
        response = await fetch(CLAUDE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data.content?.[0]?.text;
        }
      } else {
        console.error('지원하지 않는 AI 제공자:', provider);
        return null;
      }

      // 응답 처리
      if (!response!.ok) {
        const errorText = await response!.text();
        console.error(`[${provider}] API 오류 (시도 ${attempt}/${maxRetries}):`, errorText);

        // Rate Limit 에러면 대기 후 재시도
        if (response!.status === 429 && attempt < maxRetries) {
          const waitTime = attempt * 2000;
          console.log(`[${provider}] Rate limit - ${waitTime}ms 대기 후 재시도`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        return null;
      }

      if (generatedText) {
        return generatedText;
      }

      console.error(`[${provider}] 생성된 텍스트 없음`);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      return null;

    } catch (error) {
      console.error(`[${provider}] API 호출 실패 (시도 ${attempt}/${maxRetries}):`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      return null;
    }
  }

  return null;
}

// JSON 응답 파싱 (외부에서도 사용 가능하도록 export)
export function parseExplanationJSON(text: string): ExplanationData | null {
  try {
    // 마크다운 코드 블록 제거
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    return parsed as ExplanationData;
  } catch (error) {
    console.error('JSON 파싱 실패:', error);
    console.error('원본 텍스트:', text);
    return null;
  }
}

// 단일 문제 해설 생성 (AI 설정 지원)
async function generateSingleExplanation(
  question: QuestionItem,
  aiSettings: AISettings,
  maxRetries: number = 3
): Promise<ExplanationData | null> {
  const prompt = getPromptByCategory(question);

  console.log(`[${question.id}] ${aiSettings.provider}/${aiSettings.model}로 해설 생성 중...`);

  const generatedText = await callAI(prompt, aiSettings, maxRetries);

  if (!generatedText) {
    console.error(`[${question.id}] 해설 생성 실패`);
    return null;
  }

  const result = parseExplanationJSON(generatedText);
  if (!result) {
    console.error(`[${question.id}] JSON 파싱 실패`);
    return null;
  }

  return result;
}

// 같은 지문을 공유하는 문제들 그룹핑 (연속된 문제만)
interface PassageGroup {
  passage: string;
  items: QuestionItem[];
}

// 지문 정규화 (공백, 줄바꿈 등 차이 무시)
function normalizePassage(passage: string): string {
  return passage
    .replace(/\s+/g, ' ')  // 모든 공백을 단일 공백으로
    .trim()
    .toLowerCase();
}

// 두 지문이 같은지 비교 (정규화 후 비교)
function isSamePassage(passage1: string, passage2: string): boolean {
  return normalizePassage(passage1) === normalizePassage(passage2);
}

function groupByPassage(items: QuestionItem[]): PassageGroup[] {
  const groups: PassageGroup[] = [];

  items.forEach((item) => {
    const lastGroup = groups[groups.length - 1];

    // 같은 지문이면 그룹에 추가 (연속된 문제만, 정규화 비교)
    if (lastGroup && isSamePassage(lastGroup.passage, item.passage)) {
      lastGroup.items.push(item);
    } else {
      // 새 그룹 생성
      groups.push({
        passage: item.passage,
        items: [item]
      });
    }
  });

  return groups;
}

// 병렬로 여러 문제 해설 생성 (동시 5개씩)
// 같은 지문을 공유하는 문제들은 첫 번째 문제만 passageTranslation을 생성하고 나머지에 공유
export async function generateExplanations(
  questions: QuestionItem[],
  apiKeyOrSettings: string | AISettings,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, ExplanationData>> {
  const results = new Map<string, ExplanationData>();

  // AI 설정 변환 (하위 호환성: 문자열이면 기본 Gemini 설정으로)
  const aiSettings: AISettings = typeof apiKeyOrSettings === 'string'
    ? { provider: 'gemini', model: 'gemini-2.0-flash', apiKey: apiKeyOrSettings }
    : apiKeyOrSettings;

  console.log(`🤖 해설 생성 시작: ${aiSettings.provider} / ${aiSettings.model}`);

  // 세트 문제 처리: passage가 없으면 이전 문제의 passage 상속
  let lastPassage = '';
  const processedQuestions = questions.map(q => {
    if (q.passage && q.passage.trim()) {
      lastPassage = q.passage;
      return q;
    } else if (lastPassage) {
      // passage가 없으면 이전 passage 상속
      return { ...q, passage: lastPassage };
    }
    return q;
  });

  // 유효한 문제만 필터링 (passage가 있거나 상속받은 경우)
  const validQuestions = processedQuestions.filter(q => q.passage && q.passage.trim());

  // 같은 지문을 공유하는 문제들 그룹핑
  const passageGroups = groupByPassage(validQuestions);

  const total = validQuestions.length;
  let completed = 0;

  // 동시 처리 개수 (API rate limit 고려)
  const CONCURRENT_LIMIT = aiSettings.provider === 'gemini' ? 5 : 3;

  // 그룹별로 처리 - 첫 번째 문제의 passageTranslation을 나머지에 공유
  for (let i = 0; i < passageGroups.length; i += CONCURRENT_LIMIT) {
    const groupChunk = passageGroups.slice(i, i + CONCURRENT_LIMIT);

    // 청크 내 그룹들을 병렬로 처리
    const promises = groupChunk.map(async (group) => {
      const groupResults: { id: string; explanation: ExplanationData | null }[] = [];
      let sharedPassageTranslation: string | undefined;

      // 그룹 내 문제들을 순차 처리 (첫 번째 문제의 번역을 공유하기 위해)
      for (let j = 0; j < group.items.length; j++) {
        const question = group.items[j];
        const explanation = await generateSingleExplanation(question, aiSettings);

        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }

        if (explanation) {
          // 첫 번째 문제의 passageTranslation 저장
          if (j === 0 && explanation.passageTranslation) {
            sharedPassageTranslation = explanation.passageTranslation;
          }
          // 두 번째 문제부터는 첫 번째 문제의 passageTranslation으로 덮어쓰기
          else if (j > 0 && sharedPassageTranslation) {
            explanation.passageTranslation = sharedPassageTranslation;
          }
        }

        groupResults.push({ id: question.id, explanation });
      }

      return groupResults;
    });

    // 청크 완료 대기
    const chunkResults = await Promise.all(promises);

    // 결과 저장
    for (const groupResults of chunkResults) {
      for (const { id, explanation } of groupResults) {
        if (explanation) {
          results.set(id, explanation);
        }
      }
    }

    // 다음 청크 전 딜레이 (rate limit 방지)
    if (i + CONCURRENT_LIMIT < passageGroups.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return results;
}

// API 키 유효성 검사
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Hello' }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}

// 단어장 생성 프롬프트
const VOCA_PREVIEW_PROMPT = `당신은 영어 어휘 전문가입니다. 다음 영어 시험 문제들에서 CEFR B2 수준을 초과하는 고급 어휘를 추출해주세요.

조건:
1. CEFR B2 수준을 초과하는 어휘만 선별 (C1, C2 수준)
2. 최대 300개 이하로 추출
3. 동사는 원형으로, 명사는 단수형으로 표기
4. 중복 단어는 제거
5. 각 단어가 몇 번 문제에서 추출되었는지 표시

문제 데이터:
{{questions}}

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "words": [
    {"questionNumber": 1, "word": "영어단어", "meaning": "한국어 뜻"},
    {"questionNumber": 2, "word": "영어단어", "meaning": "한국어 뜻"}
  ]
}

중요:
- questionNumber는 해당 단어가 처음 등장한 문제 번호입니다
- 보기(선택지)에 있는 단어도 포함해주세요
- 고유명사, 일반적인 단어(the, is, have 등)는 제외
- 학술적, 전문적 어휘를 우선 선별`;

// 단어장 생성 함수
export async function generateVocaPreview(
  questions: QuestionItem[],
  apiKey: string,
  onProgress?: (status: string) => void
): Promise<VocaPreviewWord[]> {
  if (onProgress) onProgress('문제 데이터 분석 중...');

  // 문제 데이터를 텍스트로 변환
  const questionsText = questions.map(q => {
    const choicesText = q.choices
      .map((c, i) => c ? `${['①','②','③','④','⑤'][i]} ${c}` : '')
      .filter(Boolean)
      .join(' / ');

    return `[문제 ${q.questionNumber}]
발문: ${q.instruction}
지문: ${q.passage}
보기: ${choicesText}`;
  }).join('\n\n---\n\n');

  const prompt = VOCA_PREVIEW_PROMPT.replace('{{questions}}', questionsText);

  if (onProgress) onProgress('AI 단어 추출 중...');

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('단어장 생성 API 오류:', errorText);
      throw new Error('API 호출 실패');
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('생성된 텍스트 없음');
    }

    // JSON 파싱
    let cleaned = generatedText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.words || !Array.isArray(parsed.words)) {
      throw new Error('잘못된 응답 형식');
    }

    if (onProgress) onProgress('완료!');

    return parsed.words as VocaPreviewWord[];
  } catch (error) {
    console.error('단어장 생성 실패:', error);
    throw error;
  }
}

// ===== 번역 전용 API (Gemini 2.0 Flash) =====

// 번역 전용 프롬프트
const TRANSLATION_ONLY_PROMPT = `당신은 영한 번역 전문가입니다. 다음 영어 문제의 지문, 발문, 보기를 한국어로 번역해주세요.

발문: {{instruction}}

지문:
{{passage}}

보기:
{{choices}}

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "passageTranslation": "지문 전체 한국어 번역",
  "instructionTranslation": "발문 한국어 번역",
  "choiceTranslations": [
    {"english": "보기1 원문", "korean": "보기1 번역", "showEnglish": true/false},
    {"english": "보기2 원문", "korean": "보기2 번역", "showEnglish": true/false},
    {"english": "보기3 원문", "korean": "보기3 번역", "showEnglish": true/false},
    {"english": "보기4 원문", "korean": "보기4 번역", "showEnglish": true/false},
    {"english": "보기5 원문", "korean": "보기5 번역", "showEnglish": true/false}
  ]
}

번역 규칙:
1. 자연스러운 한국어로 번역
2. 보기가 짧으면(30자 이하) showEnglish=true, 길면 showEnglish=false
3. 빈 보기는 빈 문자열로 처리`;

// 번역 결과 타입
export interface TranslationResult {
  passageTranslation: string;
  instructionTranslation: string;
  choiceTranslations: { english: string; korean: string; showEnglish: boolean }[];
}

/**
 * 번역만 생성 (Gemini 2.0 Flash 사용)
 */
export async function generateTranslationOnly(
  question: QuestionItem,
  apiKey: string
): Promise<TranslationResult | null> {
  const choiceLabels = ['①', '②', '③', '④', '⑤'];
  const choicesText = question.choices
    .map((c, i) => c ? `${choiceLabels[i]} ${c}` : '')
    .filter(Boolean)
    .join('\n');

  const prompt = TRANSLATION_ONLY_PROMPT
    .replace('{{instruction}}', question.instruction || '')
    .replace('{{passage}}', question.passage || '')
    .replace('{{choices}}', choicesText);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      })
    });

    if (!response.ok) {
      console.error('번역 API 오류:', await response.text());
      return null;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('번역 결과 없음');
      return null;
    }

    // JSON 파싱
    let cleaned = generatedText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    return JSON.parse(cleaned.trim()) as TranslationResult;
  } catch (error) {
    console.error('번역 생성 실패:', error);
    return null;
  }
}

// ===== 사용자 해설 + AI 번역 결합 =====

/**
 * 사용자가 입력한 해설 텍스트를 유형에 맞는 ExplanationData로 변환하고,
 * AI로 번역을 생성하여 결합
 */
export async function createExplanationFromUserText(
  question: QuestionItem,
  userExplanation: string,
  apiKey: string
): Promise<ExplanationData | null> {
  const promptKey = getPromptKey(question);

  // 1. AI로 번역 생성
  console.log(`[${question.id}] 번역 생성 중...`);
  const translation = await generateTranslationOnly(question, apiKey);

  if (!translation) {
    console.error(`[${question.id}] 번역 생성 실패`);
    return null;
  }

  // 2. 유형에 따라 기본 ExplanationData 생성 + 사용자 해설 삽입
  const baseData = {
    passageTranslation: translation.passageTranslation,
    instructionTranslation: translation.instructionTranslation,
    choiceTranslations: translation.choiceTranslations,
  };

  // 유형별 기본 구조 생성
  switch (promptKey) {
    case 'vocabulary':
      return {
        type: 'vocabulary',
        wordExplanation: userExplanation,
        synonyms: [],
        ...baseData,
      };

    case 'grammar':
      return {
        type: 'grammar',
        answerChange: '',
        testPoint: '',
        correctExplanation: userExplanation,
        wrongExplanations: [],
        ...baseData,
      };

    case 'logic':
      return {
        type: 'logic',
        step1Targeting: userExplanation,
        step2Evidence: '',
        step3Choices: [],
        ...baseData,
      };

    case 'mainIdea':
      return {
        type: 'mainIdea',
        passageAnalysis: userExplanation,
        correctExplanation: '',
        wrongExplanations: [],
        ...baseData,
      };

    case 'insertion':
      return {
        type: 'insertion',
        correctExplanation: userExplanation,
        positionExplanations: [],
        passageTranslation: translation.passageTranslation,
        instructionTranslation: translation.instructionTranslation,
      };

    case 'order':
      return {
        type: 'order',
        firstParagraph: userExplanation,
        splitPoint: '',
        conclusion: '',
        ...baseData,
      };

    case 'wordAppropriateness':
      return {
        type: 'wordAppropriateness',
        mainTopic: userExplanation,
        choiceExplanations: [],
        ...baseData,
      };

    default:
      return {
        type: 'mainIdea',
        passageAnalysis: userExplanation,
        correctExplanation: '',
        wrongExplanations: [],
        ...baseData,
      };
  }
}

/**
 * 여러 문제의 사용자 해설을 처리 (번역은 AI, 해설은 사용자 입력)
 */
export async function processUserExplanations(
  questions: QuestionItem[],
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, ExplanationData>> {
  const results = new Map<string, ExplanationData>();

  // explanation 필드가 있는 문제만 필터링
  const questionsWithExplanation = questions.filter(
    q => q.explanation && q.explanation.trim()
  );

  const total = questionsWithExplanation.length;
  let completed = 0;

  // 동시 처리 (5개씩)
  const CONCURRENT_LIMIT = 5;

  for (let i = 0; i < questionsWithExplanation.length; i += CONCURRENT_LIMIT) {
    const chunk = questionsWithExplanation.slice(i, i + CONCURRENT_LIMIT);

    const promises = chunk.map(async (question) => {
      const explanation = await createExplanationFromUserText(
        question,
        question.explanation!,
        apiKey
      );

      completed++;
      if (onProgress) {
        onProgress(completed, total);
      }

      return { id: question.id, explanation };
    });

    const chunkResults = await Promise.all(promises);

    for (const { id, explanation } of chunkResults) {
      if (explanation) {
        results.set(id, explanation);
      }
    }

    // Rate limit 방지
    if (i + CONCURRENT_LIMIT < questionsWithExplanation.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return results;
}
