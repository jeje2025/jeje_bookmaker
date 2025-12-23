import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import type { VocaPreviewWord, HeaderInfo } from '../types/question';

interface VocaPreviewInputProps {
  data: VocaPreviewWord[];
  onSave: (data: VocaPreviewWord[]) => void;
  headerInfo: HeaderInfo;
  onHeaderChange: (info: HeaderInfo) => void;
}

export function VocaPreviewInput({ data, onSave, headerInfo, onHeaderChange }: VocaPreviewInputProps) {
  const [rows, setRows] = useState<VocaPreviewWord[]>(() => {
    if (data && data.length > 0) {
      return data;
    }
    return Array(5).fill(null).map((_, i) => ({
      questionNumber: i + 1,
      word: '',
      meaning: ''
    }));
  });

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const tableRef = useRef<HTMLDivElement>(null);

  // data prop이 변경되면 rows 업데이트
  useEffect(() => {
    if (data && data.length > 0) {
      setRows(data);
    }
  }, [data]);

  // 행 추가
  const addRow = () => {
    const maxNum = Math.max(...rows.map(r => r.questionNumber), 0);
    setRows([...rows, { questionNumber: maxNum + 1, word: '', meaning: '' }]);
  };

  // 행 삭제
  const deleteRow = (index: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    onSave(newRows.filter(r => r.word.trim()));
  };

  // 셀 값 변경
  const handleCellChange = (index: number, field: keyof VocaPreviewWord, value: string | number) => {
    const newRows = [...rows];
    if (field === 'questionNumber') {
      newRows[index][field] = Number(value) || 0;
    } else {
      newRows[index][field] = String(value);
    }
    setRows(newRows);
    onSave(newRows.filter(r => r.word.trim()));
  };

  // 붙여넣기 처리 (TSV 형식: 번호 \t 단어 \t 뜻)
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    const pasteData = e.clipboardData.getData('text');
    const lines = pasteData.split('\n').filter(line => line.trim());

    if (lines.length > 1 || pasteData.includes('\t')) {
      e.preventDefault();

      const newRows: VocaPreviewWord[] = [];
      let currentNum = rows[rowIndex]?.questionNumber || 1;

      lines.forEach((line, i) => {
        const cols = line.split('\t');
        if (cols.length >= 2) {
          // 번호가 있으면 사용, 없으면 자동 증가
          const num = cols.length >= 3 ? (parseInt(cols[0]) || currentNum + i) : currentNum + i;
          const word = cols.length >= 3 ? cols[1] : cols[0];
          const meaning = cols.length >= 3 ? cols[2] : cols[1];

          newRows.push({
            questionNumber: num,
            word: word?.trim() || '',
            meaning: meaning?.trim() || ''
          });
        } else if (cols[0]?.trim()) {
          newRows.push({
            questionNumber: currentNum + i,
            word: cols[0].trim(),
            meaning: ''
          });
        }
      });

      if (newRows.length > 0) {
        // 기존 행 중 데이터가 있는 것만 유지하고 새로운 데이터 추가
        const existingData = rows.slice(0, rowIndex).filter(r => r.word.trim());
        const finalRows = [...existingData, ...newRows];
        setRows(finalRows);
        onSave(finalRows.filter(r => r.word.trim()));
        toast.success(`${newRows.length}개 단어 붙여넣기 완료`, { duration: 1000 });
      }
    }
  };

  // 엔터키로 다음 행 이동
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex === rows.length - 1) {
        addRow();
        setTimeout(() => {
          const key = `${rowIndex + 1}-word`;
          inputRefs.current[key]?.focus();
        }, 0);
      } else {
        const key = `${rowIndex + 1}-word`;
        inputRefs.current[key]?.focus();
      }
    }
  };

  // 전체 삭제
  const clearAll = () => {
    const emptyRows = Array(5).fill(null).map((_, i) => ({
      questionNumber: i + 1,
      word: '',
      meaning: ''
    }));
    setRows(emptyRows);
    onSave([]);
    toast.success('전체 삭제됨', { duration: 1000 });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 정보 입력 */}
      <div className="space-y-3 mb-4 flex-shrink-0">
        <div>
          <Label className="text-xs text-gray-500">제목</Label>
          <Input
            value={headerInfo.headerTitle}
            onChange={(e) => onHeaderChange({ ...headerInfo, headerTitle: e.target.value })}
            placeholder="한양대 2024"
            className="mt-1 text-sm"
          />
        </div>
      </div>

      {/* 입력 안내 */}
      <div className="text-xs text-slate-500 mb-2 flex-shrink-0">
        <p>또는 엑셀에서 복사: 번호 | 단어 | 뜻</p>
      </div>

      {/* 테이블 입력 영역 */}
      <div ref={tableRef} className="flex-1 overflow-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-600 w-12">번호</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-600">단어</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-600">뜻</th>
              <th className="px-1 py-1.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-1 py-0.5">
                  <input
                    type="number"
                    value={row.questionNumber}
                    onChange={(e) => handleCellChange(index, 'questionNumber', e.target.value)}
                    className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-300 rounded"
                  />
                </td>
                <td className="px-1 py-0.5">
                  <input
                    ref={(el) => { inputRefs.current[`${index}-word`] = el; }}
                    value={row.word}
                    onChange={(e) => handleCellChange(index, 'word', e.target.value)}
                    onPaste={(e) => handlePaste(e, index, 'word')}
                    onKeyDown={(e) => handleKeyDown(e, index, 'word')}
                    placeholder="단어"
                    className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-300 rounded"
                  />
                </td>
                <td className="px-1 py-0.5">
                  <input
                    ref={(el) => { inputRefs.current[`${index}-meaning`] = el; }}
                    value={row.meaning}
                    onChange={(e) => handleCellChange(index, 'meaning', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, 'meaning')}
                    placeholder="뜻"
                    className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-300 rounded"
                  />
                </td>
                <td className="px-1 py-0.5">
                  <button
                    onClick={() => deleteRow(index)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-2 mt-3 flex-shrink-0">
        <Button
          onClick={addRow}
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
        >
          + 행 추가
        </Button>
        <Button
          onClick={clearAll}
          variant="outline"
          size="sm"
          className="text-xs text-red-500 hover:text-red-600"
        >
          전체 삭제
        </Button>
      </div>

      {/* 통계 */}
      <div className="mt-2 text-xs text-slate-500 flex-shrink-0">
        총 {rows.filter(r => r.word.trim()).length}개 단어
      </div>
    </div>
  );
}
