import { memo, useMemo } from 'react';
import { QuestionCard } from './QuestionCard';
import { HeaderFooter } from './HeaderFooter';
import { A4PageLayout } from './A4PageLayout';
import { ExplanationView } from './ExplanationView';
import { scaledSize } from '../utils/fontScale';
import type { QuestionItem, HeaderInfo, ViewMode, ExplanationData, VocaPreviewWord } from '../types/question';

// 어휘 문제에서 단어 추출 (밑줄 표시된 단어)
const extractUnderlinedWord = (passage: string): string | null => {
  const match = passage.match(/_([^_]+)_/);
  return match ? match[1] : null;
};

// 어휘 문제지 테이블 행 컴포넌트
const VocabularyTestRow = ({
  left,
  right
}: {
  left: { id: string; word: string; questionNumber: number };
  right: { id: string; word: string; questionNumber: number } | null;
}) => (
  <table className="w-full border-collapse">
    <tbody>
      <tr
        style={{
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          borderBottom: '1px solid var(--badge-border, #cbd5e1)'
        }}
      >
        {/* 왼쪽 - 번호 */}
        <td className="py-2 px-1 align-middle" style={{ width: '4%' }}>
          <div className="inline-flex items-center justify-center backdrop-blur-md rounded-full" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)', padding: '2px 6px', minWidth: '26px' }}>
            <span className="font-medium text-center" style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>
              {String(left.questionNumber).padStart(3, '0')}
            </span>
          </div>
        </td>

        {/* 왼쪽 - 단어 */}
        <td className="py-2 px-2 align-middle" style={{ width: '14%' }}>
          <div style={{ fontSize: scaledSize(12), fontWeight: 'bold' }} className="text-black">
            {left.word}
          </div>
        </td>

        {/* 왼쪽 - 빈칸 (뜻 작성란) */}
        <td className="py-2 px-2 align-middle" style={{ width: '32%' }}>
          <div
            className="test-answer-blank"
            style={{
              borderBottom: '1px solid #ccc',
              minHeight: '24px',
              width: '100%'
            }}
          />
        </td>

        {/* 오른쪽 - 번호 */}
        <td className="py-2 px-1 align-middle" style={{ width: '4%' }}>
          {right && (
            <div className="inline-flex items-center justify-center backdrop-blur-md rounded-full" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)', padding: '2px 6px', minWidth: '26px' }}>
              <span className="font-medium text-center" style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>
                {String(right.questionNumber).padStart(3, '0')}
              </span>
            </div>
          )}
        </td>

        {/* 오른쪽 - 단어 */}
        <td className="py-2 px-2 align-middle" style={{ width: '14%' }}>
          {right && (
            <div style={{ fontSize: scaledSize(12), fontWeight: 'bold' }} className="text-black">
              {right.word}
            </div>
          )}
        </td>

        {/* 오른쪽 - 빈칸 (뜻 작성란) */}
        <td className="py-2 px-2 align-middle" style={{ width: '32%' }}>
          {right && (
            <div
              className="test-answer-blank"
              style={{
                borderBottom: '1px solid #ccc',
                minHeight: '24px',
                width: '100%'
              }}
            />
          )}
        </td>
      </tr>
    </tbody>
  </table>
);

// 해설 편집 콜백 타입
type ExplanationEditCallback = (questionId: string, field: string, value: string | { english: string; korean: string }[]) => void;

// 지문에서 마크다운 스타일 강조 처리 (QuestionCard와 동일)
const formatPassageWithUnderline = (text: string) => {
  if (!text) return null;

  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|_[^_]+_|_{5,})/g;
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (/^_{5,}$/.test(part)) {
      return (
        <span key={idx} className="inline-block mx-1" style={{
          borderBottom: '1px solid #333',
          minWidth: '80px',
          height: '1.2em'
        }}>
          &nbsp;
        </span>
      );
    }
    if (part.startsWith('***') && part.endsWith('***')) {
      const word = part.slice(3, -3);
      return <span key={idx} className="font-bold underline underline-offset-2">{word}</span>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      const word = part.slice(2, -2);
      return <span key={idx} className="font-bold">{word}</span>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      const word = part.slice(1, -1);
      return <span key={idx} className="underline underline-offset-2">{word}</span>;
    }
    return <span key={idx}>{part}</span>;
  });
};

