import { memo, useMemo } from 'react';
import { QuestionCard } from './QuestionCard';
import { HeaderFooter } from './HeaderFooter';
import { A4PageLayout } from './A4PageLayout';
import { scaledSize } from '../utils/fontScale';
import type { QuestionItem, HeaderInfo, ViewMode } from '../types/question';

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

interface QuestionViewProps {
  viewMode: ViewMode;
  data: QuestionItem[];
  headerInfo: HeaderInfo;
  unitNumber?: number;
  onHeaderChange: (updated: Partial<HeaderInfo>) => void;
}

// 같은 발문을 가진 연속 문제들을 그룹핑
const groupByInstruction = (items: QuestionItem[]) => {
  const result: { instruction: string; items: QuestionItem[] }[] = [];

  items.forEach((item) => {
    const lastGroup = result[result.length - 1];

    if (lastGroup && lastGroup.instruction === item.instruction) {
      lastGroup.items.push(item);
    } else {
      result.push({
        instruction: item.instruction,
        items: [item]
      });
    }
  });

  return result;
};

// MY VOCA 세로 리스트 컴포넌트
const MyVocaList = ({ count = 30 }: { count?: number }) => (
  <div className="myvoca-sidebar">
    <div className="myvoca-title">MY VOCA</div>
    <div className="myvoca-dotted"></div>
    <div className="myvoca-list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="myvoca-row">
          <span className="myvoca-check">☐☐</span>
          <span className="myvoca-num">{String(i + 1).padStart(2, '0')}</span>
          <span className="myvoca-line"></span>
        </div>
      ))}
    </div>
  </div>
);

// 유형별 분석 사이드바 컴포넌트
const AnalysisSidebar = ({ categoryMain, categorySub }: { categoryMain: string; categorySub?: string }) => {
  // 어휘 유형 (동의어)
  if (categoryMain === '어휘') {
    return <MyVocaList count={30} />;
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
          ① 시그널 - 같은 말 | 반대 말 | 인과 | 양보
        </div>
        <div className="analysis-text" style={{ fontSize: scaledSize(8) }}>
          ② 그래서 빈칸은? (주관식)
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

// 문제 그룹 + 사이드바 레이아웃
const QuestionGroupWithSidebar = ({
  group,
  showAnswer
}: {
  group: { instruction: string; items: QuestionItem[] };
  showAnswer: boolean;
}) => {
  // 그룹의 첫 문제 유형으로 사이드바 결정
  const categoryMain = group.items[0]?.categoryMain || '';
  const categorySub = group.items[0]?.categorySub || '';

  return (
    <div className="question-group-layout">
      {/* 좌측: 문제들 */}
      <div className="questions-column">
        {group.items.map((item, idx) => (
          <QuestionCard
            key={item.id}
            item={item}
            showAnswer={showAnswer}
            showInstruction={idx === 0}
          />
        ))}
      </div>

      {/* 우측: 분석 영역 */}
      <div className="sidebar-column">
        <AnalysisSidebar categoryMain={categoryMain} categorySub={categorySub} />
      </div>
    </div>
  );
};

export const QuestionView = memo(function QuestionView({
  viewMode,
  data,
  headerInfo,
  unitNumber,
  onHeaderChange,
}: QuestionViewProps) {
  const groupedQuestions = useMemo(() => groupByInstruction(data), [data]);

  // 각 그룹을 별도 children으로 전달
  const pageChildren = useMemo(() => {
    return groupedQuestions.map((group, idx) => (
      <QuestionGroupWithSidebar
        key={idx}
        group={group}
        showAnswer={viewMode === 'answer'}
      />
    ));
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
      <A4PageLayout
        headerContent={
          <HeaderFooter
            headerInfo={{
              ...headerInfo,
              headerTitle: headerInfo.headerTitle + ' - 해설지',
            }}
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

  return null;
});
