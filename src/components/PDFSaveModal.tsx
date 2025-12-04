import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Save } from 'lucide-react';

interface PDFSaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (selectedPages: string[], useUnitCover: boolean, wordsPerUnit: number) => void;
  wordsPerUnit: number;
}

export function PDFSaveModal({ open, onOpenChange, onSave, wordsPerUnit }: PDFSaveModalProps) {
  const [selectedPages, setSelectedPages] = useState<string[]>([
    'cover',
    'card',
    'table',
    'tableSimple',
    'tableSimpleTest',
    'test',
    'testAnswer'
  ]);
  const [useUnitCover, setUseUnitCover] = useState(false);
  const [localWordsPerUnit, setLocalWordsPerUnit] = useState(wordsPerUnit);

  const pages = [
    { id: 'cover', label: '표지', icon: '📄' },
    { id: 'unitCover', label: '유닛 커버', icon: '📚', special: true },
    { id: 'card', label: '카드형', icon: '🃏' },
    { id: 'table', label: '표버전', icon: '📊' },
    { id: 'tableSimple', label: '간단버전', icon: '📋' },
    { id: 'tableSimpleTest', label: '간단테스트', icon: '✏️' },
    { id: 'test', label: '테스트', icon: '📝' },
    { id: 'testAnswer', label: '답지', icon: '✅' }
  ];

  const handleToggle = (pageId: string) => {
    if (pageId === 'unitCover') {
      setUseUnitCover(!useUnitCover);
      return;
    }

    if (selectedPages.includes(pageId)) {
      setSelectedPages(selectedPages.filter(id => id !== pageId));
    } else {
      setSelectedPages([...selectedPages, pageId]);
    }
  };

  const handleSave = () => {
    onSave(selectedPages, useUnitCover, localWordsPerUnit);
    onOpenChange(false);
  };

  const handleSelectAll = () => {
    setSelectedPages(pages.filter(p => p.id !== 'unitCover').map(p => p.id));
    setUseUnitCover(true);
  };

  const handleDeselectAll = () => {
    setSelectedPages([]);
    setUseUnitCover(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>PDF 저장 옵션</DialogTitle>
          <DialogDescription>
            인쇄할 페이지를 선택하세요. 선택한 순서대로 출력됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 전체 선택/해제 버튼 */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
              className="flex-1"
            >
              전체 선택
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDeselectAll}
              className="flex-1"
            >
              전체 해제
            </Button>
          </div>

          {/* 페이지 선택 리스트 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pages.map((page) => {
              const isChecked = page.id === 'unitCover' ? useUnitCover : selectedPages.includes(page.id);
              
              return (
                <div key={page.id} className="space-y-2">
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <Checkbox
                      id={page.id}
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(page.id)}
                    />
                    <Label
                      htmlFor={page.id}
                      className="flex-1 cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-lg">{page.icon}</span>
                      <span className="text-sm">{page.label}</span>
                    </Label>
                  </div>

                  {/* 유닛 커버 선택 시 단어 수 입력 */}
                  {page.id === 'unitCover' && useUnitCover && (
                    <div className="ml-10 mr-3 p-3 bg-slate-50 rounded-lg">
                      <Label htmlFor="words-per-unit" className="text-xs text-slate-600 mb-2 block">
                        유닛당 단어 수
                      </Label>
                      <Input
                        id="words-per-unit"
                        type="number"
                        min="1"
                        value={localWordsPerUnit}
                        onChange={(e) => setLocalWordsPerUnit(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 선택된 페이지 수 */}
          <div className="text-xs text-slate-500 text-center pt-2 border-t">
            {selectedPages.length + (useUnitCover ? 1 : 0)}개 페이지 선택됨
          </div>

          {/* 저장 버튼 */}
          <Button 
            onClick={handleSave}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2"
            disabled={selectedPages.length === 0 && !useUnitCover}
          >
            <Save size={16} />
            PDF 저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
