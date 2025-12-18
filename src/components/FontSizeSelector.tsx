import { useState } from 'react';
import { Type } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

// 폰트 크기 타입
export type FontSizeKey = 'small' | 'medium' | 'large';

interface FontSizeInfo {
  name: string;
  scale: number;
}

// 폰트 크기 옵션
const fontSizes: Record<FontSizeKey, FontSizeInfo> = {
  small: {
    name: '작게',
    scale: 1,
  },
  medium: {
    name: '보통',
    scale: 1.15,
  },
  large: {
    name: '크게',
    scale: 1.3,
  },
};

interface FontSizeSelectorProps {
  currentSize: FontSizeKey;
  onSizeChange: (size: FontSizeKey) => void;
}

export function FontSizeSelector({ currentSize, onSizeChange }: FontSizeSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (key: FontSizeKey) => {
    onSizeChange(key);
    setOpen(false);
    applyFontSize(key);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200"
          title="크기 변경"
        >
          <Type size={16} />
          <span className="text-sm">크기</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-2" align="end">
        <div className="space-y-1">
          {(Object.keys(fontSizes) as FontSizeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                currentSize === key
                  ? 'bg-slate-100 text-slate-900'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="font-medium"
                  style={{ fontSize: `${12 * fontSizes[key].scale}px` }}
                >
                  가
                </span>
                <span className="text-sm">{fontSizes[key].name}</span>
              </div>
              {currentSize === key && (
                <span className="text-slate-500 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// CSS 변수에 폰트 크기 적용
export function applyFontSize(sizeKey: FontSizeKey) {
  const size = fontSizes[sizeKey];
  const root = document.documentElement;

  root.style.setProperty('--font-scale', size.scale.toString());
  root.setAttribute('data-font-size', sizeKey);
}

export { fontSizes };
