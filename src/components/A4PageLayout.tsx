import { useEffect, useRef, useState } from 'react';

interface A4PageLayoutProps {
  children: React.ReactNode[];
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  showHeaderOnFirstPageOnly?: boolean;
  showFooterOnLastPageOnly?: boolean;
  tableHeader?: React.ReactNode; // 테이블 헤더 (매 페이지 상단에 표시)
}

export function A4PageLayout({ 
  children, 
  headerContent, 
  footerContent,
  showHeaderOnFirstPageOnly = false,
  showFooterOnLastPageOnly = false,
  tableHeader
}: A4PageLayoutProps) {
  const [pages, setPages] = useState<React.ReactNode[][]>([]);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!measureRef.current) return;

    // DOM이 완전히 렌더링될 때까지 기다림
    const timer = setTimeout(() => {
      if (!measureRef.current) return;

      // A4 높이 (297mm - 상하 여백 37mm = 260mm)
      const A4_HEIGHT_MM = 260;
      const MM_TO_PX = 3.7795275591; // 1mm = 3.78px at 96 DPI
      const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX;
      
      // 하단 여백 확보
      const BOTTOM_MARGIN_MM = 20;
      const BOTTOM_MARGIN_PX = BOTTOM_MARGIN_MM * MM_TO_PX;

      // 헤더/푸터 높이 측정
      let headerHeight = 0;
      let footerHeight = 0;

      const headerEl = measureRef.current.querySelector('[data-header]');
      const footerEl = measureRef.current.querySelector('[data-footer]');

      if (headerEl) {
        headerHeight = (headerEl as HTMLElement).offsetHeight;
      }
      if (footerEl) {
        footerHeight = (footerEl as HTMLElement).offsetHeight;
      }

      // 각 아이템의 높이 측정
      const items = measureRef.current.querySelectorAll('[data-item]');
      const itemHeights: number[] = [];
      
      items.forEach((item) => {
        itemHeights.push((item as HTMLElement).offsetHeight);
      });

      // 카드 사이 간격 (0.5rem = 8px) - CSS의 gap: 0.5rem과 동일
      const CARD_GAP = 8;

      // 페이지 분할 알고리즘
      const newPages: React.ReactNode[][] = [];
      let currentPage: React.ReactNode[] = [];
      let currentHeight = 0;
      
      // 각 페이지마다 헤더/푸터를 표시할지에 따라 사용 가능한 높이 계산
      const getAvailableHeight = (pageIndex: number) => {
        let available = A4_HEIGHT_PX;
        
        // 헤더 높이 차감
        if (showHeaderOnFirstPageOnly) {
          if (pageIndex === 0) available -= headerHeight;
        } else {
          available -= headerHeight;
        }
        
        // 푸터 높이 차감
        if (showFooterOnLastPageOnly) {
          // 일단 푸터 공간 확보
          available -= footerHeight;
        } else {
          available -= footerHeight;
        }
        
        // 하단 안전 여백 차감
        available -= BOTTOM_MARGIN_PX;
        
        return available;
      };

      children.forEach((child, index) => {
        const itemHeight = itemHeights[index] || 0;
        const availableHeight = getAvailableHeight(newPages.length);
        
        // 현재 페이지에 아이템이 있으면 gap도 추가
        const gapHeight = currentPage.length > 0 ? CARD_GAP : 0;
        const requiredHeight = currentHeight + itemHeight + gapHeight;

        // 첫 번째 아이템이거나, 현재 페이지에 추가 가능한 경우
        if (currentPage.length === 0) {
          // 새 페이지의 첫 아이템
          currentPage.push(child);
          currentHeight = itemHeight;
        } else if (requiredHeight <= availableHeight) {
          // 현재 페이지에 추가 가능
          currentPage.push(child);
          currentHeight = requiredHeight;
        } else {
          // 현재 페이지가 꽉 참 - 새 페이지 시작
          newPages.push([...currentPage]);
          currentPage = [child];
          currentHeight = itemHeight;
        }
      });

      // 마지막 페이지 추가
      if (currentPage.length > 0) {
        newPages.push(currentPage);
      }

      setPages(newPages);
    }, 100);

    return () => clearTimeout(timer);
  }, [children, headerContent, footerContent, showHeaderOnFirstPageOnly, showFooterOnLastPageOnly, tableHeader]);

  return (
    <>
      {/* 측정용 숨겨진 컨테이너 */}
      <div 
        ref={measureRef} 
        style={{ 
          position: 'absolute', 
          visibility: 'hidden', 
          width: '210mm',
          padding: '17mm 20mm 20mm 20mm',
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      >
        {headerContent && <div data-header>{headerContent}</div>}
        {children.map((child, index) => (
          <div key={index} data-item>
            {child}
          </div>
        ))}
        {footerContent && <div data-footer>{footerContent}</div>}
      </div>

      {/* 실제 페이지들 */}
      {pages.map((pageItems, pageIndex) => (
        <div 
          key={pageIndex} 
          className="a4-page" 
          data-page-number={pageIndex + 1}
        >
          {/* 헤더 - 첫 페이지만 또는 모든 페이지 */}
          {(showHeaderOnFirstPageOnly ? pageIndex === 0 : true) && headerContent && (
            <div className="page-header">{headerContent}</div>
          )}

          {/* 테이블 헤더 */}
          {tableHeader && (
            <div className="table-header">{tableHeader}</div>
          )}

          {/* 컨텐츠 */}
          <div className="page-content">
            {pageItems}
          </div>

          {/* 푸터 - 마지막 페이지만 또는 모든 페이지 */}
          {(showFooterOnLastPageOnly ? pageIndex === pages.length - 1 : true) && footerContent && (
            <div className="page-footer">{footerContent}</div>
          )}

          {/* 페이지 번호 - 우하단 */}
          <div className="page-number-bottom-right">
            {pageIndex + 1} / {pages.length}
          </div>
        </div>
      ))}
    </>
  );
}