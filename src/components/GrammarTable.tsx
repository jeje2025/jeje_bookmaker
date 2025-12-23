import { HeaderFooter } from './HeaderFooter';
import { memo } from 'react';
import { A4PageLayout } from './A4PageLayout';
import { scaledSize } from '../utils/fontScale';
import { type GrammarItem } from './GrammarSelector';

interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

interface GrammarTableProps {
  data: GrammarItem[];
  headerInfo?: HeaderInfo;
  unitNumber?: number;
  showAnswer?: boolean; // true: 해설지 (문장+해석), false: 문제지 (문장만)
  unitInfo?: string; // 좌하단 유닛 정보 (예: "Unit1 | 명사절")
}

// Voca 컴포넌트 - 페이지 하단 고정
const VocaFooter = () => (
  <div
    className="rounded-lg px-4 py-3"
    style={{
      border: '1px solid #d1d5db',
      backgroundColor: '#ffffff',
    }}
  >
    <div className="text-center mb-2">
      <span
        className="font-medium tracking-[0.2em]"
        style={{ fontSize: scaledSize(9), color: 'var(--badge-text, #64748b)' }}
      >
        <strong>Voca</strong>
      </span>
    </div>
    <div className="space-y-2">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="flex gap-4">
          {[1, 2, 3].map((col) => (
            <div
              key={col}
              className="flex-1 flex items-center"
              style={{
                borderBottom: '1px solid #d1d5db',
                paddingBottom: '4px',
                gap: '3px',
              }}
            >
              {/* 체크박스 2개 */}
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  border: '1px solid #9ca3af',
                  borderRadius: '1px',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  border: '1px solid #9ca3af',
                  borderRadius: '1px',
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const GrammarTableComponent = ({ data, headerInfo, unitNumber, showAnswer = false, unitInfo }: GrammarTableProps) => {
  // 각 행을 개별 컴포넌트로
  const tableRows = data.map((item, index) => (
    <div key={item.id} className="mb-16">
      <table className="w-full border-collapse">
        <tbody>
        {/* 첫 번째 행: 번호 + 문장 (출처는 문장 끝에 인라인) */}
        <tr>
          {/* 번호 */}
          <td className="pt-3 px-1" style={{ width: '4%', verticalAlign: 'top' }}>
            <div
              className="inline-flex items-center justify-center px-1.5 py-0.5 backdrop-blur-md rounded-full min-w-[24px]"
              style={{
                backgroundColor: 'var(--badge-bg, #f1f5f9)',
                boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)',
                marginTop: '2px',
              }}
            >
              <span
                className="font-bold text-center"
                style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
          </td>

          {/* 영어 구문 + 출처 */}
          <td className="pt-3 px-2" style={{ width: '96%', verticalAlign: 'top' }}>
            <div
              className="flex justify-between items-start gap-4"
            >
              <p
                className="text-black font-semibold flex-1"
                style={{ fontSize: scaledSize(11), lineHeight: '1.8', marginTop: '1px' }}
              >
                {item.sentence}
              </p>
              {/* 출처 - 우측 끝 */}
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                style={{
                  backgroundColor: 'var(--badge-bg, #f1f5f9)',
                  boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)',
                  fontSize: scaledSize(6),
                  color: '#4b5563',
                  fontWeight: 'normal',
                  marginTop: '2px',
                }}
              >
                {item.source}
              </span>
            </div>
            {/* 해설지 모드일 때만 해석 표시 */}
            {showAnswer && (
              <p
                className="text-slate-500 mt-2 pb-3"
                style={{ fontSize: scaledSize(10), lineHeight: '1.4' }}
              >
                {item.translation}
              </p>
            )}
          </td>
        </tr>

        {/* 두 번째 행: Step 박스 (문제지 모드에서만) - colspan으로 전체 너비 */}
        {!showAnswer && (
          <tr
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            <td colSpan={2} className="px-1 pt-2 pb-4">
              <div className="flex gap-3 mt-4">
                {/* Step 박스들 - 75% */}
                <div className="flex flex-col gap-4" style={{ width: '75%' }}>
                  <div
                    className="rounded-lg px-3 flex flex-col"
                    style={{
                      backgroundColor: 'var(--badge-bg, #f8fafc)',
                      height: '80px',
                    }}
                  >
                    <span
                      className="pt-2"
                      style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #64748b)' }}
                    >
                      <strong>Before</strong> | 수업 전 스스로 해석 해보기
                    </span>
                  </div>
                  <div
                    className="rounded-lg px-3 flex flex-col"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--badge-border, #e2e8f0)',
                      height: '110px',
                    }}
                  >
                    <span
                      className="pt-2"
                      style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #64748b)' }}
                    >
                      <strong>After</strong> | 수업 후 해석 해보고 비교하기
                    </span>
                  </div>
                </div>
                {/* MEMO 영역 - 25% */}
                <div
                  className="rounded-lg px-3 flex flex-col"
                  style={{
                    width: '25%',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--badge-border, #e2e8f0)',
                  }}
                >
                  <span
                    className="font-medium pt-2"
                    style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #94a3b8)' }}
                  >
                    MEMO
                  </span>
                </div>
              </div>
            </td>
          </tr>
        )}
        </tbody>
      </table>
    </div>
  ));

  return (
    <A4PageLayout
      headerContent={
        <HeaderFooter
          headerInfo={headerInfo}
          showFooter={false}
          isEditable={false}
          unitNumber={unitNumber}
        />
      }
      footerContent={!showAnswer ? <VocaFooter /> : undefined}
      showHeaderOnFirstPageOnly={true}
      unitInfo={unitInfo}
    >
      {tableRows}
    </A4PageLayout>
  );
};

export const GrammarTable = memo(GrammarTableComponent);