// 보기 번호 변환
const choiceLabels = ['①', '②', '③', '④', '⑤'];

// 문장 삽입 유형 발문 파싱
const parseInsertionInstruction = (instruction: string): { question: string; insertSentence: string | null } => {
  const patterns = [
    /^(.*?(?:다음 문장이 들어갈 위치로 가장 적절한 것은\??))\s*(.+)$/s,
    /^(.*?(?:주어진 문장이 들어가기에 가장 적절한 곳은\??))\s*(.+)$/s,
    /^(.*?(?:글의 흐름으로 보아.*?들어가기에 가장 적절한 곳은\??))\s*(.+)$/s,
  ];

  for (const pattern of patterns) {
    const match = instruction.match(pattern);
    if (match && match[2] && match[2].trim().length > 10) {
      return { question: match[1].trim(), insertSentence: match[2].trim() };
    }
  }

  return { question: instruction, insertSentence: null };
};

// ===== 공동 지문 그룹 카드 (해설지와 동일한 구조) =====
// 구조: [번호 세로] + [지문] + [각 문제별 발문+보기]
interface GroupedQuestionCardProps {
  group: { items: QuestionItem[]; sharedPassage: string };
  showAnswer?: boolean;
}

const GroupedQuestionCard = ({ group, showAnswer = false }: GroupedQuestionCardProps) => {
  const questionNumbers = group.items.map(i => i.questionNumber);
  const minNum = Math.min(...questionNumbers);
  const maxNum = Math.max(...questionNumbers);
  const passage = group.sharedPassage;

  return (
    <div className="question-compact">
      {/* 문제 번호(세로) + 지문 + 각 문제별 발문/보기 */}
      <div className="question-row">
        {/* 문제 번호 세로 배치 (37 ~ 38) */}
        <div className="q-number q-number-vertical" style={{ fontSize: scaledSize(14) }}>
          <span>{minNum}</span>
          <span className="q-number-separator">~</span>
          <span>{maxNum}</span>
        </div>

        <div className="q-content">
          {/* 지문 (한 번만) */}
          {passage && (
            <p className="q-passage" style={{ fontSize: scaledSize(9), lineHeight: 1.6 }}>
              {formatPassageWithUnderline(passage)}
            </p>
          )}

          {/* 각 문제별 발문 + 보기 */}
          {group.items.map((item) => {
            const parsedInstruction = item.instruction
              ? parseInsertionInstruction(item.instruction)
              : { question: '', insertSentence: null };

            return (
              <div key={item.id} className="grouped-question-item">
                {/* 개별 문제 번호 + 발문 */}
                <div className="grouped-question-header">
                  <span className="grouped-question-num">{item.questionNumber}.</span>
                  <span className="grouped-question-instruction">
                    {parsedInstruction.question}
                  </span>
                </div>
                {/* 문장 삽입 제시문 */}
                {parsedInstruction.insertSentence && (
                  <div className="q-insert-sentence" style={{ fontSize: scaledSize(9), marginLeft: '24px' }}>
                    {parsedInstruction.insertSentence}
                  </div>
                )}
                {/* 보기 */}
                <div className="q-choices" style={{ marginLeft: '24px' }}>
                  {item.choices.map((choice, idx) => (
                    choice && (
                      <span
                        key={idx}
                        className={`q-choice ${showAnswer && item.answer === choiceLabels[idx] ? 'correct' : ''}`}
                        style={{ fontSize: scaledSize(9.5) }}
                      >
                        {choiceLabels[idx]} {choice}
                      </span>
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface QuestionViewProps {
  viewMode: ViewMode;
  data: QuestionItem[];
  headerInfo: HeaderInfo;
  unitNumber?: number;
  explanations?: Map<string, ExplanationData>;  // questionId -> ExplanationData
  onHeaderChange: (updated: Partial<HeaderInfo>) => void;
  vocaPreviewWords?: VocaPreviewWord[];
  onVocaPreviewWordsChange?: (words: VocaPreviewWord[]) => void;
  choiceDisplayMode?: 'both' | 'korean' | 'english'; // 보기 표시 설정
  onPassageTranslationEdit?: (questionId: string, newPassage: string) => void; // 지문 번역 편집 콜백
  onExplanationEdit?: ExplanationEditCallback; // 해설 필드 편집 콜백
  onEnglishPassageEdit?: (questionId: string, newPassage: string) => void; // 영어 지문 편집 콜백
  onChoiceEdit?: (questionId: string, choiceIndex: number, newChoice: string) => void; // 보기 편집 콜백
  onInstructionEdit?: (questionId: string, newInstruction: string) => void; // 발문 편집 콜백
  isEditMode?: boolean; // 편집 모드
}

// 지문 정규화 (공백 통일, 소문자화)
const normalizePassage = (passage: string): string => {
  return passage
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

// 두 지문이 같은지 비교 (정규화 후 비교)
const isSamePassage = (passage1: string, passage2: string): boolean => {
  const norm1 = normalizePassage(passage1);
  const norm2 = normalizePassage(passage2);
  const result = norm1 === norm2;
  // 디버깅
  if (!result && passage1 && passage2) {
    console.log('[isSamePassage] 다름:', {
      p1_len: passage1.length,
      p2_len: passage2.length,
      norm1_len: norm1.length,
      norm2_len: norm2.length,
      p1_start: passage1.substring(0, 30),
      p2_start: passage2.substring(0, 30),
    });
  }
  return result;
};

// 같은 지문을 가진 연속 문제들을 그룹핑 (해설지와 동일한 로직)
const groupByPassage = (items: QuestionItem[]) => {
  const result: { items: QuestionItem[]; sharedPassage: string }[] = [];

  // 세트 문제 처리: passage가 없으면 이전 문제의 passage 상속
  let lastPassage = '';
  const processedItems = items.map(item => {
    console.log(`[groupByPassage] 문제 ${item.questionNumber}: passage 길이=${item.passage?.length || 0}, 앞 20자="${item.passage?.substring(0, 20) || '(없음)'}"`);
    if (item.passage && item.passage.trim()) {
      lastPassage = item.passage;
      return item;
    } else if (lastPassage) {
      console.log(`[groupByPassage] 문제 ${item.questionNumber}: lastPassage 상속`);
      return { ...item, passage: lastPassage };
    }
    return item;
  });

  // 최대 그룹 크기 (4개까지만 묶음)
  const MAX_GROUP_SIZE = 4;

  processedItems.forEach((item) => {
    const lastGroup = result[result.length - 1];
    const currentPassage = item.passage || '';

    // 같은 지문이면 그룹에 추가 (연속된 문제만, 정규화 비교) + 최대 그룹 크기 제한
    if (lastGroup && isSamePassage(lastGroup.sharedPassage, currentPassage) && lastGroup.items.length < MAX_GROUP_SIZE) {
      lastGroup.items.push(item);
    } else {
      result.push({
        items: [item],
        sharedPassage: currentPassage
      });
    }
  });

  // 디버깅: 그룹핑 결과 확인
  console.log('[QuestionView] groupByPassage 결과:', result.map(g => ({
    count: g.items.length,
    numbers: g.items.map(i => i.questionNumber),
    passagePreview: g.sharedPassage.substring(0, 50) + '...'
  })));

  return result;
};

// MY VOCA 세로 리스트 컴포넌트 (개선된 디자인)
const MyVocaList = ({ count = 5 }: { count?: number }) => (
  <div className="myvoca-sidebar">
    <div className="myvoca-header">
      <span className="myvoca-title">MY VOCA</span>
    </div>
    <div className="myvoca-list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="myvoca-item">
          <span className="myvoca-num">{String(i + 1).padStart(2, '0')}</span>
          <span className="myvoca-word-box"></span>
          <span className="myvoca-meaning-line"></span>
        </div>
      ))}
    </div>
  </div>
);

// 유형별 분석 사이드바 컴포넌트
const AnalysisSidebar = ({ categoryMain, categorySub }: { categoryMain: string; categorySub?: string }) => {
  // 어휘 유형 (동의어) - 5줄만 표시
  if (categoryMain === '어휘') {
    return <MyVocaList count={5} />;
  }

  // 빈칸/논리 유형
  if (categoryMain === '논리' || categoryMain === '빈칸') {
    return (
      <div className="analysis-sidebar">
        <div className="analysis-section-title" style={{ fontSize: scaledSize(9) }}>
          1단계 | 빈칸 정체성 파악
        </div>
        <div className="analysis-box-sm"></div>

        <div className="analysis-section-title" style={{ fontSize: scaledSize(9) }}>
          2단계 | 단서 수집
        </div>
        <div className="analysis-text" style={{ fontSize: scaledSize(8) }}>
          ① 시그널 - 같은 말 | 반대 말 | 인과 | 양보 &nbsp;&nbsp; ② 그래서 빈칸은? (주관식)
        </div>
        <div className="analysis-box-sm"></div>

        <div className="analysis-section-title" style={{ fontSize: scaledSize(9), marginTop: '12px' }}>
          Feed Back & 오답 원인
        </div>
        <div className="analysis-box-sm"></div>
      </div>
    );
  }

  // 대의파악/정보파악/추론 유형
  if (categoryMain === '대의 파악' || categoryMain === '정보 파악') {
    // 어휘 적절성 문제 (밑줄 추론 등)
    if (categorySub === '어휘 적절성' || categorySub === '밑줄 추론') {
      return (
        <div className="analysis-sidebar">
          <div className="analysis-section-title" style={{ fontSize: scaledSize(9) }}>
            1단계 | 중심 소재 + 중심 내용 파악
          </div>
          <div className="analysis-box-sm"></div>

          <div className="analysis-section-title" style={{ fontSize: scaledSize(9) }}>
            2단계 | 각 보기 반의어 의심
          </div>
          <div className="analysis-box-sm"></div>

          <div className="analysis-section-title" style={{ fontSize: scaledSize(9), marginTop: '12px' }}>
            Feed Back & 오답 원인
          </div>
          <div className="analysis-box-sm"></div>
        </div>
      );
    }

    // 일반 대의파악 (제목, 요지 등)
    return (
      <div className="analysis-sidebar">
        <div className="analysis-section-title" style={{ fontSize: scaledSize(9) }}>
          중심 소재 + 중심 내용 파악
        </div>
        <div className="analysis-box-lg"></div>

        <div className="analysis-section-title" style={{ fontSize: scaledSize(9), marginTop: '12px' }}>
          Feed Back & 오답 원인
        </div>
        <div className="analysis-box-sm"></div>
      </div>
    );
  }

  // 문법 유형
  if (categoryMain === '문법') {
    return (
      <div className="analysis-sidebar">
        <div className="analysis-section-title" style={{ fontSize: scaledSize(9) }}>
          1단계 | 출제 포인트 파악
        </div>
        <div className="analysis-box-sm"></div>

        <div className="analysis-section-title" style={{ fontSize: scaledSize(9) }}>
          2단계 | 알고리즘 분석
        </div>
        <div className="analysis-box-md"></div>

        <div className="analysis-section-title" style={{ fontSize: scaledSize(9), marginTop: '12px' }}>
          Feed Back & 오답 원인
        </div>
        <div className="analysis-box-sm"></div>
      </div>
    );
  }

  // 기타 (Feed Back)
  return (
    <div className="analysis-sidebar">
      <div className="analysis-section-title" style={{ fontSize: scaledSize(9) }}>
        Feed Back & 오답 원인
      </div>
      <div className="analysis-box-lg"></div>
    </div>
  );
};

// 개별 문제 컴포넌트 (사이드바 없이)
const QuestionOnly = ({
  item,
  showAnswer,
  showInstruction,
  isLastInGroup
}: {
  item: QuestionItem;
  showAnswer: boolean;
  showInstruction: boolean;
  isLastInGroup: boolean;
}) => {
  return (
    <div className="question-only-item" style={{ marginBottom: isLastInGroup ? '16px' : '0' }}>
      <QuestionCard
        item={item}
        showAnswer={showAnswer}
        showInstruction={showInstruction}
      />
    </div>
  );
};

// 사이드바만 있는 컴포넌트
const SidebarOnly = ({
  categoryMain,
  categorySub
}: {
  categoryMain: string;
  categorySub: string;
}) => {
  return (
    <div className="sidebar-only-item">
      <AnalysisSidebar categoryMain={categoryMain} categorySub={categorySub} />
    </div>
  );
};

// 단어장 프리뷰 행 컴포넌트 (이미지 스타일)
const VocaPreviewRow = ({
  left,
  right,
  showLeftNumber,
  showRightNumber
}: {
  left: VocaPreviewWord;
  right: VocaPreviewWord | null;
  showLeftNumber: boolean;
  showRightNumber: boolean;
}) => (
  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
    {/* 왼쪽 - 번호 */}
    <td style={{ width: '4%', padding: '3px 4px', verticalAlign: 'middle' }}>
      {showLeftNumber && (
        <span style={{ fontSize: scaledSize(9), color: 'var(--primary-color, #be185d)', fontWeight: 600 }}>
          {left.questionNumber}
        </span>
      )}
    </td>
    {/* 왼쪽 - 단어 */}
    <td style={{ width: '18%', padding: '3px 6px', verticalAlign: 'middle' }}>
      <span style={{ fontSize: scaledSize(10), fontWeight: 500 }}>
        {left.word}
      </span>
    </td>
    {/* 왼쪽 - 뜻 */}
    <td style={{ width: '28%', padding: '3px 6px', verticalAlign: 'middle' }}>
      <span style={{ fontSize: scaledSize(9), color: '#4b5563' }}>
        {left.meaning}
      </span>
    </td>
    {/* 오른쪽 - 번호 */}
    <td style={{ width: '4%', padding: '3px 4px', verticalAlign: 'middle' }}>
      {right && showRightNumber && (
        <span style={{ fontSize: scaledSize(9), color: 'var(--primary-color, #be185d)', fontWeight: 600 }}>
          {right.questionNumber}
        </span>
      )}
    </td>
    {/* 오른쪽 - 단어 */}
    <td style={{ width: '18%', padding: '3px 6px', verticalAlign: 'middle' }}>
      {right && (
        <span style={{ fontSize: scaledSize(10), fontWeight: 500 }}>
          {right.word}
        </span>
      )}
    </td>
    {/* 오른쪽 - 뜻 */}
    <td style={{ width: '28%', padding: '3px 6px', verticalAlign: 'middle' }}>
      {right && (
        <span style={{ fontSize: scaledSize(9), color: '#4b5563' }}>
          {right.meaning}
        </span>
      )}
    </td>
  </tr>
);

export const QuestionView = memo(function QuestionView({
  viewMode,
  data,
  headerInfo,
  unitNumber,
  explanations,
  onHeaderChange,
  vocaPreviewWords,
  onVocaPreviewWordsChange,
  choiceDisplayMode = 'both',
  onPassageTranslationEdit,
  onExplanationEdit,
  onEnglishPassageEdit,
  onChoiceEdit,
  onInstructionEdit,
  isEditMode,
}: QuestionViewProps) {
  const groupedQuestions = useMemo(() => groupByPassage(data), [data]);

  // 각 문제를 개별 단위로 전달 (페이지 분할 가능)
  // 공동 지문 그룹은 GroupedQuestionCard로 한 번에 렌더링
  const pageChildren = useMemo(() => {
    const children: React.ReactNode[] = [];

    groupedQuestions.forEach((group, groupIdx) => {
      const firstItem = group.items[0];
      const isVocab = firstItem.categoryMain === '어휘';
      const isGrammar = firstItem.categoryMain === '문법';

      // 공동 지문 여부 판단: 같은 지문을 공유하는 2개 이상 문제 (어휘/문법은 제외)
      const isSharedPassageGroup = group.items.length > 1 && !isVocab && !isGrammar;

      if (isSharedPassageGroup) {
        // 공동 지문 그룹: GroupedQuestionCard로 한 번에 렌더링 (해설지와 동일한 구조)
        children.push(
          <div
            key={`group-${groupIdx}`}
            className="question-row-with-sidebar"
            style={{ marginBottom: '20px' }}
          >
            <div className="questions-column">
              <GroupedQuestionCard
                group={group}
                showAnswer={viewMode === 'answer'}
              />
            </div>
            <div className="sidebar-column">
              <AnalysisSidebar categoryMain={firstItem.categoryMain} categorySub={firstItem.categorySub} />
            </div>
          </div>
        );
      } else {
        // 단일 문제 또는 어휘/문법: 개별 QuestionCard로 렌더링
        group.items.forEach((item, itemIdx) => {
          const isFirst = itemIdx === 0;
          const isLast = itemIdx === group.items.length - 1;

          children.push(
            <div
              key={`${groupIdx}-${item.id}`}
              className="question-row-with-sidebar"
              style={{ marginBottom: isLast ? '20px' : '8px' }}
            >
              <div className="questions-column">
                <QuestionCard
                  item={item}
                  showAnswer={viewMode === 'answer'}
                  showInstruction={true}
                  isCommonInstruction={false}
                  groupQuestionNumbers={undefined}
                  isFirstInGroup={true}
                  hideChoices={item.categorySub === '밑줄형'}
                />
              </div>
              <div className="sidebar-column">
                {(isVocab ? isFirst : true) && (
                  <AnalysisSidebar categoryMain={item.categoryMain} categorySub={item.categorySub} />
                )}
              </div>
            </div>
          );
        });
      }
    });

    return children;
  }, [groupedQuestions, viewMode]);

  if (viewMode === 'question') {
    return (
      <A4PageLayout
        headerContent={
          <HeaderFooter
            headerInfo={headerInfo}
            showFooter={false}
            isEditable={false}
            onHeaderChange={onHeaderChange}
            unitNumber={unitNumber}
          />
        }
        showHeaderOnFirstPageOnly={true}
      >
        {pageChildren}
      </A4PageLayout>
    );
  }

  if (viewMode === 'answer') {
    return (
      <ExplanationView
        data={data}
        headerInfo={{
          ...headerInfo,
          headerTitle: headerInfo.headerTitle + ' - 해설지',
        }}
        unitNumber={unitNumber}
        explanations={explanations}
        onHeaderChange={onHeaderChange}
        choiceDisplayMode={choiceDisplayMode}
        onPassageTranslationEdit={onPassageTranslationEdit}
        onExplanationEdit={onExplanationEdit}
        onEnglishPassageEdit={onEnglishPassageEdit}
        onChoiceEdit={onChoiceEdit}
        onInstructionEdit={onInstructionEdit}
        isEditMode={isEditMode}
      />
    );
  }

  // 어휘 문제지 뷰모드 - 어휘 유형 문제에서 단어만 추출하여 표 형태로 표시
  if (viewMode === 'vocabulary') {
    // 어휘 유형 문제만 필터링
    const vocabQuestions = data.filter(q => q.categoryMain === '어휘');

    // 밑줄 단어 추출하여 데이터 준비
    const vocabData = vocabQuestions.map(q => ({
      id: q.id,
      word: extractUnderlinedWord(q.passage) || '(단어 없음)',
      questionNumber: q.questionNumber
    }));

    // 2개씩 묶기
    const pairedData: { left: typeof vocabData[0]; right: typeof vocabData[0] | null }[] = [];
    for (let i = 0; i < vocabData.length; i += 2) {
      pairedData.push({
        left: vocabData[i],
        right: vocabData[i + 1] || null
      });
    }

    const tableRows = pairedData.map((pair, index) => (
      <VocabularyTestRow key={index} left={pair.left} right={pair.right} />
    ));

    return (
      <A4PageLayout
        headerContent={
          <HeaderFooter
            headerInfo={{
              ...headerInfo,
              headerTitle: headerInfo.headerTitle + ' - 어휘 문제지',
            }}
            showFooter={false}
            isEditable={false}
            onHeaderChange={onHeaderChange}
            unitNumber={unitNumber}
          />
        }
        showHeaderOnFirstPageOnly={true}
      >
        {tableRows}
      </A4PageLayout>
    );
  }

  // 단어장 프리뷰 뷰모드 - 외부에서 제공한 단어 데이터를 2열 표로 표시
  if (viewMode === 'vocaPreview') {
    const words = vocaPreviewWords || [];

    if (words.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-center">
            <p className="text-lg mb-2">단어장 데이터가 없습니다</p>
            <p className="text-sm">사이드바에서 단어를 입력해주세요</p>
          </div>
        </div>
      );
    }

    // 페이지당 행 수 (2열이므로 한 페이지에 ROWS_PER_PAGE * 2개 단어)
    const ROWS_PER_PAGE = 28;
    const WORDS_PER_PAGE = ROWS_PER_PAGE * 2; // 한 페이지당 56개 단어

    type PairedWord = {
      left: VocaPreviewWord;
      right: VocaPreviewWord | null;
      showLeftNumber: boolean;
      showRightNumber: boolean;
    };

    // 페이지별로 단어 분할 후, 각 페이지 내에서 1열→2열 배치
    const pages: PairedWord[][] = [];

    for (let pageStart = 0; pageStart < words.length; pageStart += WORDS_PER_PAGE) {
      const pageWords = words.slice(pageStart, pageStart + WORDS_PER_PAGE);
      const pageRows: PairedWord[] = [];

      // 이 페이지 내에서 1열 다 채우고 2열 채우기
      const halfPoint = Math.ceil(pageWords.length / 2);

      let prevLeftNum = -1;
      let prevRightNum = -1;

      for (let i = 0; i < halfPoint; i++) {
        const left = pageWords[i];
        const right = pageWords[i + halfPoint] || null;

        // 왼쪽 열: 이전 왼쪽 번호와 다르면 표시
        const showLeftNumber = left.questionNumber !== prevLeftNum;
        // 오른쪽 열: 이전 오른쪽 번호와 다르면 표시
        const showRightNumber = right ? right.questionNumber !== prevRightNum : false;

        pageRows.push({
          left,
          right,
          showLeftNumber,
          showRightNumber
        });

        prevLeftNum = left.questionNumber;
        if (right) prevRightNum = right.questionNumber;
      }

      pages.push(pageRows);
    }

    // 페이지별 테이블 생성
    const pageTables = pages.map((pageRows, pageIndex) => (
      <div key={pageIndex} style={{ marginBottom: pageIndex < pages.length - 1 ? '20px' : 0 }}>
        <table className="w-full border-collapse" style={{
          tableLayout: 'fixed',
          border: '1px solid var(--primary-color, #be185d)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <tbody>
            {pageRows.map((pair, rowIndex) => (
              <VocaPreviewRow
                key={rowIndex}
                left={pair.left}
                right={pair.right}
                showLeftNumber={pair.showLeftNumber}
                showRightNumber={pair.showRightNumber}
              />
            ))}
            {/* 페이지가 32행 미만이면 빈 행으로 채우기 */}
            {pageRows.length < ROWS_PER_PAGE && Array(ROWS_PER_PAGE - pageRows.length).fill(null).map((_, i) => (
              <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ width: '4%', padding: '3px 4px' }}>&nbsp;</td>
                <td style={{ width: '18%', padding: '3px 6px' }}>&nbsp;</td>
                <td style={{ width: '28%', padding: '3px 6px' }}>&nbsp;</td>
                <td style={{ width: '4%', padding: '3px 4px' }}>&nbsp;</td>
                <td style={{ width: '18%', padding: '3px 6px' }}>&nbsp;</td>
                <td style={{ width: '28%', padding: '3px 6px' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ));

    return (
      <A4PageLayout
        headerContent={
          <HeaderFooter
            headerInfo={{
              ...headerInfo,
              headerTitle: 'Voca Preview',
              headerDescription: headerInfo.headerTitle,
            }}
            showFooter={false}
            isEditable={false}
            onHeaderChange={onHeaderChange}
            unitNumber={unitNumber}
          />
        }
        footerContent={
          headerInfo.footerLeft ? (
            <div className="mt-4 pt-2">
              <p style={{ fontSize: scaledSize(11), fontFamily: 'SUIT' }} className="text-gray-600 print:text-black">
                {headerInfo.footerLeft}
              </p>
            </div>
          ) : null
        }
        showHeaderOnFirstPageOnly={true}
      >
        {pageTables}
      </A4PageLayout>
    );
  }

  return null;
});
