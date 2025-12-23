// 문제 데이터 타입
export interface QuestionItem {
  id: string;              // 고유번호 (예: 2025_DGU_01)
  year: number;            // 연도
  questionNumber: number;  // 문제 번호
  categoryMain: string;    // 유형 대분류 (어휘, 문법, 논리, 대의 파악, 빈칸, 어휘 적절성, 밑줄 추론, 정보 파악)
  categorySub: string;     // 유형 소분류 (동의어, 밑줄형, 단어형, 구절형, 제목, 요지 등)
  instruction: string;     // 발문
  passage: string;         // 지문 (Ⓐ, Ⓑ 등 마커 포함)
  choices: string[];       // 보기 5개 (①~⑤)
  answer: string;          // 정답 (①~⑤)
}

// 헤더 정보 타입
export interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

// 뷰 모드 타입
export type ViewMode = 'question' | 'answer' | 'vocabulary' | 'vocaPreview';

// 단어장 프리뷰용 단어 타입
export interface VocaPreviewWord {
  questionNumber: number;  // 몇 번 문제에서 추출했는지
  word: string;            // 영어 단어 (원형)
  meaning: string;         // 한국어 뜻
}

// ===== 해설 데이터 타입 (AI 생성용) =====

// 보기 번역 타입 (짧은 보기: 영어+한글, 긴 보기: 한글만)
export interface ChoiceTranslation {
  english: string;      // 원문 (짧은 경우에만 표시)
  korean: string;       // 한글 번역
  showEnglish: boolean; // 영어 원문 표시 여부
}

// 공통 번역 필드
export interface TranslationFields {
  passageTranslation?: string;           // 지문 한글 번역
  choiceTranslations?: ChoiceTranslation[]; // 보기 번역 (5개)
}

// 어휘(동의어) 해설
export interface VocabularyExplanation extends TranslationFields {
  type: 'vocabulary';
  wordExplanation: string;      // 단어 해설 (어원, 의미 설명)
  synonyms: { english: string; korean: string }[];  // 동의어 목록
}

// 문법 해설
export interface GrammarExplanation extends TranslationFields {
  type: 'grammar';
  answerChange: string;         // 정답 변환 (예: "established → establishing")
  testPoint: string;            // 출제 Point (예: "준동사 (분사구문)")
  correctExplanation: string;   // 정답 해설
  wrongExplanations: string[];  // 오답 해설 (A~E)
}

// 논리/빈칸 해설
export interface LogicExplanation extends TranslationFields {
  type: 'logic';
  step1Targeting: string;       // Step 1) 빈칸 타게팅
  step2Evidence: string;        // Step 2) 근거 확인
  step3Choices: string[];       // Step 3) 보기 판단 (①~⑤)
}

// 대의파악 (제목/요지) 해설
export interface MainIdeaExplanation extends TranslationFields {
  type: 'mainIdea';
  passageAnalysis: string;      // 지문 분석
  correctExplanation: string;   // 정답 해설
  wrongExplanations: string[];  // 오답 소거 (①~⑤ 중 오답)
}

// 정보파악 (삽입) 해설
export interface InsertionExplanation extends TranslationFields {
  type: 'insertion';
  correctExplanation: string;   // 정답 해설
  positionExplanations: string[]; // 각 위치별 설명 (A~E)
}

// 정보파악 (순서) 해설
export interface OrderExplanation extends TranslationFields {
  type: 'order';
  firstParagraph: string;       // 보기의 1열
  splitPoint: string;           // 쪼개는 포인트
  conclusion: string;           // 따라서 정답은...
}

// 어휘 적절성/밑줄 추론 해설
export interface WordAppropriatenessExplanation extends TranslationFields {
  type: 'wordAppropriateness';
  mainTopic: string;            // 핵심 주제
  choiceExplanations: string[]; // 정답 해설 (A~E 각각)
}

// 통합 해설 데이터 타입
export type ExplanationData =
  | VocabularyExplanation
  | GrammarExplanation
  | LogicExplanation
  | MainIdeaExplanation
  | InsertionExplanation
  | OrderExplanation
  | WordAppropriatenessExplanation;

// TSV 파싱 함수
export function parseQuestionTSV(tsv: string): QuestionItem[] {
  const lines = tsv.trim().split('\n');
  if (lines.length < 2) return [];

  // 첫 번째 줄은 헤더
  const items: QuestionItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 13) continue;

    items.push({
      id: cols[0],
      year: parseInt(cols[1]) || 0,
      questionNumber: parseInt(cols[2]) || 0,
      categoryMain: cols[3],
      categorySub: cols[4],
      instruction: cols[5],
      passage: cols[6],
      choices: [cols[7], cols[8], cols[9], cols[10], cols[11]],
      answer: cols[12],
    });
  }

  return items;
}
