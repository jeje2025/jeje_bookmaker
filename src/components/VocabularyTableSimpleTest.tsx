import { HeaderFooter } from './HeaderFooter';
import { A4PageLayout } from './A4PageLayout';

interface VocabularyItem {
  id: number;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  synonyms: string[];
  antonyms: string[];
  derivatives: Array<{ word: string; meaning: string; partOfSpeech: string }>;
  example: string;
  translation: string;
  etymology: string;
}

interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

interface VocabularyTableSimpleTestProps {
  data: VocabularyItem[];
  headerInfo?: HeaderInfo;
  unitNumber?: number;
}

export function VocabularyTableSimpleTest({ data, headerInfo, unitNumber }: VocabularyTableSimpleTestProps) {
  // 데이터를 2개씩 묶기
  const pairedData = [];
  for (let i = 0; i < data.length; i += 2) {
    pairedData.push({
      left: data[i],
      right: data[i + 1] || null
    });
  }

  // 각 행을 개별 컴포넌트로
  const tableRows = pairedData.map((pair, index) => (
    <table key={index} className="w-full border-collapse">
      <tbody>
        <tr
          style={{
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            borderBottom: '1px solid var(--badge-border, #cbd5e1)'
          }}
        >
          {/* 왼쪽 - 번호 */}
          <td className="py-2 px-1 align-top" style={{ width: '4%' }}>
            <div className="inline-block px-2 py-0.5 backdrop-blur-md rounded-full" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)' }}>
              <p className="uppercase tracking-tight font-medium" style={{ fontSize: '8px', color: 'var(--badge-text, #475569)' }}>
                {String(pair.left.id).padStart(3, '0')}
              </p>
            </div>
          </td>

          {/* 왼쪽 - 단어 */}
          <td className="py-2 px-3 align-top" style={{ width: '46%' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }} className="text-black">
              {pair.left.word}
            </div>
          </td>

          {/* 오른쪽 - 번호 */}
          <td className="py-2 px-1 align-top" style={{ width: '4%' }}>
            {pair.right && (
              <div className="inline-block px-2 py-0.5 backdrop-blur-md rounded-full" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)' }}>
                <p className="uppercase tracking-tight font-medium" style={{ fontSize: '8px', color: 'var(--badge-text, #475569)' }}>
                  {String(pair.right.id).padStart(3, '0')}
                </p>
              </div>
            )}
          </td>

          {/* 오른쪽 - 단어 */}
          <td className="py-2 px-3 align-top" style={{ width: '46%' }}>
            {pair.right && (
              <div style={{ fontSize: '14px', fontWeight: 'bold' }} className="text-black">
                {pair.right.word}
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  ));

  return (
    <A4PageLayout
      headerContent={<HeaderFooter headerInfo={headerInfo} showFooter={false} unitNumber={unitNumber} />}
      showHeaderOnFirstPageOnly={true}
    >
      {tableRows}
    </A4PageLayout>
  );
}