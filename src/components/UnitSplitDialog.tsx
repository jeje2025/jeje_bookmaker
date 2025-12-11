import { useState, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface UnitSplitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalWords: number;
  onApply: (unitSize: number) => void;
  onReset: () => void;
}

export const UnitSplitDialog = memo(function UnitSplitDialog({
  open,
  onOpenChange,
  totalWords,
  onApply,
  onReset
}: UnitSplitDialogProps) {
  const [inputValue, setInputValue] = useState('50');

  const handleApply = () => {
    const size = parseInt(inputValue);
    if (size > 0) {
      onApply(size);
    }
  };

  const handleReset = () => {
    setInputValue('50');
    onReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>유닛 분할 설정</DialogTitle>
          <DialogDescription>
            PDF 저장 시 유닛당 단어 수를 설정합니다. 총 {totalWords}개 단어
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="unitSize">유닛당 단어 수</Label>
            <Input
              id="unitSize"
              type="number"
              min="1"
              max={totalWords}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="예: 50"
            />
            {inputValue && parseInt(inputValue) > 0 && (
              <p className="text-xs text-muted-foreground">
                → {Math.ceil(totalWords / parseInt(inputValue))}개 유닛으로 분할됩니다
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReset}
            >
              분할 해제
            </Button>
            <Button
              className="flex-1"
              onClick={handleApply}
            >
              적용
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
