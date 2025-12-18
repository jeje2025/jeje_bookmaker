import { HeaderFooter } from './HeaderFooter';
import { EditableText } from './EditableText';
import { memo } from 'react';
import { A4PageLayout } from './A4PageLayout';
import { scaledSize } from '../utils/fontScale';

interface VocabularyItem {
  id: number;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  definition?: string;
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

interface VocabularyTableProps {
  data: VocabularyItem[];
  headerInfo?: HeaderInfo;
  isEditable?: boolean;
  onUpdate?: (id: number, field: string, value: any) => void;
  onHeaderChange?: (headerInfo: { headerTitle: string; headerDescription: string }) => void;
  unitNumber?: number;
}

const VocabularyTableComponent = ({ data, headerInfo, isEditable = false, onUpdate, onHeaderChange, unitNumber }: VocabularyTableProps) => {
  const highlightWord = (text: string, wordToHighlight: string) => {
    // 대소문자 구분 없이 찾기
    const lowerText = text.toLowerCase();
    const lowerWord = wordToHighlight.toLowerCase();
    
    // 단어의 다양한 형태를 찾기 위해 indexOf 사용
    const index = lowerText.indexOf(lowerWord);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <strong>{text.substring(index, index + wordToHighlight.length)}</strong>
        {text.substring(index + wordToHighlight.length)}
      </>
    );
  };

