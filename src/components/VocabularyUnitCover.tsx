import { EditableText } from './EditableText';

interface VocabularyData {
  id: number;
  word: string;
  [key: string]: any;
}

interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

interface UnitCoverListProps {
  data: VocabularyData[];
  headerInfo: HeaderInfo;
  wordsPerUnit?: number;
  variant?: 'gradient' | 'minimal';
}

interface UnitCoverPageProps {
  unitNumber: number;
  title: string;
  description: string;
  wordsFrom: number;
  wordsTo: number;
  totalWords: number;
  variant: 'gradient' | 'minimal';
}

function UnitCoverPage({
  unitNumber,
  title,
  description,
  wordsFrom,
  wordsTo,
  totalWords,
  variant
}: UnitCoverPageProps) {
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return {
          bg: 'bg-gradient-to-br from-orange-50 via-rose-30 to-amber-30',
          decoration: (
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-20 right-20 w-64 h-64 bg-orange-200 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 left-20 w-80 h-80 bg-rose-100 rounded-full blur-3xl"></div>
            </div>
          )
        };
      default: // minimal
        return {
          bg: 'bg-white',
          decoration: (
            <div className="absolute top-8 left-8">
              <div className="w-16 h-1 bg-slate-800"></div>
            </div>
          )
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="a4-page relative overflow-hidden" style={{ breakBefore: 'page' }}>
      {/* 배경 및 데코레이션 */}
      <div className={`absolute inset-0 ${styles.bg}`}></div>
      {styles.decoration}

      {/* 메인 콘텐츠 */}
      <div className="relative h-full flex flex-col items-center justify-center px-16 text-center">
        {/* 상단 여백 */}
        <div className="flex-1"></div>
        
        {/* Unit 번호 */}
        <div className="mb-6">
          <div className="inline-block">
            <p className="text-sm uppercase tracking-widest text-slate-500 mb-2">Unit</p>
            <div className="text-[100px] leading-none tracking-tight text-slate-800" style={{ fontFamily: 'serif' }}>
              {String(unitNumber).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* 제목 */}
        <div className="mb-4 max-w-2xl">
          <h1 className="text-4xl text-slate-800 font-bold" style={{ fontFamily: 'SUIT, sans-serif' }}>
            {title}
          </h1>
        </div>

        {/* 설명 */}
        <div className="mb-8 max-w-xl">
          <p className="text-base text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* 단어 범위 표시 */}
        <div className="flex items-center gap-8 justify-center">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Words</p>
            <p className="text-xl text-slate-700">
              {wordsFrom} – {wordsTo}
            </p>
          </div>
          <div className="w-px h-10 bg-slate-300"></div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Total</p>
            <p className="text-xl text-slate-700">
              {totalWords} words
            </p>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="flex-1"></div>

        {/* 하단 작은 로고 또는 워터마크 */}
        <div className="pb-12">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-1 h-1 rounded-full bg-slate-400"></div>
            <span className="uppercase tracking-widest">Vocabulary Builder</span>
            <div className="w-1 h-1 rounded-full bg-slate-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VocabularyUnitCover({
  data,
  headerInfo,
  wordsPerUnit = 10,
  variant = 'gradient'
}: UnitCoverListProps) {
  // 유닛별로 데이터 분할
  const units: { unitNumber: number; words: VocabularyData[] }[] = [];
  for (let i = 0; i < data.length; i += wordsPerUnit) {
    units.push({
      unitNumber: Math.floor(i / wordsPerUnit) + 1,
      words: data.slice(i, i + wordsPerUnit)
    });
  }

  return (
    <>
      {units.map((unit, index) => (
        <UnitCoverPage
          key={index}
          unitNumber={unit.unitNumber}
          title={`${headerInfo.headerTitle || 'Vocabulary'} - Unit ${unit.unitNumber}`}
          description={headerInfo.headerDescription || 'Master these essential words to improve your vocabulary'}
          wordsFrom={unit.words[0]?.id || 1}
          wordsTo={unit.words[unit.words.length - 1]?.id || 1}
          totalWords={unit.words.length}
          variant={variant}
        />
      ))}
    </>
  );
}