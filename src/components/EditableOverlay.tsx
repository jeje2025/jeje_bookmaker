/**
 * Editable Overlay Component
 * PDF 이미지 위에 투명 레이어로 편집 영역을 제공합니다.
 * 텍스트 클릭 시 contentEditable 모드로 인라인 편집이 가능합니다.
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import type { EditableRegion } from '../types/question';
import { Edit3 } from 'lucide-react';

interface EditableOverlayProps {
  /** 현재 페이지의 편집 가능 영역 목록 */
  regions: EditableRegion[];
  /** PDF 렌더링 스케일 */
  scale: number;
  /** PDF 페이지 높이 (포인트 단위) */
  pageHeight: number;
  /** PDF 페이지 너비 (포인트 단위) */
  pageWidth: number;
  /** 저장 콜백 */
  onSave: (regionId: string, newText: string) => void;
  /** 취소 콜백 */
  onCancel?: (regionId: string) => void;
  /** 컨테이너 크기 (실제 표시 크기) */
  containerSize?: { width: number; height: number };
}

/**
 * PDF 좌표를 화면 좌표로 변환
 * PDF는 좌하단 원점, 화면은 좌상단 원점
 */
function pdfToScreenCoords(
  pdfRect: { x: number; y: number; width: number; height: number },
  pageHeight: number,
  scale: number,
  containerScale: number = 1
): React.CSSProperties {
  const effectiveScale = scale * containerScale;
  return {
    left: pdfRect.x * effectiveScale,
    top: (pageHeight - pdfRect.y - pdfRect.height) * effectiveScale,
    width: pdfRect.width * effectiveScale,
    height: pdfRect.height * effectiveScale,
  };
}

/**
 * 단일 편집 영역 컴포넌트
 */
const EditableRegionItem = memo(function EditableRegionItem({
  region,
  scale,
  pageHeight,
  containerScale,
  onSave,
  onCancel,
}: {
  region: EditableRegion;
  scale: number;
  pageHeight: number;
  containerScale: number;
  onSave: (regionId: string, newText: string) => void;
  onCancel?: (regionId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(region.text);
  const [isHovered, setIsHovered] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // 편집 모드 진입
  const handleClick = useCallback(() => {
    if (!isEditing) {
      setEditValue(region.text);
      setIsEditing(true);
    }
  }, [isEditing, region.text]);

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
      // 텍스트 전체 선택
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  // 저장 처리
  const handleSave = useCallback(() => {
    const newText = editorRef.current?.textContent || '';

    // 빈 값이면 원본 복원 (FR-011)
    if (!newText.trim()) {
      onSave(region.id, region.originalText);
    } else {
      onSave(region.id, newText);
    }

    setIsEditing(false);
  }, [region.id, region.originalText, onSave]);

  // 취소 처리
  const handleCancel = useCallback(() => {
    setEditValue(region.text);
    setIsEditing(false);
    onCancel?.(region.id);
  }, [region.id, region.text, onCancel]);

  // 키보드 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // blur 핸들러
  const handleBlur = useCallback(() => {
    // 약간의 딜레이 후 저장 (다른 요소 클릭 시)
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 100);
  }, [isEditing, handleSave]);

  // 화면 좌표 계산
  const screenStyle = pdfToScreenCoords(region.pdfRect, pageHeight, scale, containerScale);

  return (
    <div
      className={`editable-region ${isEditing ? 'editing' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        position: 'absolute',
        ...screenStyle,
        cursor: isEditing ? 'text' : 'pointer',
        backgroundColor: isEditing ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        border: isEditing ? '2px solid var(--badge-text, #be185d)' : isHovered ? '1px dashed var(--badge-text, #be185d)' : 'none',
        borderRadius: 2,
        zIndex: isEditing ? 100 : 10,
        transition: 'border 0.15s, background-color 0.15s',
        overflow: 'hidden',
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 편집 힌트 아이콘 (T035) */}
      {isHovered && !isEditing && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            backgroundColor: 'var(--badge-text, #be185d)',
            color: 'white',
            borderRadius: '50%',
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            zIndex: 20,
          }}
        >
          <Edit3 size={10} />
        </div>
      )}

      {/* 편집 영역 */}
      {isEditing ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          style={{
            width: '100%',
            height: '100%',
            padding: 2,
            fontSize: 'inherit',
            fontFamily: 'inherit',
            lineHeight: 'inherit',
            outline: 'none',
            overflow: 'auto',
          }}
        >
          {editValue}
        </div>
      ) : null}
    </div>
  );
});

/**
 * Editable Overlay 컴포넌트
 */
export const EditableOverlay = memo(function EditableOverlay({
  regions,
  scale,
  pageHeight,
  pageWidth,
  onSave,
  onCancel,
  containerSize,
}: EditableOverlayProps) {
  // 컨테이너 스케일 계산 (PDF 원본 크기 대비 표시 크기)
  const containerScale = containerSize
    ? containerSize.width / (pageWidth * scale)
    : 1;

  if (regions.length === 0) {
    return null;
  }

  return (
    <div
      className="editable-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {regions.map(region => (
        <div key={region.id} style={{ pointerEvents: 'auto' }}>
          <EditableRegionItem
            region={region}
            scale={scale}
            pageHeight={pageHeight}
            containerScale={containerScale}
            onSave={onSave}
            onCancel={onCancel}
          />
        </div>
      ))}
    </div>
  );
});

export default EditableOverlay;
