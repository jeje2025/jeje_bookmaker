import { EditableText } from './EditableText';
import { memo } from 'react';
import { scaledSize } from '../utils/fontScale';

interface VocabularyCardProps {
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
  translationHighlight?: string;
  etymology: string;
  isEditable?: boolean;
  onUpdate?: (id: number, field: string, value: any) => void;
}

const VocabularyCardComponent = ({
  id,
  word,
  pronunciation,
  partOfSpeech,
  meaning,
  definition,
  synonyms,
  antonyms,
  derivatives,
  example,
  translation,
  translationHighlight,
  etymology,
  isEditable = false,
  onUpdate
}: VocabularyCardProps) => {
  // 예문에서 표제어를 굵게 처리하는 함수
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
        <span style={{ fontWeight: 'bold', color: 'var(--badge-text)' }}>{text.substring(index, index + wordToHighlight.length)}</span>
        {text.substring(index + wordToHighlight.length)}
      </>
    );
  };

  // 번역에서 특정 문구를 굵게 처리하는 함수
  const highlightTranslation = (text: string, highlightText?: string) => {
    if (!highlightText) return text;
    
    const index = text.indexOf(highlightText);
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span style={{ fontWeight: 'bold', color: 'var(--badge-text)' }}>{highlightText}</span>
        {text.substring(index + highlightText.length)}
      </>
    );
  };

  return (
    <div
      className="vocabulary-card rounded-lg bg-white/80 backdrop-blur-sm py-3 pl-4 pr-8 mb-3 shadow-sm"
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        overflow: 'visible',
        marginBottom: '12px',
        border: '1px solid var(--badge-border, #e5e7eb)'
      }}
    >
      <div style={{ overflow: 'visible' }}>
        {/* Top section - Word on left, Meaning & Examples on right */}
        <div className="grid gap-4 mb-3" style={{ gridTemplateColumns: '28% 72%' }}>
          {/* Left: Word */}
          <div>
            <div className="inline-flex items-center justify-center px-1.5 py-0.5 backdrop-blur-md rounded-full mb-2" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)' }}>
              <p className="uppercase tracking-tight font-medium text-center" style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>
                {String(id).padStart(3, '0')}
              </p>
            </div>
            <h2 className="mb-0.5 tracking-tight" style={{ fontSize: scaledSize(22), fontWeight: 'bold', color: 'var(--badge-text, #000)' }}>
              {isEditable ? (
                <EditableText
                  value={word}
                  onChange={(val) => onUpdate?.(id, 'word', val)}
                  isEditable={true}
                  className="tracking-tight"
                  style={{ fontSize: scaledSize(22), fontWeight: 'bold', color: 'var(--badge-text, #000)' }}
                />
              ) : (
                word
              )}
            </h2>
            {pronunciation && (
              <p className="text-gray-400" style={{ fontSize: scaledSize(10), marginTop: '-2px' }}>
                {isEditable ? (
                  <EditableText
                    value={pronunciation}
                    onChange={(val) => onUpdate?.(id, 'pronunciation', val)}
                    isEditable={true}
                    className="text-gray-400"
                    style={{ fontSize: scaledSize(10) }}
                  />
                ) : (
                  pronunciation
                )}
              </p>
            )}
          </div>
          
          {/* Right: Meaning & Examples + Checkboxes */}
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="mb-2">
                <p className="text-black leading-snug" style={{ fontSize: scaledSize(13) }}>
                  <span style={{ fontSize: scaledSize(10), fontWeight: 'bold', color: 'var(--badge-text, #475569)' }}>
                    {isEditable ? (
                      <EditableText
                        value={partOfSpeech}
                        onChange={(val) => onUpdate?.(id, 'partOfSpeech', val)}
                        isEditable={true}
                        style={{ fontSize: scaledSize(10), fontWeight: 'bold', color: 'var(--badge-text, #475569)' }}
                      />
                    ) : (
                      partOfSpeech
                    )}
                  </span>{' '}
                  {isEditable ? (
                    <EditableText
                      value={meaning}
                      onChange={(val) => onUpdate?.(id, 'meaning', val)}
                      isEditable={true}
                      className="text-black leading-snug"
                      style={{ fontSize: scaledSize(13) }}
                    />
                  ) : (
                    meaning
                  )}
                </p>
                {definition && (
                  <p className="text-gray-500 leading-snug mt-0.5 italic" style={{ fontSize: scaledSize(10.5) }}>
                    {isEditable ? (
                      <EditableText
                        value={definition}
                        onChange={(val) => onUpdate?.(id, 'definition', val)}
                        isEditable={true}
                        className="text-gray-500 leading-snug italic"
                        style={{ fontSize: scaledSize(10.5) }}
                      />
                    ) : (
                      definition
                    )}
                  </p>
                )}
              </div>
              <div className="pl-2.5 border-l border-gray-300">
                <p className="text-black leading-snug mb-0.5" style={{ fontSize: scaledSize(12) }}>
                  {isEditable ? (
                    <EditableText
                      value={example}
                      onChange={(val) => onUpdate?.(id, 'example', val)}
                      isEditable={isEditable}
                      className="text-black leading-snug"
                      style={{ fontSize: scaledSize(12) }}
                    >
                      {highlightWord(example, word)}
                    </EditableText>
                  ) : (
                    highlightWord(example, word)
                  )}
                </p>
                <p className="text-gray-600 leading-snug mb-0" style={{ fontSize: scaledSize(10) }}>
                  {isEditable ? (
                    <EditableText
                      value={translation}
                      onChange={(val) => onUpdate?.(id, 'translation', val)}
                      isEditable={isEditable}
                      className="text-gray-600 leading-snug"
                      style={{ fontSize: scaledSize(10) }}
                    >
                      {highlightTranslation(translation, translationHighlight)}
                    </EditableText>
                  ) : (
                    highlightTranslation(translation, translationHighlight)
                  )}
                </p>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex gap-1.5 items-start">
              <div className="w-2 h-2" style={{ border: '1px solid var(--badge-border, #d1d5db)' }}></div>
              <div className="w-2 h-2" style={{ border: '1px solid var(--badge-border, #d1d5db)' }}></div>
              <div className="w-2 h-2" style={{ border: '1px solid var(--badge-border, #d1d5db)' }}></div>
            </div>
          </div>
        </div>

        {/* Bottom section - Derivatives on left, Synonyms/Antonyms/Etymology on right */}
        <div className="grid gap-4 bg-[rgba(0,0,0,0)]" style={{ gridTemplateColumns: '28% 72%', fontSize: scaledSize(12) }}>
          {/* Left: Derivatives */}
          <div>
            <div className="space-y-0.5">
              {derivatives.map((der, idx) => (
                <div key={idx} className="leading-tight flex items-baseline gap-1.5">
                  <span className="text-gray-800 print:text-black font-medium" style={{ fontSize: scaledSize(11) }}>{der.word}</span>
                  {der.partOfSpeech && <span style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>{der.partOfSpeech}</span>}
                  <span className="text-gray-500" style={{ fontSize: scaledSize(10) }}>{der.meaning}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Synonyms, Antonyms, Etymology */}
          <div className="grid grid-cols-4 gap-2">
            {/* Synonyms - 25% */}
            <div>
              <div className="inline-flex items-center justify-center px-1 py-0.5 backdrop-blur-md rounded-full mb-0.5" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)' }}>
                <p className="uppercase tracking-tight font-medium text-center" style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>동</p>
              </div>
              <div className="text-gray-600 print:text-black" style={{ fontSize: scaledSize(10) }}>
                {isEditable ? (
                  <EditableText
                    value={synonyms.join(', ')}
                    onChange={(val) => {
                      const synonymsArray = val.split(',').map(s => s.trim()).filter(s => s);
                      onUpdate?.(id, 'synonyms', synonymsArray);
                    }}
                    isEditable={true}
                    className="text-gray-600 print:text-black"
                    style={{ fontSize: scaledSize(10) }}
                    multiline
                    inputWidth="100%"
                  />
                ) : (
                  synonyms.join(', ')
                )}
              </div>
            </div>

            {/* Antonyms - 25% */}
            <div>
              <div className="inline-flex items-center justify-center px-1 py-0.5 backdrop-blur-md rounded-full mb-0.5" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)' }}>
                <p className="uppercase tracking-tight font-medium text-center" style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>반</p>
              </div>
              <div className="text-gray-600 print:text-black" style={{ fontSize: scaledSize(10) }}>
                {isEditable ? (
                  <EditableText
                    value={antonyms.join(', ')}
                    onChange={(val) => {
                      const antonymsArray = val.split(',').map(s => s.trim()).filter(s => s);
                      onUpdate?.(id, 'antonyms', antonymsArray);
                    }}
                    isEditable={true}
                    className="text-gray-600 print:text-black"
                    style={{ fontSize: scaledSize(10) }}
                    multiline
                    inputWidth="100%"
                  />
                ) : (
                  antonyms.join(', ')
                )}
              </div>
            </div>

            {/* Etymology - 50% */}
            <div className="col-span-2">
              <div className="inline-flex items-center justify-center px-1.5 py-0.5 backdrop-blur-md rounded-full mb-0.5" style={{ backgroundColor: 'var(--badge-bg, #f1f5f9)', boxShadow: '0 0 0 0.5px var(--badge-border, #cbd5e1)' }}>
                <p className="uppercase tracking-tight font-medium text-center" style={{ fontSize: scaledSize(8), color: 'var(--badge-text, #475569)' }}>Tip</p>
              </div>
              <div className="text-gray-600 print:text-black leading-snug" style={{ fontSize: scaledSize(10) }}>
                {isEditable ? (
                  <EditableText
                    value={etymology}
                    onChange={(val) => onUpdate?.(id, 'etymology', val)}
                    isEditable={true}
                    className="text-gray-600 leading-snug"
                    style={{ fontSize: scaledSize(10) }}
                    multiline
                  />
                ) : (
                  etymology
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(VocabularyCardComponent);

// 호환성을 위한 named export
export const VocabularyCard = memo(VocabularyCardComponent);