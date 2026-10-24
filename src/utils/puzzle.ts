import { PieceEdges, PieceShape, PuzzlePiece } from '../types/puzzle';

/**
 * Generates interlocking edges for a grid of pieces
 * Every shared edge between two adjacent pieces is paired:
 * If Piece A's right edge is +1, Piece B's left edge is -1.
 * Outer boundaries are 0.
 */
export function generateInterlockingEdges(cols: number, rows: number, shape: PieceShape): PieceEdges[][] {
  const result: PieceEdges[][] = [];

  if (shape === 'classic') {
    for (let r = 0; r < rows; r++) {
      result[r] = [];
      for (let c = 0; c < cols; c++) {
        result[r][c] = { top: 0, right: 0, bottom: 0, left: 0 };
      }
    }
    return result;
  }

  // Horizontal boundaries: (rows + 1) x cols
  // hEdges[r][c] is the edge between row r-1 and row r for column c
  // +1 means tab points DOWN (into row r), -1 means points UP (into row r-1)
  const hEdges: number[][] = [];
  for (let r = 0; r <= rows; r++) {
    hEdges[r] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows) {
        hEdges[r][c] = 0;
      } else {
        hEdges[r][c] = Math.random() < 0.5 ? 1 : -1;
      }
    }
  }

  // Vertical boundaries: rows x (cols + 1)
  // vEdges[r][c] is the edge between col c-1 and col c for row r
  // +1 means tab points RIGHT (into col c), -1 means points LEFT (into col c-1)
  const vEdges: number[][] = [];
  for (let r = 0; r < rows; r++) {
    vEdges[r] = [];
    for (let c = 0; c <= cols; c++) {
      if (c === 0 || c === cols) {
        vEdges[r][c] = 0;
      } else {
        vEdges[r][c] = Math.random() < 0.5 ? 1 : -1;
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    result[r] = [];
    for (let c = 0; c < cols; c++) {
      // Top edge: points UP if tab is outward (+1 relative to piece).
      // hEdges[r][c] === 1 means points DOWN into r. So outward for r is -hEdges[r][c].
      const top = (-hEdges[r][c]) as -1 | 0 | 1;

      // Right edge: points RIGHT if tab is outward.
      // vEdges[r][c+1] === 1 means points RIGHT into c+1. So outward for c is +vEdges[r][c+1].
      const right = (vEdges[r][c + 1]) as -1 | 0 | 1;

      // Bottom edge: points DOWN if tab is outward.
      // hEdges[r+1][c] === 1 means points DOWN into r+1. So outward for r is +hEdges[r+1][c].
      const bottom = (hEdges[r + 1][c]) as -1 | 0 | 1;

      // Left edge: points LEFT if tab is outward.
      // vEdges[r][c] === 1 means points RIGHT into c. So outward for c is -vEdges[r][c].
      const left = (-vEdges[r][c]) as -1 | 0 | 1;

      result[r][c] = { top, right, bottom, left };
    }
  }

  return result;
}

/**
 * Draws a single edge between (x0, y0) and (x1, y1) with an optional tab.
 * tab: +1 = outward, -1 = inward, 0 = straight line.
 * Outward is to the right when walking from p0 to p1.
 */
function drawJigsawEdge(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  tab: -1 | 0 | 1
) {
  if (tab === 0) {
    ctx.lineTo(x1, y1);
    return;
  }

  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  // Outward normal vector
  const nx = -uy;
  const ny = ux;

  // Helper to map normalized coordinates (u along edge, v along normal) to canvas coordinates
  const pt = (u: number, v: number): [number, number] => {
    return [
      x0 + u * len * ux + v * len * tab * nx,
      y0 + u * len * uy + v * len * tab * ny,
    ];
  };

  // Straight line to start of tab neck
  const [b0x, b0y] = pt(0.35, 0);
  ctx.lineTo(b0x, b0y);

  // Tab shoulder & neck into bulb
  const [cp1x, cp1y] = pt(0.36, 0.05);
  const [cp2x, cp2y] = pt(0.32, 0.16);
  const [p1x, p1y] = pt(0.40, 0.20);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1x, p1y);

  // Bulb crown (apex)
  const [cp3x, cp3y] = pt(0.45, 0.24);
  const [cp4x, cp4y] = pt(0.55, 0.24);
  const [p2x, p2y] = pt(0.60, 0.20);
  ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, p2x, p2y);

  // Bulb back to neck and base
  const [cp5x, cp5y] = pt(0.68, 0.16);
  const [cp6x, cp6y] = pt(0.64, 0.05);
  const [b1x, b1y] = pt(0.65, 0);
  ctx.bezierCurveTo(cp5x, cp5y, cp6x, cp6y, b1x, b1y);

  // Straight line to end of edge
  ctx.lineTo(x1, y1);
}

/**
 * Traces the complete path of a piece on the canvas
 */