  // 각 행을 개별 컴포넌트로
  const tableRows = data.map((item) => (
    <table key={item.id} className="w-full border-collapse">
      <tbody>
        <tr
          style={{
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            borderBottom: '1px solid var(--badge-border, #cbd5e1)'
          }}
        >
          {/* 번호 */}
          <td className="pt-1 pb-2 px-1 align-top" style={{ width: '3%' }}>
            <div className="inline-flex items-center justify-center px-1.5 py-0.5 backdrop-blur-md rounded-full min-w-[28px]" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)' }}>
              <span className="font-medium text-center" style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>
                {String(item.id).padStart(3, '0')}
              </span>
            </div>
          </td>

          {/* 단어 / 파생어 */}
          <td className="pt-1 pb-2 px-3 align-top" style={{ width: '18%' }}>
            <div className="space-y-1">
              <div>
                <div style={{ fontSize: scaledSize(14), fontWeight: 'bold' }} className="text-black">
                  {isEditable ? (
                    <EditableText
                      value={item.word}
                      onChange={(val) => onUpdate?.(item.id, 'word', val)}
                      isEditable={true}
                      className="text-black"
                      style={{ fontSize: scaledSize(14), fontWeight: 'bold' }}
                    />
                  ) : (
                    item.word
                  )}
                </div>
                {item.pronunciation && (
                  <div className="text-gray-400" style={{ fontSize: scaledSize(9), marginTop: '-1px' }}>
                    {isEditable ? (
                      <EditableText
                        value={item.pronunciation}
                        onChange={(val) => onUpdate?.(item.id, 'pronunciation', val)}
                        isEditable={true}
                        className="text-gray-400"
                        style={{ fontSize: scaledSize(9) }}
                      />
                    ) : (
                      item.pronunciation
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1 pb-1">
                {item.derivatives.map((der, idx) => (
                  <div key={idx} style={{ lineHeight: '1.3' }}>
                    <div className="text-gray-800 print:text-black" style={{ fontSize: scaledSize(11) }}>{der.word}</div>
                    <div className="text-gray-500" style={{ fontSize: scaledSize(8) }}>
                      {der.partOfSpeech && <span className="text-gray-400 font-bold mr-1">{der.partOfSpeech}</span>}
                      {der.meaning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>

          {/* 뜻 / 예문 */}
          <td className="pt-1 pb-2 px-3 align-top" style={{ width: '42%' }}>
            <div className="space-y-1">
              <div>
                <span style={{ fontSize: scaledSize(10), fontWeight: 'bold', color: 'var(--badge-text, #475569)', marginRight: '4px' }}>
                  {item.partOfSpeech}
                </span>
                <span className="text-black" style={{ fontSize: scaledSize(12), lineHeight: '0.9' }}>
                  {isEditable ? (
                    <EditableText
                      value={item.meaning}
                      onChange={(val) => onUpdate?.(item.id, 'meaning', val)}
                      isEditable={true}
                      className="text-black"
                      style={{ fontSize: scaledSize(12), lineHeight: '0.9' }}
                    />
                  ) : (
                    item.meaning
                  )}
                </span>
              </div>
              {item.definition && (
                <div className="text-gray-500 italic" style={{ fontSize: scaledSize(9), lineHeight: '1.3' }}>
                  {isEditable ? (
                    <EditableText
                      value={item.definition}
                      onChange={(val) => onUpdate?.(item.id, 'definition', val)}
                      isEditable={true}
                      className="text-gray-500 italic"
                      style={{ fontSize: scaledSize(9), lineHeight: '1.3' }}
                      multiline
                    />
                  ) : (
                    item.definition
                  )}
                </div>
              )}
              <div className="text-black" style={{ fontSize: scaledSize(10), lineHeight: '1.3' }}>
                {isEditable ? (
                  <EditableText
                    value={item.example}
                    onChange={(val) => onUpdate?.(item.id, 'example', val)}
                    isEditable={true}
                    className="text-black"
                    style={{ fontSize: scaledSize(10), lineHeight: '1.3' }}
                    multiline
                  />
                ) : (
                  highlightWord(item.example, item.word)
                )}
              </div>
              <div className="text-gray-600" style={{ fontSize: scaledSize(9), lineHeight: '1.3' }}>
                {isEditable ? (
                  <EditableText
                    value={item.translation}
                    onChange={(val) => onUpdate?.(item.id, 'translation', val)}
                    isEditable={true}
                    className="text-gray-600"
                    style={{ fontSize: scaledSize(9), lineHeight: '1.3' }}
                    multiline
                  />
                ) : (
                  item.translation
                )}
              </div>
            </div>
          </td>

          {/* 동의어 */}
          <td className="pt-1 pb-2 px-3 align-top" style={{ width: '14%' }}>
            <div className="inline-flex items-center justify-center px-1 py-0.5 backdrop-blur-md rounded-full mb-0.5" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)' }}>
              <span className="font-medium text-center" style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>동</span>
            </div>
            <div className="text-gray-600 print:text-black" style={{ fontSize: scaledSize(10), lineHeight: '1.4' }}>
              {isEditable ? (
                <EditableText
                  value={item.synonyms.join(', ')}
                  onChange={(val) => {
                    const synonymsArray = val.split(',').map(s => s.trim()).filter(s => s);
                    onUpdate?.(item.id, 'synonyms', synonymsArray);
                  }}
                  isEditable={true}
                  className="text-gray-600 print:text-black"
                  style={{ fontSize: scaledSize(10), lineHeight: '1.4' }}
                  multiline
                  inputWidth="100%"
                />
              ) : (
                item.synonyms.join(', ')
              )}
            </div>
          </td>

          {/* 반의어 */}
          <td className="pt-1 pb-2 px-3 align-top" style={{ width: '14%' }}>
            <div className="inline-flex items-center justify-center px-1 py-0.5 backdrop-blur-md rounded-full mb-0.5" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)' }}>
              <span className="font-medium text-center" style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>반</span>
            </div>
            <div className="text-gray-600 print:text-black" style={{ fontSize: scaledSize(10), lineHeight: '1.4' }}>
              {isEditable ? (
                <EditableText
                  value={item.antonyms.join(', ')}
                  onChange={(val) => {
                    const antonymsArray = val.split(',').map(s => s.trim()).filter(s => s);
                    onUpdate?.(item.id, 'antonyms', antonymsArray);
                  }}
                  isEditable={true}
                  className="text-gray-600 print:text-black"
                  style={{ fontSize: scaledSize(10), lineHeight: '1.4' }}
                  multiline
                  inputWidth="100%"
                />
              ) : (
                item.antonyms.join(', ')
              )}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  ));

  return (
    <A4PageLayout
      headerContent={
        <HeaderFooter
          headerInfo={headerInfo}
          showFooter={false}
          isEditable={isEditable}
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

export const VocabularyTable = memo(VocabularyTableComponent);