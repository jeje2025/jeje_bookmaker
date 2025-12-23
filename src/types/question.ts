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
export type ViewMode = 'question' | 'answer' | 'vocabulary';

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
