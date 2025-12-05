import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// 한글 폰트 등록 (Pretendard - 더 안정적인 CDN)
Font.register({
  family: 'Pretendard',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf',
      fontWeight: 700,
    },
  ],
});

// Hyphenation 비활성화 (한글에 불필요)
Font.registerHyphenationCallback((word) => [word]);

// A4 사이즈 스타일 - 브라우저 VocabularyCard.tsx와 동일하게 맞춤
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 35,
    fontFamily: 'Pretendard',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  headerDescription: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 8,
  },
  // 카드 스타일 - VocabularyCard.tsx와 매칭
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb', // border-gray-200
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 28,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cardLeft: {
    width: '28%',
  },
  cardRight: {
    width: '72%',
    flexDirection: 'row',
  },
  cardRightContent: {
    flex: 1,
  },
  // ID 배지 - 8px 폰트
  idBadge: {
    fontSize: 6,
    color: '#475569',
    backgroundColor: '#f1f5f9', // bg-slate-100
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0', // border-slate-200
    marginBottom: 6,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // 단어 - 22px bold
  word: {
    fontSize: 18,
    fontWeight: 700,
    color: '#000000',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  // 품사 - 10px bold gray
  partOfSpeech: {
    fontSize: 8,
    fontWeight: 700,
    color: '#9ca3af', // text-gray-400
  },
  // 의미 컨테이너
  meaningContainer: {
    marginBottom: 6,
  },
  // 의미 - 13px
  meaning: {
    fontSize: 11,
    color: '#000000',
    lineHeight: 1.4,
  },
  // 정의 - 10.5px italic gray
  definition: {
    fontSize: 8.5,
    color: '#6b7280', // text-gray-500
    marginTop: 2,
    lineHeight: 1.3,
  },
  // 예문 컨테이너 - 왼쪽 보더
  exampleContainer: {
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db', // border-gray-300
    paddingLeft: 8,
  },
  // 예문 - 12px (text-xs)
  example: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  // 번역 - 10px gray
  translation: {
    fontSize: 8,
    color: '#4b5563', // text-gray-600
    lineHeight: 1.3,
  },
  // 체크박스
  checkboxContainer: {
    flexDirection: 'row',
    gap: 5,
    marginLeft: 10,
  },
  checkbox: {
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  // 하단 섹션
  cardBottom: {
    flexDirection: 'row',
  },
  // 파생어 컨테이너
  derivativesContainer: {
    width: '28%',
  },
  derivative: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 1,
  },
  // 파생어 단어 - 11px medium
  derivativeWord: {
    fontSize: 9,
    color: '#1f2937', // text-gray-800
  },
  // 파생어 품사 - 8px
  derivativePos: {
    fontSize: 6,
    color: '#9ca3af', // text-gray-400
  },
  // 파생어 의미 - 10px
  derivativeMeaning: {
    fontSize: 8,
    color: '#6b7280', // text-gray-500
  },
  // 정보 컨테이너 (동의어, 반의어, 어원)
  infoContainer: {
    width: '72%',
    flexDirection: 'row',
  },
  infoSection: {
    width: '25%',
  },
  infoSectionWide: {
    width: '50%',
  },
  // 정보 배지 (동, 반, Tip)
  infoBadge: {
    fontSize: 6,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 3,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // 정보 텍스트 - 10px
  infoText: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  footer: {
    marginTop: 12,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#4b5563',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 25,
    right: 35,
    fontSize: 8,
    color: '#9ca3af',
  },
});

interface VocabularyItem {
  id: number;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  definition?: string;
  synonyms: string[];
  antonyms: string[];
  derivatives: Array<{ word: string; meaning: string; partOfSpeech?: string }>;
  example: string;
  translation: string;
  translationHighlight?: string;
  etymology: string;
}

interface HeaderInfo {
  headerTitle: string;
  headerDescription: string;
  footerLeft: string;
}

interface VocabularyPDFProps {
  data: VocabularyItem[];
  headerInfo: HeaderInfo;
}

// 카드 컴포넌트
const VocabularyCardPDF = ({ item }: { item: VocabularyItem }) => (
  <View style={styles.card} wrap={false}>
    {/* Top section */}
    <View style={styles.cardTop}>
      {/* Left: Word */}
      <View style={styles.cardLeft}>
        <Text style={styles.idBadge}>{String(item.id).padStart(3, '0')}</Text>
        <Text style={styles.word}>{item.word}</Text>
      </View>

      {/* Right: Meaning & Examples */}
      <View style={styles.cardRight}>
        <View style={styles.cardRightContent}>
          <View style={styles.meaningContainer}>
            <Text style={styles.meaning}>
              <Text style={styles.partOfSpeech}>{item.partOfSpeech} </Text>
              {item.meaning}
            </Text>
            {item.definition && (
              <Text style={styles.definition}>{item.definition}</Text>
            )}
          </View>
          <View style={styles.exampleContainer}>
            <Text style={styles.example}>{item.example}</Text>
            <Text style={styles.translation}>{item.translation}</Text>
          </View>
        </View>
        <View style={styles.checkboxContainer}>
          <View style={styles.checkbox} />
          <View style={styles.checkbox} />
          <View style={styles.checkbox} />
        </View>
      </View>
    </View>

    {/* Bottom section */}
    <View style={styles.cardBottom}>
      {/* Left: Derivatives */}
      <View style={styles.derivativesContainer}>
        {item.derivatives.map((der, idx) => (
          <View key={idx} style={styles.derivative}>
            <Text style={styles.derivativeWord}>{der.word}</Text>
            {der.partOfSpeech && (
              <Text style={styles.derivativePos}>{der.partOfSpeech}</Text>
            )}
            <Text style={styles.derivativeMeaning}>{der.meaning}</Text>
          </View>
        ))}
      </View>

      {/* Right: Synonyms, Antonyms, Etymology */}
      <View style={styles.infoContainer}>
        <View style={styles.infoSection}>
          <Text style={styles.infoBadge}>동</Text>
          <Text style={styles.infoText}>{item.synonyms.join(', ')}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoBadge}>반</Text>
          <Text style={styles.infoText}>{item.antonyms.join(', ')}</Text>
        </View>
        <View style={styles.infoSectionWide}>
          <Text style={styles.infoBadge}>Tip</Text>
          <Text style={styles.infoText}>{item.etymology}</Text>
        </View>
      </View>
    </View>
  </View>
);

// 메인 PDF 문서
export const VocabularyPDF = ({ data, headerInfo }: VocabularyPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header - 첫 페이지에만 */}
      {headerInfo.headerTitle && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{headerInfo.headerTitle}</Text>
          {headerInfo.headerDescription && (
            <Text style={styles.headerDescription}>
              {headerInfo.headerDescription}
            </Text>
          )}
        </View>
      )}

      {/* Vocabulary Cards */}
      {data.map((item) => (
        <VocabularyCardPDF key={item.id} item={item} />
      ))}

      {/* Footer */}
      {headerInfo.footerLeft && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{headerInfo.footerLeft}</Text>
        </View>
      )}

      {/* Page Number */}
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
        fixed
      />
    </Page>
  </Document>
);

export default VocabularyPDF;