export function tracePiecePath(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  w: number,
  h: number,
  edges: PieceEdges,
  shape: PieceShape
) {
  ctx.beginPath();
  ctx.moveTo(ox, oy);

  if (shape === 'classic') {
    ctx.lineTo(ox + w, oy);
    ctx.lineTo(ox + w, oy + h);
    ctx.lineTo(ox, oy + h);
    ctx.closePath();
    return;
  }

  // Top edge: (ox, oy) -> (ox + w, oy)
  drawJigsawEdge(ctx, ox, oy, ox + w, oy, edges.top);
  // Right edge: (ox + w, oy) -> (ox + w, oy + h)
  drawJigsawEdge(ctx, ox + w, oy, ox + w, oy + h, edges.right);
  // Bottom edge: (ox + w, oy + h) -> (ox, oy + h)
  drawJigsawEdge(ctx, ox + w, oy + h, ox, oy + h, edges.bottom);
  // Left edge: (ox, oy + h) -> (ox, oy)
  drawJigsawEdge(ctx, ox, oy + h, ox, oy, edges.left);

  ctx.closePath();
}

/**
 * Computes exact board and piece dimensions preserving natural aspect ratio
 * and quantizing piece width/height to integer pixels so that cols * pieceWidth === boardWidth
 * and rows * pieceHeight === boardHeight (guaranteeing 0 gap on right and bottom).
 */
export function computeBoardDimensions(
  naturalWidth: number,
  naturalHeight: number,
  cols: number,
  rows: number,
  isMobile: boolean
): { boardWidth: number; boardHeight: number; pieceWidth: number; pieceHeight: number } {
  const aspect = naturalWidth && naturalHeight ? naturalWidth / naturalHeight : 4 / 3;

  // Maximum allowable board dimensions on desktop vs mobile
  const maxW = isMobile
    ? Math.min(typeof window !== 'undefined' ? window.innerWidth - 32 : 360, 400)
    : 520;
  const maxH = isMobile
    ? Math.min(typeof window !== 'undefined' ? window.innerHeight * 0.42 : 280, 300)
    : 400;

  let targetW = maxW;
  let targetH = Math.round(targetW / aspect);

  if (targetH > maxH) {
    targetH = maxH;
    targetW = Math.round(targetH * aspect);
  }

  // Integer piece quantization:
  // Each piece has an exact integer pixel width and height.
  // Board width and height are exact multiples of piece dimensions.
  const pieceWidth = Math.max(10, Math.round(targetW / cols));
  const boardWidth = pieceWidth * cols;

  const pieceHeight = Math.max(10, Math.round(targetH / rows));
  const boardHeight = pieceHeight * rows;

  return { boardWidth, boardHeight, pieceWidth, pieceHeight };
}

/**
 * Slices an image into puzzle pieces and generates high-res sprites with tabs & shadows
 */
export function sliceImageIntoPieces(
  image: HTMLImageElement,
  cols: number,
  rows: number,
  shape: PieceShape,
  boardWidth: number,
  boardHeight: number
): PuzzlePiece[] {
  const pieceWidth = Math.round(boardWidth / cols);
  const pieceHeight = Math.round(boardHeight / rows);
  const tabMargin = shape === 'jigsaw' ? Math.ceil(Math.max(pieceWidth, pieceHeight) * 0.28) : 0;

  const edgesGrid = generateInterlockingEdges(cols, rows, shape);
  const pieces: PuzzlePiece[] = [];

  let idCounter = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const edges = edgesGrid[r][c];

      // Create offscreen canvas for this piece
      const canvas = document.createElement('canvas');
      const canvasWidth = Math.ceil(pieceWidth + tabMargin * 2);
      const canvasHeight = Math.ceil(pieceHeight + tabMargin * 2);
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Trace the piece path
      tracePiecePath(ctx, tabMargin, tabMargin, pieceWidth, pieceHeight, edges, shape);

      // Clip to piece shape
      ctx.save();
      ctx.clip();

      // Draw image shifted so this piece gets the exact portion
      const imgX = tabMargin - c * pieceWidth;
      const imgY = tabMargin - r * pieceHeight;
      try {
        ctx.drawImage(image, imgX, imgY, boardWidth, boardHeight);
      } catch (err) {
        console.warn('Failed to draw image slice, using fallback fill', err);
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Add a subtle glossy bevel highlight on top/left
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Trace and draw outer crisp hairline border for tactile puzzle feel
      tracePiecePath(ctx, tabMargin, tabMargin, pieceWidth, pieceHeight, edges, shape);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const correctX = c * pieceWidth;
      const correctY = r * pieceHeight;

      let pieceDataUrl = '';
      try {
        pieceDataUrl = canvas.toDataURL('image/png');
      } catch (err) {
        console.error('Failed to export canvas to DataURL:', err);
        // Fallback transparent/colored 1px gif or empty
        pieceDataUrl = '';
      }

      pieces.push({
        id: idCounter++,
        row: r,
        col: c,
        width: pieceWidth,
        height: pieceHeight,
        tabMargin,
        edges,
        dataUrl: pieceDataUrl,
        correctX,
        correctY,
        currentX: correctX,
        currentY: correctY,
        isLocked: false,
        inTray: true,
        traySlotIndex: idCounter - 1,
        zIndex: 1,
      });
    }
  }

  return pieces;
}

/**
 * Shuffles pieces for the tray/staging area
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
