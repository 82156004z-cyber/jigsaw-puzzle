import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, CheckCircle2, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { PieceShape } from '../types/puzzle';

interface VictoryModalProps {
  isOpen: boolean;
  elapsedSeconds: number;
  totalPieces: number;
  cols: number;
  rows: number;
  shape: PieceShape;
  imageTitle: string;
  onReplay: () => void;
  onChangeImage: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  elapsedSeconds,
  totalPieces,
  cols,
  rows,
  shape,
  imageTitle,
  onReplay,
  onChangeImage,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti sequence
      try {
        const count = 200;
        const defaults = { origin: { y: 0.6 } };

        const fire = (particleRatio: number, opts: confetti.Options) => {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        };

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      } catch {
        // Safe fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins > 0 ? `${mins}分` : ''}${secs}秒`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 text-center ring-1 ring-white/10">
        {/* Glow behind trophy */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl" />

        {/* Trophy icon */}
        <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">パズル完成！おめでとうございます！</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">すべてのピースが正しく組み合わさりました</p>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-left">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">クリア時間</div>
              <div className="text-sm font-bold text-white font-mono">{timeFormatted}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">ピース数</div>
              <div className="text-sm font-bold text-white font-mono">
                {totalPieces}P ({cols}×{rows})
              </div>
            </div>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <span>形状: {shape === 'jigsaw' ? '凹凸ジグソー' : '四角形タイプ'}</span>
            <span className="truncate max-w-[180px] text-slate-400 font-medium">{imageTitle}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onReplay}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            もう一度遊ぶ
          </button>
          <button
            onClick={onChangeImage}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            新しい画像を選ぶ
          </button>
        </div>
      </div>
    </div>
  );
};
