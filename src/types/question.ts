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

// ===== PDF 미리보기 및 편집 타입 =====

/**
 * 인라인 편집 가능한 필드 유형
 */
export type EditableFieldType =
  | 'passageTranslation'      // 지문 번역
  | 'wordExplanation'         // 어휘 해설 (VocabularyExplanation)
  | 'answerChange'            // 정답 변환 (GrammarExplanation)
  | 'testPoint'               // 출제 포인트 (GrammarExplanation)
  | 'correctExplanation'      // 정답 해설 (여러 타입 공통)
  | 'wrongExplanation'        // 오답 해설 (index 필요)
  | 'step1Targeting'          // Step 1 (LogicExplanation)
  | 'step2Evidence'           // Step 2 (LogicExplanation)
  | 'step3Choice'             // Step 3 보기 판단 (index 필요)
  | 'passageAnalysis'         // 지문 분석 (MainIdeaExplanation)
  | 'positionExplanation'     // 위치 설명 (InsertionExplanation, index 필요)
  | 'firstParagraph'          // 1열 (OrderExplanation)
  | 'splitPoint'              // 쪼개기 포인트 (OrderExplanation)
  | 'conclusion'              // 결론 (OrderExplanation)
  | 'mainTopic'               // 핵심 주제 (WordAppropriatenessExplanation)
  | 'choiceExplanation';      // 보기 해설 (index 필요)

/**
 * 편집된 필드 정보
 */
export interface EditedField {
  fieldType: EditableFieldType;
  index?: number;              // 배열 필드의 경우 인덱스
  originalValue: string;       // 원본 값 (빈값 복원용)
  currentValue: string;        // 현재 값
  lastEditedAt: string;        // 마지막 편집 시간 (ISO 8601)
}

/**
 * 문제 ID별 편집된 필드 맵
 * key: `${fieldType}` 또는 `${fieldType}_${index}`
 */
export type EditedFieldMap = Map<string, EditedField>;

/**
 * PDF 페이지 내 편집 가능 영역
 */
export interface EditableRegion {
  id: string;                  // 고유 ID: `${questionId}_${fieldType}_${index?}`
  questionId: string;          // 연결된 문제 ID
  fieldType: EditableFieldType;
  index?: number;              // 배열 필드의 인덱스

  pageIndex: number;           // PDF 페이지 번호 (0-based)

  /** PDF 좌표계 (포인트 단위, 좌하단 원점) */
  pdfRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** 현재 텍스트 */
  text: string;

  /** 원본 텍스트 (빈값 복원용) */
  originalText: string;
}

/**
 * PDF 미리보기 상태
 */
export interface PdfPreviewState {
  /** 렌더링 상태 */
  status: 'idle' | 'rendering' | 'ready' | 'error';

  /** 에러 메시지 (status가 'error'일 때) */
  errorMessage?: string;

  /** 총 페이지 수 */
  totalPages: number;

  /** 현재 표시 중인 페이지 (1-based) */
  currentPage: number;

  /** 페이지별 이미지 캐시 (data URL) */
  pageImages: Map<number, string>;

  /** 모든 편집 가능 영역 */
  editableRegions: EditableRegion[];

  /** PDF 렌더링 스케일 (기본값: 2.0 for 고해상도) */
  scale: number;

  /** 마지막 렌더링 시간 */
  lastRenderedAt?: string;
}

// ===== 세션 저장 타입 (localStorage용) =====

// 저장된 세션 데이터
export interface SavedSession {
  id: string;                              // 세션 ID (ISO 8601 타임스탬프)
  createdAt: string;                       // 생성 일시 (ISO 8601)
  headerTitle?: string;                    // 교재 제목
  questionCount: number;                   // 문제 수
  questions: QuestionItem[];               // 문제 목록
  explanations: [string, ExplanationData][]; // Map을 배열로 변환
  vocabularyList?: VocaPreviewWord[];      // 단어장 (선택)
  editedFields?: [string, [string, EditedField][]][];  // Map<questionId, EditedFieldMap> 직렬화
}

// localStorage 루트 데이터 구조
export interface StorageData {
  version: string;           // 데이터 스키마 버전 ("1.0")
  sessions: SavedSession[];  // 저장된 세션 배열 (최대 2개)
}

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
