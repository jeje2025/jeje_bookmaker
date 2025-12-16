import { useState } from 'react';
import { Settings, Save, Layers, Palette, ChevronRight, X } from 'lucide-react';
import { Button } from './ui/button';
import { UnitSplitButton } from './UnitSplitButton';
import { ColorPaletteSelector, type PaletteKey } from './ColorPaletteSelector';

interface FloatingMenuProps {
  // 유닛 분할
  totalWords: number;
  currentUnitSize: number | null;
  onUnitApply: (size: number) => void;
  onUnitReset: () => void;
  // 컬러 팔레트
  colorPalette: PaletteKey;
  onColorPaletteChange: (palette: PaletteKey) => void;
  // PDF 저장
  onSavePDF: () => void;
  isPDFLoading: boolean;
  // 관리자
  onAdminClick: () => void;
}

export function FloatingMenu({
  totalWords,
  currentUnitSize,
  onUnitApply,
  onUnitReset,
  colorPalette,
  onColorPaletteChange,
  onSavePDF,
  isPDFLoading,
  onAdminClick,
}: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="flex items-end gap-2"
      style={{
        position: 'fixed',
        right: '2rem',
        bottom: '0.5rem',
        zIndex: 40
      }}
    >
      {/* 메뉴 패널 - 버튼 왼쪽에 위치 */}
      <div
        className={`transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        <div
          className="bg-white rounded-xl shadow-xl p-3 flex flex-col gap-2 min-w-[180px]"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', pointerEvents: 'auto' }}
        >
          {/* 유닛 분할 */}
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <UnitSplitButton
                totalWords={totalWords}
                currentUnitSize={currentUnitSize}
                onApply={onUnitApply}
                onReset={onUnitReset}
              />
            </div>
          </div>

          {/* 컬러 팔레트 */}
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <ColorPaletteSelector
                currentPalette={colorPalette}
                onPaletteChange={onColorPaletteChange}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 my-1" />

          {/* PDF 저장 */}
          <Button
            onClick={onSavePDF}
            disabled={isPDFLoading}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-2 justify-center"
            size="sm"
          >
            <Save size={14} />
            {isPDFLoading ? '생성 중...' : 'PDF 저장'}
          </Button>

          <div className="border-t border-slate-100 my-1" />

          {/* 관리자 */}
          <button
            onClick={onAdminClick}
            className="w-full p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50 flex items-center gap-2 justify-center text-sm"
          >
            <Settings size={14} />
            관리자
          </button>
        </div>
      </div>

      {/* 메인 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-slate-800 text-white'
            : 'bg-white text-slate-700 hover:bg-slate-100'
        }`}
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)', pointerEvents: 'auto' }}
      >
        {isOpen ? <X size={20} /> : <ChevronRight size={20} className="rotate-180" />}
      </button>
    </div>
  );
}
