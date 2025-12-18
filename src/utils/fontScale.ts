// CSS 변수에서 font-scale 값을 가져와 계산하는 헬퍼 함수
export const scaledSize = (basePx: number) => `calc(${basePx}px * var(--font-scale, 1))`;
