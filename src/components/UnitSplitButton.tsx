import { useState, memo, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SplitSquareHorizontal } from 'lucide-react';

interface UnitSplitButtonProps {
  totalWords: number;
  currentUnitSize: number | null;
  onApply: (unitSize: number) => void;
  onReset: () => void;
}

// 버튼과 다이얼로그를 하나로 묶어서 App의 리렌더링 방지
export const UnitSplitButton = memo(function UnitSplitButton({
  totalWords,
  currentUnitSize,
  onApply,
  onReset
}: UnitSplitButtonProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('50');
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    const size = parseInt(inputValue);
    if (size > 0) {
      setOpen(false); // 다이얼로그 먼저 닫기
      startTransition(() => {
        onApply(size); // 무거운 리렌더링은 트랜지션으로
      });
    }
  };

  const handleReset = () => {
    setInputValue('50');
    setOpen(false); // 다이얼로그 먼저 닫기
    startTransition(() => {
      onReset(); // 무거운 리렌더링은 트랜지션으로
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
        disabled={isPending}
      >
        <SplitSquareHorizontal size={16} className={isPending ? 'animate-spin' : ''} />
        {isPending ? '적용 중...' : currentUnitSize ? `${currentUnitSize}개씩` : '분할'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
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
    </>
  );
});
