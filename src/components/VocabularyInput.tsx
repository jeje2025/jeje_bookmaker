import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

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
  translationHighlight?: string;
  etymology: string;
}

interface VocabularyInputProps {
  onSave: (data: VocabularyItem[], tokenInfo?: { inputTokens: number, outputTokens: number }) => void;
  initialData?: VocabularyItem[];
  data?: VocabularyItem[];
  fullscreen?: boolean;
  headerInfo?: { headerTitle: string; headerDescription: string };
  onHeaderChange?: (headerInfo: { headerTitle: string; headerDescription: string }) => void;
  onChange?: (data: VocabularyItem[]) => void; // 실시간 변경 콜백 추가
}

interface CellData {
  word: string;
  meaning: string;
  synonyms: string;
  antonyms: string;
  derivatives: string;
  example: string;
  translation: string;
}

export function VocabularyInput({ onSave, initialData = [], data, fullscreen = false, headerInfo, onHeaderChange, onChange }: VocabularyInputProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [titleError, setTitleError] = useState(false);
  const [wordInput, setWordInput] = useState(''); // 큰 텍스트 입력창

  // 초기 데이터를 CellData 형식으로 변환
  const convertToCellData = (items: VocabularyItem[]): CellData[] => {
    return items.map(item => ({
      word: item.word,
      meaning: item.meaning,
      synonyms: item.synonyms.join(', '),
      antonyms: item.antonyms.join(', '),
      derivatives: item.derivatives.map(d => d.word).join(', '),
      example: item.example,
      translation: item.translation
    }));
  };

  const [rows, setRows] = useState<CellData[]>(() => {
    // data prop이 있으면 그걸 사용, 없으면 빈 10개 행
    if (data && data.length > 0) {
      return convertToCellData(data);
    }
    return Array(10).fill(null).map(() => ({
      word: '',
      meaning: '',
      synonyms: '',
      antonyms: '',
      derivatives: '',
      example: '',
      translation: ''
    }));
  });

  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // data prop이 변경되면 rows 업데이트
  useEffect(() => {
    if (data && data.length > 0) {
      setRows(convertToCellData(data));
    }
  }, [data]);

  // fullscreen 모드에 따라 다른 열 구성
  const columns: (keyof CellData)[] = fullscreen
    ? ['word', 'meaning', 'synonyms', 'antonyms', 'derivatives', 'example', 'translation']
    : ['word', 'meaning'];

  const columnLabels: { [key in keyof CellData]: string } = {
    word: '단어',
    meaning: '뜻',
    synonyms: '동의어',
    antonyms: '반의어',
    derivatives: '파생어',
    example: '예문',
    translation: '번역'
  };

  // 행 추가
  const addRow = () => {
    setRows([...rows, {
      word: '',
      meaning: '',
      synonyms: '',
      antonyms: '',
      derivatives: '',
      example: '',
      translation: ''
    }]);
  };

  // 행 삭제
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  // 셀 값 변경
  const updateCell = (rowIndex: number, column: keyof CellData, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][column] = value;
    setRows(newRows);
    
    // ⭐ 실시간으로 부모에게 변경 알림 (기존 데이터 유지하면서 업데이트)
    if (onChange && data && data[rowIndex]) {
      const updatedItem = {
        ...data[rowIndex],
        [column]: column === 'synonyms' || column === 'antonyms' 
          ? value.split(',').map(s => s.trim()).filter(s => s !== '')
          : value
      };
      
      const newData = [...data];
      newData[rowIndex] = updatedItem;
      onChange(newData);
    } else if (onChange) {
      // data가 없거나 해당 인덱스가 없으면 새로운 아이템 생성
      onChange(newRows.map((row, idx) => ({
        id: idx + 1,
        word: row.word,
        pronunciation: data?.[idx]?.pronunciation || '',
        partOfSpeech: data?.[idx]?.partOfSpeech || '',
        meaning: row.meaning,
        definition: data?.[idx]?.definition || undefined,
        synonyms: row.synonyms.split(',').map(s => s.trim()).filter(s => s !== ''),
        antonyms: row.antonyms.split(',').map(s => s.trim()).filter(s => s !== ''),
        derivatives: data?.[idx]?.derivatives || [],
        example: row.example,
        translation: row.translation,
        translationHighlight: data?.[idx]?.translationHighlight || undefined,
        etymology: data?.[idx]?.etymology || ''
      })));
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 다음 행으로 이동
      const nextRow = rowIndex + 1;
      if (nextRow >= rows.length) {
        addRow();
      }
      setTimeout(() => {
        const key = `${nextRow}-${colIndex}`;
        inputRefs.current[key]?.focus();
      }, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // 다음 칸으로 이동
      const nextCol = colIndex + 1;
      if (nextCol < columns.length) {
        const key = `${rowIndex}-${nextCol}`;
        inputRefs.current[key]?.focus();
      } else {
        // 마지막 칸이면 다음 행의 첫 번째 칸으로
        const nextRow = rowIndex + 1;
        if (nextRow >= rows.length) {
          addRow();
        }
        setTimeout(() => {
          const key = `${nextRow}-0`;
          inputRefs.current[key]?.focus();
        }, 0);
      }
    }
  };

  // 붙여넣기 처리
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, startRow: number, startCol: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const rows_data = pastedData.split('\n').filter(row => row.trim() !== '');
    
    const newRows = [...rows];
    
    rows_data.forEach((row, rowOffset) => {
      const cells = row.split('\t');
      const targetRow = startRow + rowOffset;
      
      // 필요하면 행 추가
      while (newRows.length <= targetRow) {
        newRows.push({
          word: '',
          meaning: '',
          synonyms: '',
          antonyms: '',
          derivatives: '',
          example: '',
          translation: ''
        });
      }
      
      cells.forEach((cell, colOffset) => {
        const targetCol = startCol + colOffset;
        if (targetCol < columns.length) {
          newRows[targetRow][columns[targetCol]] = cell.trim();
        }
      });
    });
    
    setRows(newRows);
  };

  // CSV 파일 업로드 처리
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const newRows: CellData[] = [];
      
      // 첫 번째 줄이 헤더인지 확인 (단어, 뜻 등의 키워드가 있으면 헤더로 간주)
      const firstLine = lines[0].toLowerCase();
      const startIndex = firstLine.includes('단어') || firstLine.includes('word') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const cells = lines[i].split('\t').map(cell => cell.trim());
        
        if (cells[0]) { // 단어가 있으면
          newRows.push({
            word: cells[0] || '',
            meaning: cells[1] || '',
            synonyms: cells[2] || '',
            antonyms: cells[3] || '',
            derivatives: cells[4] || '',
            example: cells[5] || '',
            translation: cells[6] || ''
          });
        }
      }
      
      if (newRows.length > 0) {
        setRows(newRows);
      }
    };
    
    reader.readAsText(file);
    
    // 파일 입력 초화 (같은 파일을 다시 선택할 수 있도)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Gemini API로 부족한 정보 생성 (백엔드 호출 - 배치 모드) - 재시도 로직 포함
  const generateMissingDataBatch = async (items: CellData[], retries = 3): Promise<{ items: VocabularyItem[], inputTokens: number, outputTokens: number }> => {
    try {
      // 빈 단어 필터링
      const validItems = items.filter(item => item.word && item.word.trim() !== '');
      
      if (validItems.length === 0) {
        console.error('생성할 단어가 없습니다');
        return { items: [], inputTokens: 0, outputTokens: 0 };
      }
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-7e289e1b/generate-word-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          words: validItems.map(item => ({
            word: item.word.trim(),
            meaning: item.meaning ? item.meaning.trim() : '',
            synonyms: item.synonyms ? item.synonyms.trim() : '',
            antonyms: item.antonyms ? item.antonyms.trim() : '',
            derivatives: item.derivatives ? item.derivatives.trim() : '',
            example: item.example ? item.example.trim() : '',
            translation: item.translation ? item.translation.trim() : ''
          }))
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('백엔드 API 오류:', errorText);
        throw new Error('Failed to generate word info');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      const generatedArray = result.data;
      const inputTokens = result.inputTokens || 0;
      const outputTokens = result.outputTokens || 0;

      // 생성된 데이터를 단어명으로 매핑 (순서가 밀리는 문제 방지)
      const generatedMap = new Map<string, any>();
      generatedArray.forEach((gen: any) => {
        if (gen && gen.word) {
          generatedMap.set(gen.word.toLowerCase().trim(), gen);
        }
      });

      // 생성된 데이터와 원본 데이터를 병합 (단어명으로 매칭)
      const vocabularyItems = validItems.map((item) => {
        const wordKey = item.word.toLowerCase().trim();
        const generated = generatedMap.get(wordKey) || {};

        // 파생어 처리: AI가 생성한 것 사용 (사용자 입력 단어 + AI 뜻/품사)
        // AI 응답에 partOfSpeech가 없으면 빈 문자열로 처리
        const derivatives = (generated.derivatives || []).map((d: any) => ({
          word: d.word || '',
          meaning: d.meaning || '',
          partOfSpeech: d.partOfSpeech || ''
        }));

        return {
          id: 0,
          word: item.word,
          pronunciation: generated.pronunciation || '',
          partOfSpeech: generated.partOfSpeech || '',
          meaning: item.meaning || generated.meaning || '',
          definition: generated.definition || undefined,
          synonyms: item.synonyms ? item.synonyms.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : (generated.synonyms || []),
          antonyms: item.antonyms ? item.antonyms.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : (generated.antonyms || []),
          derivatives,
          example: item.example || generated.example || '',
          translation: item.translation || generated.translation || '',
          translationHighlight: generated.translationHighlight || undefined,
          etymology: generated.etymology || ''
        };
      });
      
      return { items: vocabularyItems, inputTokens, outputTokens };
    } catch (error) {
      console.error('API 오류:', error);
      
      // 재시도 로직
      if (retries > 0) {
        console.log(`재시도 중... (남은 횟수: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        return generateMissingDataBatch(items, retries - 1);
      }
      
      // 최종 실패 시 기본값 반환
      return { items: items.map(item => ({
        id: 0,
        word: item.word,
        pronunciation: '',
        partOfSpeech: '',
        meaning: item.meaning,
        definition: undefined,
        synonyms: item.synonyms ? item.synonyms.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : [],
        antonyms: item.antonyms ? item.antonyms.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : [],
        derivatives: item.derivatives ? item.derivatives.split(',').map((s: string) => ({ word: s.trim(), meaning: '', partOfSpeech: '' })).filter((d: any) => d.word !== '') : [],
        example: item.example,
        translation: item.translation,
        translationHighlight: undefined,
        etymology: ''
      })), inputTokens: 0, outputTokens: 0 };
    }
  };

  // 저장 처리 (서버 내부 병렬 처리 활용 - 200개씩 청크로 서버에 요청)
  const handleSave = async (targetRows?: CellData[]) => {
    const rowsToProcess = targetRows || rows; // ⭐ 파라미터가 있으면 그걸 사용
    const nonEmptyRows = rowsToProcess.filter(row => row.word && row.word.trim() !== '');

    console.log('=== handleSave 시작 ===');
    console.log('전체 행 수:', rowsToProcess.length);
    console.log('비어있지 않은 행 수:', nonEmptyRows.length);
    console.log('첫 3개 행:', nonEmptyRows.slice(0, 3));

    if (nonEmptyRows.length === 0) {
      toast.error('단어를 입력해주세요.', { duration: 1000 });
      return;
    }

    setIsGenerating(true);

    try {
      // 서버가 내부적으로 병렬 처리하므로 큰 청크 단위로 전송
      // 200개씩 (서버에서 20개 배치 x 10개 병렬 = 약 40초 이내 처리)
      const CHUNK_SIZE = 200;
      const chunks: CellData[][] = [];
      for (let i = 0; i < nonEmptyRows.length; i += CHUNK_SIZE) {
        chunks.push(nonEmptyRows.slice(i, i + CHUNK_SIZE));
      }

      console.log(`총 ${chunks.length}개 청크 (각 최대 ${CHUNK_SIZE}개, 서버 내부 병렬 처리)`);

      // 로딩 메시지
      toast.loading(`AI가 ${nonEmptyRows.length}개 단어를 서버 병렬 분석 중... (${chunks.length}개 요청)`, {
        id: 'generating',
        duration: Infinity
      });

      // 결과 합치기
      const allGeneratedItems: VocabularyItem[] = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      // 청크 순차 처리 (각 청크는 서버에서 내부 병렬 처리)
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`청크 ${i + 1}/${chunks.length} 시작: ${chunk.length}개 단어`);

        // 진행률 업데이트
        if (chunks.length > 1) {
          toast.loading(`AI가 ${nonEmptyRows.length}개 단어를 서버 병렬 분석 중... (${i + 1}/${chunks.length} 청크)`, {
            id: 'generating',
            duration: Infinity
          });
        }

        const result = await generateMissingDataBatch(chunk);
        console.log(`청크 ${i + 1} 완료: ${result.items.length}개`);
        allGeneratedItems.push(...result.items);
        totalInputTokens += result.inputTokens;
        totalOutputTokens += result.outputTokens;
      }

      // 생성 중 토스트 닫기
      toast.dismiss('generating');

      console.log('생성 완료! 총', allGeneratedItems.length, '개');
      console.log(`📊 총 토큰 사용량 - 입력: ${totalInputTokens}, 출력: ${totalOutputTokens}`);

      const vocabularyItems = allGeneratedItems.map((item, index) => ({
        ...item,
        id: index + 1
      }));

      // 입력창 표에 생성된 데이터 반영
      setRows(convertToCellData(vocabularyItems));

      // 완료 토스트 - dismiss 후 충분한 딜레이 (1초)
      setTimeout(() => {
        toast.success(`${vocabularyItems.length}개 단어 생성 완료!`, {
          duration: 1000
        });
      }, 300);

      onSave(vocabularyItems, { inputTokens: totalInputTokens, outputTokens: totalOutputTokens });
    } catch (error) {
      console.error('생성 오류:', error);
      toast.dismiss('generating');
      toast.error('AI 생성 중 오류가 발생했습니다.', { duration: 1000 });
    } finally {
      setIsGenerating(false);
    }
  };

  // 단어 입력창에서 엔터/쉼표로 구분된 단어를 테이블에 채우기 (동기 처리)
  const handleWordInputProcess = (): CellData[] | null => {
    if (!wordInput.trim()) return null;
    
    // 엔터나 쉼표로 구분
    const words = wordInput
      .split(/[\n,]+/)
      .map(w => w.trim())
      .filter(w => w !== '');
    
    if (words.length === 0) return null;
    
    // 새로운 rows 생성
    const newRows = words.map(word => ({
      word,
      meaning: '',
      synonyms: '',
      antonyms: '',
      derivatives: '',
      example: '',
      translation: ''
    }));
    
    setRows(newRows);
    setWordInput(''); // 입력창 비우기
    
    return newRows; // ⭐ 생성된 rows를 반환
  };

  return (
    <div className="flex flex-col h-full">
      {/* 제목/설명 입력 - 2줄로 */}
      {headerInfo && onHeaderChange && (
        <div className="mb-4 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="headerTitle" className={`whitespace-nowrap text-xs ${titleError ? 'text-red-600' : 'text-slate-700'}`}>제목 (필수)</Label>
            <Input
              id="headerTitle"
              value={headerInfo.headerTitle}
              onChange={(e) => {
                onHeaderChange({ ...headerInfo, headerTitle: e.target.value });
                if (titleError) setTitleError(false);
              }}
              placeholder="예: 튼튼 영어 중간 고사 대비"
              className={`bg-white flex-1 transition-all text-sm ${
                titleError 
                  ? 'border-red-500 border-2 ring-4 ring-red-100 animate-shake' 
                  : 'border-gray-300'
              }`}
              style={{ fontFamily: 'SUIT', fontWeight: '600' }}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="headerDescription" className="text-slate-600 whitespace-nowrap text-xs">설명 (선택)</Label>
            <Input
              id="headerDescription"
              value={headerInfo.headerDescription}
              onChange={(e) => onHeaderChange({ ...headerInfo, headerDescription: e.target.value })}
              placeholder="예: 1학년 2반 김영희"
              className="bg-white border-gray-300 flex-1 text-gray-700 placeholder:text-gray-400 text-sm"
              style={{ fontFamily: 'SUIT' }}
            />
          </div>
        </div>
      )}
      
      {/* 큰 단어 입력창 */}
      <div className="mb-4 flex-shrink-0">
        <Label className="text-xs text-slate-700 mb-2 block">단어 입력 (쉼표 또는 엔터로 구분)</Label>
        <textarea
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
          placeholder="단어를 입력하세요. 예: apple, banana, cat"
          className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="mt-2 flex gap-2">
          <Button onClick={addRow} variant="outline" size="sm">
            + 행
          </Button>
          <Button
            onClick={() => {
              setRows(Array(10).fill(null).map(() => ({
                word: '',
                meaning: '',
                synonyms: '',
                antonyms: '',
                derivatives: '',
                example: '',
                translation: ''
              })));
              setWordInput('');
              toast.success('모든 데이터가 비워졌습니다', { duration: 1000 });
            }}
            variant="outline"
            size="sm"
          >
            전체 비우기
          </Button>
        </div>
      </div>

      {/* 엑셀 표 - 옆으로 스크롤 */}
      <div className="h-[350px] overflow-auto border border-gray-300 rounded flex-shrink-0">{/* flex-1에서 고정 높이로 변경 */}
        <div className="overflow-x-scroll overflow-y-auto h-full">{/* overflow-x-auto를 overflow-x-scroll로 변경 */}
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="border border-gray-300 px-2 py-2 text-xs w-12">#</th>
                {columns.map((col) => (
                  <th key={col} className="border border-gray-300 px-3 py-2 text-xs min-w-[96px]">
                    {columnLabels[col]}
                  </th>
                ))}
                <th className="border border-gray-300 px-2 py-2 text-xs w-12">삭제</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border border-gray-300 px-2 py-1 text-xs text-center bg-gray-50">
                    {rowIndex + 1}
                  </td>
                  {columns.map((col, colIndex) => (
                    <td key={col} className="border border-gray-300 p-0">
                      <input
                        ref={(el) => {
                          inputRefs.current[`${rowIndex}-${colIndex}`] = el;
                        }}
                        type="text"
                        value={row[col]}
                        onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                        onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                        className="w-full min-w-[96px] px-2 py-1.5 text-xs border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    </td>
                  ))}
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="text-red-600 hover:text-red-800 text-xs"
                      disabled={rows.length === 1}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 생성 버튼 - 엑셀 표 아래 */}
      <div className="mt-4 flex-shrink-0">
        <Button
          onClick={async () => {
            // 제목 체크를 먼저 수행
            if (headerInfo && (headerInfo.headerTitle.trim() === 'JEJEVOCA' || headerInfo.headerTitle.trim() === '')) {
              setTitleError(true);
              toast.error('제목을 먼저 입력해주세요!', { duration: 1000 });

              setTimeout(() => {
                const titleInput = document.getElementById('headerTitle') as HTMLInputElement;
                if (titleInput) {
                  if (headerInfo.headerTitle.trim() === 'JEJEVOCA') {
                    if (onHeaderChange) {
                      onHeaderChange({ ...headerInfo, headerTitle: '' });
                    }
                  }
                  titleInput.focus();
                  titleInput.select();
                }
              }, 100);

              setTimeout(() => {
                setTitleError(false);
              }, 3000);

              return;
            }

            // 통합 입력창에 단어가 있으면 그걸로 생성, 없으면 엑셀 표 데이터로 생성
            if (wordInput.trim()) {
              const newRows = handleWordInputProcess();
              if (newRows) {
                handleSave(newRows);
              }
            } else {
              // 엑셀 표 데이터로 생성
              handleSave();
            }
          }}
          disabled={isGenerating || (!wordInput.trim() && !rows.some(row => row.word.trim()))}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white"
          size="lg"
        >
          {isGenerating ? 'AI 생성 중...' : '🤖 AI 단어장 생성'}
        </Button>
      </div>
    </div>
  );
}