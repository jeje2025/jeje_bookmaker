import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// 한글 폰트 등록 (Noto Sans KR - Google Fonts CDN)
Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLGC5nwmHvBNKQ.woff2',
      fontWeight: 400,
      fontStyle: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLGC5nwmHvBNKQ.woff2',
      fontWeight: 400,
      fontStyle: 'italic', // italic은 normal과 동일하게 처리 (한글 폰트는 italic이 없음)
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyhbSC5nwmHvBNKQ.woff2',
      fontWeight: 700,
      fontStyle: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyhbSC5nwmHvBNKQ.woff2',
      fontWeight: 700,
      fontStyle: 'italic',
    },
  ],
});

// A4 사이즈 스타일
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSansKR',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  headerDescription: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 32,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    marginBottom: 12,
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
  idBadge: {
    fontSize: 7,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  word: {
    fontSize: 20,
    fontWeight: 700,
    color: '#000000',
    marginBottom: 2,
  },
  partOfSpeech: {
    fontSize: 8,
    fontWeight: 700,
    color: '#9ca3af',
  },
  meaning: {
    fontSize: 11,
    color: '#000000',
    marginBottom: 4,
  },
  definition: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  exampleContainer: {
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db',
    paddingLeft: 10,
  },
  example: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 2,
  },
  translation: {
    fontSize: 9,
    color: '#4b5563',
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 12,
  },
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cardBottom: {
    flexDirection: 'row',
  },
  derivativesContainer: {
    width: '28%',
  },
  derivative: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  },
  derivativeWord: {
    fontSize: 9,
    fontWeight: 700,
    color: '#1f2937',
  },
  derivativePos: {
    fontSize: 7,
    color: '#9ca3af',
  },
  derivativeMeaning: {
    fontSize: 8,
    color: '#6b7280',
  },
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
  infoBadge: {
    fontSize: 7,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  infoText: {
    fontSize: 8,
    color: '#4b5563',
  },
  footer: {
    marginTop: 16,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 9,
    color: '#4b5563',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 9,
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
          <View style={{ marginBottom: 8 }}>
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
