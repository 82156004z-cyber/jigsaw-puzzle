import React, { useState, useRef, useCallback } from 'react';
import { Hand, ArrowLeftRight, Check, Sparkles, RefreshCw } from 'lucide-react';
import { PlayMode, PuzzlePiece, PuzzleSettings } from '../types/puzzle';
import { playSnapSound, playSelectSound, playSwapSound } from '../utils/audio';

interface PuzzleBoardProps {
  settings: PuzzleSettings;
  pieces: PuzzlePiece[];
  setPieces: React.Dispatch<React.SetStateAction<PuzzlePiece[]>>;
  isPaused: boolean;
  onVictory: () => void;
}

interface ActiveDragState {
  piece: PuzzlePiece;
  currentX: number;
  currentY: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  settings,
  pieces,
  setPieces,
  isPaused,
  onVictory,
}) => {
  const [mode, setMode] = useState<PlayMode>('drag');
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [justSnappedId, setJustSnappedId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  // Unified master board dimensions guaranteed to match sliced pieces 1:1
  const boardWidth = settings.boardWidth || 480;
  const boardHeight = settings.boardHeight || 360;

  // Nominal dimensions of a single slot on the board
  const pieceNominalWidth = boardWidth / settings.cols;
  const pieceNominalHeight = boardHeight / settings.rows;

  // Relaxed snap tolerance:
  // 30% of cell width and 30% of cell height (minimum 26px)
  // Generous enough for easy placement without pixel-hunting, while never mis-snapping adjacent cells
  const toleranceX = Math.max(26, pieceNominalWidth * 0.30);
  const toleranceY = Math.max(26, pieceNominalHeight * 0.30);

  // Dragging state
  const [dragState, setDragState] = useState<ActiveDragState | null>(null);
  const dragInfoRef = useRef<{
    pieceId: number;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);

  // Check victory condition
  const checkVictoryCondition = useCallback(
    (currentPieces: PuzzlePiece[]) => {
      const allLocked = currentPieces.length > 0 && currentPieces.every((p) => p.isLocked);
      if (allLocked) {
        setTimeout(() => {
          onVictory();
        }, 300);
      }
    },
    [onVictory]
  );

  // Pointer down on a piece (Mode A: Drag, Mode B: Swap)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, piece: PuzzlePiece) => {
    if (isPaused || piece.isLocked) return;

    if (mode === 'swap') {
      handleSwapPieceClick(piece);
      return;
    }

    // Drag mode
    e.preventDefault();
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const rect = target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    dragInfoRef.current = {
      pieceId: piece.id,
      pointerId: e.pointerId,
      offsetX,
      offsetY,
      width: rect.width,
      height: rect.height,
    };

    // Bring this piece forward in z-index order
    setPieces((prev) =>
      prev.map((p) => (p.id === piece.id ? { ...p, zIndex: 30 } : p))
    );

    setDragState({
      piece,
      currentX: e.clientX - offsetX,
      currentY: e.clientY - offsetY,
      width: rect.width,
      height: rect.height,
      offsetX,
      offsetY,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current || isPaused) return;
    if (e.pointerId !== dragInfoRef.current.pointerId) return;

    const { offsetX, offsetY, width, height } = dragInfoRef.current;
    const piece = pieces.find((p) => p.id === dragInfoRef.current?.pieceId);
    if (!piece) return;

    setDragState({
      piece,
      currentX: e.clientX - offsetX,
      currentY: e.clientY - offsetY,
      width,
      height,
      offsetX,
      offsetY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current) return;
    if (e.pointerId !== dragInfoRef.current.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const { pieceId, offsetX, offsetY } = dragInfoRef.current;
    dragInfoRef.current = null;
    setDragState(null);

    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece || !boardRef.current || !workspaceRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const workspaceRect = workspaceRef.current.getBoundingClientRect();
    const trayRect = trayRef.current?.getBoundingClientRect();

    // The nominal body origin of the piece (excluding tabs) in viewport coordinates
    const droppedBodyLeft = (e.clientX - offsetX) + piece.tabMargin;
    const droppedBodyTop = (e.clientY - offsetY) + piece.tabMargin;

    // Center of the dropped piece body in viewport coordinates
    const droppedCenterX = droppedBodyLeft + piece.width / 2;
    const droppedCenterY = droppedBodyTop + piece.height / 2;

    // Center of the target slot on the board in viewport coordinates
    const targetCenterX = boardRect.left + piece.correctX + piece.width / 2;
    const targetCenterY = boardRect.top + piece.correctY + piece.height / 2;

    // 1. ドロップ先が「ピース置き場（トレイ）」の場合 -> トレイへ戻す
    const isInsideTray =
      trayRect &&
      droppedCenterX >= trayRect.left &&
      droppedCenterX <= trayRect.right &&
      droppedCenterY >= trayRect.top &&
      droppedCenterY <= trayRect.bottom;

    if (isInsideTray) {
      playSelectSound();
      setPieces((prev) =>
        prev.map((p) =>
          p.id === piece.id
            ? {
                ...p,
                inTray: true,
                isLocked: false,
                isStaging: false,
              }
            : p
        )
      );
      return;
    }

    // 2. ドロップ先が「盤面内」の場合
    const isInsideBoard =
      droppedCenterX >= boardRect.left &&
      droppedCenterX <= boardRect.right &&
      droppedCenterY >= boardRect.top &&
      droppedCenterY <= boardRect.bottom;

    if (isInsideBoard) {
      const diffX = Math.abs(droppedCenterX - targetCenterX);
      const diffY = Math.abs(droppedCenterY - targetCenterY);

      // 吸着判定：セルの30%以内の近さ（許容範囲内）であれば正解位置へ吸着固定
      const isCloseToCorrect = diffX <= toleranceX && diffY <= toleranceY;

      if (isCloseToCorrect) {
        playSnapSound();
        setJustSnappedId(piece.id);
        setTimeout(() => setJustSnappedId(null), 600);

        setPieces((prev) => {
          const updated = prev.map((p) =>
            p.id === piece.id
              ? {
                  ...p,
                  currentX: p.correctX,
                  currentY: p.correctY,
                  isLocked: true,
                  inTray: false,
                  isStaging: false,
                  zIndex: 5,
                }
              : p
          );
          checkVictoryCondition(updated);
          return updated;
        });
        return;
      } else {
        // 許容範囲外：盤面内に仮置き（吸着せず、消失もしない）
        const droppedBoardX = Math.max(
          0,
          Math.min(boardWidth - piece.width, droppedBodyLeft - boardRect.left)
        );
        const droppedBoardY = Math.max(
          0,
          Math.min(boardHeight - piece.height, droppedBodyTop - boardRect.top)
        );

        setPieces((prev) =>
          prev.map((p) =>
            p.id === piece.id
              ? {
                  ...p,
                  currentX: droppedBoardX,
                  currentY: droppedBoardY,
                  isLocked: false,
                  inTray: false,
                  isStaging: false,
                  zIndex: 10,
                }
              : p
          )
        );
        return;
      }
    }

    // 3. ドロップ先が「盤面の周囲の空きスペース」の場合
    // 盤面外に直接仮置き。作業台（workspace）の枠内に収まるよう安全にクランプ
    const rawBoardX = droppedBodyLeft - boardRect.left;
    const rawBoardY = droppedBodyTop - boardRect.top;

    const safeMargin = piece.tabMargin + 4;
    const minX = (workspaceRect.left + safeMargin) - boardRect.left;
    const maxX = (workspaceRect.right - safeMargin - piece.width) - boardRect.left;
    const minY = (workspaceRect.top + safeMargin + 32) - boardRect.top; // 上部見出しバーを避ける
    const maxY = (workspaceRect.bottom - safeMargin - piece.height) - boardRect.top;

    const clampedX = Math.max(minX, Math.min(maxX, rawBoardX));
    const clampedY = Math.max(minY, Math.min(maxY, rawBoardY));

    setPieces((prev) =>
      prev.map((p) =>
        p.id === piece.id
          ? {
              ...p,
              currentX: clampedX,
              currentY: clampedY,
              isLocked: false,
              inTray: false,
              isStaging: true,
              zIndex: 10,
            }
          : p
      )
    );
  };

  // Mode B: Tap to swap 2 pieces
  const handleSwapPieceClick = (piece: PuzzlePiece) => {
    if (isPaused || piece.isLocked) return;

    if (selectedPieceId === null) {
      // 1st piece selected
      playSelectSound();
      setSelectedPieceId(piece.id);
    } else if (selectedPieceId === piece.id) {
      // Same piece tapped again -> Deselect
      playSelectSound();
      setSelectedPieceId(null);
    } else {
      // 2nd piece tapped -> Swap!
      playSwapSound();
      const firstPiece = pieces.find((p) => p.id === selectedPieceId);
      if (!firstPiece) {
        setSelectedPieceId(null);
        return;
      }

      setPieces((prev) => {
        const next = prev.map((p) => {
          if (p.id === firstPiece.id) {
            const nextX = piece.currentX;
            const nextY = piece.currentY;
            const nextInTray = piece.inTray;
            const nextIsStaging = piece.isStaging;
            const nextSlot = piece.traySlotIndex;
            // Check if swapped position matches correct target on board
            const isNowCorrect =
              !nextInTray &&
              !nextIsStaging &&
              Math.hypot(nextX - p.correctX, nextY - p.correctY) < 15;
            return {
              ...p,
              currentX: nextX,
              currentY: nextY,
              inTray: nextInTray,
              isStaging: nextIsStaging,
              traySlotIndex: nextSlot,
              isLocked: isNowCorrect,
            };
          }
          if (p.id === piece.id) {
            const nextX = firstPiece.currentX;
            const nextY = firstPiece.currentY;
            const nextInTray = firstPiece.inTray;
            const nextIsStaging = firstPiece.isStaging;
            const nextSlot = firstPiece.traySlotIndex;
            const isNowCorrect =
              !nextInTray &&
              !nextIsStaging &&
              Math.hypot(nextX - p.correctX, nextY - p.correctY) < 15;
            return {
              ...p,
              currentX: nextX,
              currentY: nextY,
              inTray: nextInTray,
              isStaging: nextIsStaging,
              traySlotIndex: nextSlot,
              isLocked: isNowCorrect,
            };
          }
          return p;
        });

        checkVictoryCondition(next);
        return next;
      });

      setSelectedPieceId(null);
    }
  };

  // Pieces in the Tray dock
  const trayPieces = pieces.filter((p) => p.inTray && !p.isLocked);
  // All pieces placed on the workspace (locked, temporary on board, or temporary around board)
  const placedPieces = pieces.filter((p) => !p.inTray);

  return (
    <div
      ref={containerRef}
      className="relative z-10 w-full flex flex-col items-center select-none py-2 px-2 sm:px-4"
    >
      {/* Floating Drag Layer: Renders active dragging piece under cursor */}
      {dragState && (
        <div
          className="fixed pointer-events-none select-none z-[9999] drop-shadow-2xl"
          style={{
            left: `${dragState.currentX}px`,
            top: `${dragState.currentY}px`,
            width: `${dragState.width}px`,
            height: `${dragState.height}px`,
            transform: 'scale(1.05)',
            transition: 'transform 0.08s ease-out',
          }}
        >
          <img
            src={dragState.piece.dataUrl}
            alt="ドラッグ中のピース"
            draggable={false}
            className="w-full h-full object-contain filter drop-shadow-xl"
          />
        </div>
      )}

      {/* Operation Mode Switcher & Instructions */}
      <div className="w-full max-w-xl flex flex-col items-center mb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-700/80 rounded-xl shadow-md">
          <button
            onClick={() => {
              setMode('drag');
              setSelectedPieceId(null);
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'drag'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            ドラッグ＆ドロップ
          </button>
          <button
            onClick={() => {
              setMode('swap');
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'swap'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            2ピースのタップ交換
          </button>
        </div>

        {/* Mode Guide Hint & Cancel button */}
        <div className="flex items-center justify-center gap-2 mt-1.5 text-[11px] text-slate-300 text-center">
          <span>
            {mode === 'drag'
              ? '盤面の正解位置近くで吸着・固定／盤面の周囲や盤面内の自由な位置に仮置きも可能です'
              : 'ピースをタップして選択し、入れ替えたいもう1つのピースをタップしてください'}
          </span>
          {mode === 'swap' && selectedPieceId !== null && (
            <button
              onClick={() => setSelectedPieceId(null)}
              className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-semibold"
            >
              選択解除
            </button>
          )}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="w-full flex flex-col items-center gap-4">
        {/* Workspace: Table surface containing Board + surrounding direct staging space */}
        <div
          ref={workspaceRef}
          className="relative w-full max-w-4xl p-3 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl backdrop-blur-sm flex flex-col items-center overflow-visible"
        >
          {/* Workspace Header */}
          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
            <span className="font-semibold text-slate-200">
              パズル作業台（中央の盤面で吸着・周囲の空きスペースに自由に仮置き可能）
            </span>
            <span>
              {settings.cols}列 × {settings.rows}行（{boardWidth} × {boardHeight} px）
            </span>
          </div>

          {/* Table Mat Area around Board */}
          <div
            className="relative w-full flex items-center justify-center my-3 sm:my-5"
            style={{
              minHeight: `${boardHeight + 60}px`,
            }}
          >
            {/* Board Mat: Exactly boardWidth x boardHeight (Zero gap on right & bottom!) */}
            <div
              ref={boardRef}
              className="relative overflow-visible rounded-xl bg-slate-950/95 border-2 border-indigo-500/50 shadow-inner"
              style={{
                width: `${boardWidth}px`,
                height: `${boardHeight}px`,
              }}
            >
              {/* Guide Grid: Exactly matches piece columns and rows */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                  backgroundSize: `${pieceNominalWidth}px ${pieceNominalHeight}px`,
                }}
              />

              {/* Placed Pieces (Locked Pieces, Temporary on-board pieces, and Staged around board pieces) */}
              {placedPieces.map((piece) => {
                const isSelected = selectedPieceId === piece.id;
                const isDragging = dragState?.piece.id === piece.id;
                const isSnapped = justSnappedId === piece.id;
                const isOutsideBoard =
                  piece.currentX < 0 ||
                  piece.currentX > boardWidth - piece.width ||
                  piece.currentY < 0 ||
                  piece.currentY > boardHeight - piece.height;

                return (
                  <div
                    key={piece.id}
                    onPointerDown={(e) => handlePointerDown(e, piece)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className={`absolute touch-none select-none transition-transform ${
                      piece.isLocked
                        ? 'cursor-default pointer-events-none'
                        : 'cursor-grab active:cursor-grabbing hover:brightness-105'
                    } ${isDragging ? 'opacity-30' : ''}`}
                    style={{
                      left: `${piece.currentX - piece.tabMargin}px`,
                      top: `${piece.currentY - piece.tabMargin}px`,
                      width: `${piece.width + piece.tabMargin * 2}px`,
                      height: `${piece.height + piece.tabMargin * 2}px`,
                      zIndex: piece.isLocked ? 5 : isSelected ? 50 : piece.zIndex,
                    }}
                  >
                    <img
                      src={piece.dataUrl}
                      alt={`ピース ${piece.id}`}
                      draggable={false}
                      className={`w-full h-full object-contain pointer-events-none drop-shadow-md ${
                        isSelected
                          ? 'ring-4 ring-yellow-400 rounded-lg animate-pulse'
                          : isSnapped
                          ? 'ring-4 ring-emerald-400 rounded-lg transition-all duration-500'
                          : !piece.isLocked && isOutsideBoard
                          ? 'ring-2 ring-amber-400/80 hover:ring-indigo-300 rounded-sm'
                          : !piece.isLocked
                          ? 'ring-2 ring-indigo-400/70 rounded-sm'
                          : ''
                      }`}
                    />
                    {piece.isLocked ? (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="w-5 h-5 bg-emerald-600/80 rounded-full flex items-center justify-center text-white shadow">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`absolute top-1 left-1 text-[9px] px-1 py-0.2 rounded text-white font-medium opacity-85 pointer-events-none ${
                          isOutsideBoard ? 'bg-amber-600/90' : 'bg-indigo-600/80'
                        }`}
                      >
                        仮置き
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Piece Staging Tray (トレイ) */}
        <div
          ref={trayRef}
          className="w-full max-w-4xl p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-300 pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">ピース置き場（トレイ）</span>
              <span className="text-[11px] text-slate-400">
                未配置: {trayPieces.length}個 / 全{pieces.length}個
              </span>
            </div>
            {trayPieces.length > 0 && (
              <button
                onClick={() => {
                  playSelectSound();
                  setPieces((prev) => {
                    const trayItems = prev.filter((p) => p.inTray && !p.isLocked);
                    const slotIndices = trayItems.map((p) => p.traySlotIndex);
                    for (let i = slotIndices.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [slotIndices[i], slotIndices[j]] = [slotIndices[j], slotIndices[i]];
                    }
                    return prev.map((p) => {
                      const idx = trayItems.findIndex((item) => item.id === p.id);
                      if (idx !== -1) {
                        return { ...p, traySlotIndex: slotIndices[idx] };
                      }
                      return p;
                    });
                  });
                }}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="トレイ内のピースをシャッフル"
              >
                <RefreshCw className="w-3 h-3" />
                シャッフル
              </button>
            )}
          </div>

          {trayPieces.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {pieces.every((p) => p.isLocked)
                ? 'すべてのピースが盤面に配置され、パズルが完成しました！'
                : 'すべてのピースが作業台・盤面に移動しました！'}
            </div>
          ) : (
            <div className="max-h-56 sm:max-h-64 overflow-y-auto overflow-x-hidden p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div
                className="grid gap-3 items-center justify-items-center"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(${Math.min(
                    pieceNominalWidth + (pieces[0]?.tabMargin || 0) * 2,
                    140
                  )}px, 1fr))`,
                }}
              >
                {trayPieces
                  .sort((a, b) => a.traySlotIndex - b.traySlotIndex)
                  .map((piece) => {
                    const isSelected = selectedPieceId === piece.id;
                    const isDragging = dragState?.piece.id === piece.id;
                    const pieceElWidth = piece.width + piece.tabMargin * 2;
                    const pieceElHeight = piece.height + piece.tabMargin * 2;

                    return (
                      <div
                        key={piece.id}
                        onPointerDown={(e) => handlePointerDown(e, piece)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className={`relative touch-none select-none transition-all p-1 rounded-xl cursor-grab active:cursor-grabbing hover:bg-slate-800/50 flex items-center justify-center ${
                          isSelected
                            ? 'ring-4 ring-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20'
                            : 'hover:scale-105'
                        } ${isDragging ? 'opacity-30' : ''}`}
                        style={{
                          width: `${pieceElWidth}px`,
                          height: `${pieceElHeight}px`,
                          maxWidth: '100%',
                        }}
                      >
                        <img
                          src={piece.dataUrl}
                          alt={`トレイピース ${piece.id}`}
                          draggable={false}
                          className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
