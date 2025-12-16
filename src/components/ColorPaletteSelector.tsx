import { useState } from 'react';
import { Palette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

// 팔레트 색상 타입 (PDF용 opacity 분리)
interface PaletteColorInfo {
  name: string;
  badgeBg: string;       // HEX 색상
  badgeBgOpacity: number; // 배경 투명도
  badgeText: string;     // HEX 색상
  badgeBorder: string;   // HEX 색상
  badgeBorderOpacity: number; // 테두리 투명도
}

// Pantone 컬러 팔레트 - 뱃지/강조색용 (HEX + opacity 분리)
const pantoneColors: Record<string, PaletteColorInfo> = {
  default: {
    name: '기본 (슬레이트)',
    badgeBg: '#f1f5f9',           // slate-100
    badgeBgOpacity: 0.9,
    badgeText: '#475569',         // slate-600
    badgeBorder: '#cbd5e1',       // slate-300
    badgeBorderOpacity: 0.5,
  },
  'classic-blue': {
    name: 'Classic Blue',
    badgeBg: '#dbeafe',           // blue-100
    badgeBgOpacity: 0.9,
    badgeText: '#1e40af',         // blue-800
    badgeBorder: '#93c5fd',       // blue-300
    badgeBorderOpacity: 0.5,
  },
  'living-coral': {
    name: 'Living Coral',
    badgeBg: '#ffe4e6',           // rose-100
    badgeBgOpacity: 0.9,
    badgeText: '#be123c',         // rose-700
    badgeBorder: '#fda4af',       // rose-300
    badgeBorderOpacity: 0.5,
  },
  'ultra-violet': {
    name: 'Ultra Violet',
    badgeBg: '#ede9fe',           // violet-100
    badgeBgOpacity: 0.9,
    badgeText: '#6d28d9',         // violet-700
    badgeBorder: '#c4b5fd',       // violet-300
    badgeBorderOpacity: 0.5,
  },
  greenery: {
    name: 'Greenery',
    badgeBg: '#dcfce7',           // green-100
    badgeBgOpacity: 0.9,
    badgeText: '#15803d',         // green-700
    badgeBorder: '#86efac',       // green-300
    badgeBorderOpacity: 0.5,
  },
  'peach-fuzz': {
    name: 'Peach Fuzz',
    badgeBg: '#ffedd5',           // orange-100
    badgeBgOpacity: 0.9,
    badgeText: '#c2410c',         // orange-700
    badgeBorder: '#fdba74',       // orange-300
    badgeBorderOpacity: 0.5,
  },
  'viva-magenta': {
    name: 'Viva Magenta',
    badgeBg: '#fce7f3',           // pink-100
    badgeBgOpacity: 0.9,
    badgeText: '#be185d',         // pink-700
    badgeBorder: '#f9a8d4',       // pink-300
    badgeBorderOpacity: 0.5,
  },
  'mocha-mousse': {
    name: 'Mocha Mousse',
    badgeBg: '#fef3c7',           // amber-100
    badgeBgOpacity: 0.9,
    badgeText: '#92400e',         // amber-800
    badgeBorder: '#fcd34d',       // amber-300
    badgeBorderOpacity: 0.5,
  },
  serenity: {
    name: 'Serenity',
    badgeBg: '#e0e7ff',           // indigo-100
    badgeBgOpacity: 0.9,
    badgeText: '#3730a3',         // indigo-800
    badgeBorder: '#a5b4fc',       // indigo-300
    badgeBorderOpacity: 0.5,
  },
  marsala: {
    name: 'Marsala',
    badgeBg: '#fee2e2',           // red-100
    badgeBgOpacity: 0.9,
    badgeText: '#991b1b',         // red-800
    badgeBorder: '#fca5a5',       // red-300
    badgeBorderOpacity: 0.5,
  },
  teal: {
    name: 'Teal',
    badgeBg: '#ccfbf1',           // teal-100
    badgeBgOpacity: 0.9,
    badgeText: '#0f766e',         // teal-700
    badgeBorder: '#5eead4',       // teal-300
    badgeBorderOpacity: 0.5,
  },
  cyan: {
    name: 'Cyan',
    badgeBg: '#cffafe',           // cyan-100
    badgeBgOpacity: 0.9,
    badgeText: '#0e7490',         // cyan-700
    badgeBorder: '#67e8f9',       // cyan-300
    badgeBorderOpacity: 0.5,
  },
};

// HEX를 RGBA 문자열로 변환 (웹용 - 공백 없이)
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

type PaletteKey = keyof typeof pantoneColors;

interface ColorPaletteSelectorProps {
  currentPalette: PaletteKey;
  onPaletteChange: (palette: PaletteKey) => void;
}

export function ColorPaletteSelector({ currentPalette, onPaletteChange }: ColorPaletteSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (key: PaletteKey) => {
    onPaletteChange(key);
    setOpen(false);
    applyPalette(key);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200"
          title="뱃지 색상 변경"
        >
          <div
            className="w-4 h-4 rounded-full border"
            style={{
              backgroundColor: pantoneColors[currentPalette].badgeBg,
              borderColor: pantoneColors[currentPalette].badgeBorder
            }}
          />
          <Palette size={16} />
          <span className="text-sm">컬러</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 px-2 py-1">뱃지 컬러 팔레트</p>
          {(Object.keys(pantoneColors) as PaletteKey[]).map((key) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                currentPalette === key
                  ? 'bg-slate-100 text-slate-900'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: pantoneColors[key].badgeBg,
                  borderColor: pantoneColors[key].badgeBorder,
                  color: pantoneColors[key].badgeText
                }}
              >
                동
              </div>
              <span className="text-sm">{pantoneColors[key].name}</span>
              {currentPalette === key && (
                <span className="ml-auto text-slate-500 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// CSS 변수에 팔레트 적용 (웹용 - RGBA로 변환)
export function applyPalette(paletteKey: PaletteKey) {
  const palette = pantoneColors[paletteKey];
  const root = document.documentElement;

  // 뱃지 색상 CSS 변수 설정 (RGBA로 변환)
  root.style.setProperty('--badge-bg', hexToRgba(palette.badgeBg, palette.badgeBgOpacity));
  root.style.setProperty('--badge-text', palette.badgeText);
  root.style.setProperty('--badge-border', hexToRgba(palette.badgeBorder, palette.badgeBorderOpacity));
  root.setAttribute('data-palette', paletteKey);
}

export { pantoneColors, hexToRgba };
export type { PaletteKey, PaletteColorInfo };
