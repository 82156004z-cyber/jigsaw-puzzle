import React from 'react';
import { Volume2, VolumeX, Palette, Eye, RotateCcw, Pause, Play, Image as ImageIcon } from 'lucide-react';
import { BackgroundThemeId } from '../types/puzzle';

interface HeaderProps {
  elapsedSeconds: number;
  completionRate: number;
  totalPieces: number;
  lockedPiecesCount: number;
  cols: number;
  rows: number;
  isPaused: boolean;
  isMuted: boolean;
  showSamplePreview: boolean;
  currentTheme: BackgroundThemeId;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onToggleSamplePreview: () => void;
  onOpenThemeModal: () => void;
  onRequestRestart: () => void;
  onRequestChangeImage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  elapsedSeconds,
  completionRate,
  totalPieces,
  lockedPiecesCount,
  cols,
  rows,
  isPaused,
  isMuted,
  showSamplePreview,
  onTogglePause,
  onToggleMute,
  onToggleSamplePreview,
  onOpenThemeModal,
  onRequestRestart,
  onRequestChangeImage,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="relative z-30 w-full bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80 px-2 sm:px-6 py-2 sm:py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-6">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
              <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428m0 0a5 5 0 1 1 7.5 -6.572a5 5 0 1 1 7.5 6.572" />
            </svg>
          </div>
          <span className="font-bold text-xs sm:text-base tracking-tight text-white whitespace-nowrap hidden min-[360px]:inline">
            画像ジグソーパズル
          </span>
        </div>

        {/* Zone 2: Informational Live Game Stats (HUD) */}
        <div className="flex items-center gap-1.5 sm:gap-4 text-xs sm:text-sm font-medium">
          {/* Timer */}
          <div className="flex items-center gap-1 px-1.5 sm:px-3 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-200">
            <span className="text-slate-400 text-[10px] sm:text-xs">時間</span>
            <span className="font-mono tabular-nums font-semibold text-white text-xs sm:text-sm">
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          {/* Progress / Completion Rate */}
          <div className="flex items-center gap-1 px-1.5 sm:px-3 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-200">
            <span className="text-slate-400 text-[10px] sm:text-xs">完成度</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-400 text-xs sm:text-sm">
              {completionRate}%
            </span>
            <span className="text-[11px] text-slate-400 hidden md:inline font-mono tabular-nums">
              ({lockedPiecesCount}/{totalPieces})
            </span>
          </div>

          {/* Grid Spec */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/50 text-slate-400 text-xs">
            <span>{cols}×{rows}</span>
            <span>({totalPieces}ピース)</span>
          </div>
        </div>

        {/* Zone 3: Functional Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Sample Preview Toggle */}
          <button
            onClick={onToggleSamplePreview}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-medium ${
              showSamplePreview
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="完成見本の表示/非表示"
            aria-label="完成見本"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xl:inline">見本</span>
          </button>

          {/* Theme Selector */}
          <button
            onClick={onOpenThemeModal}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-medium"
            title="背景テーマを変更"
            aria-label="背景テーマ"
          >
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xl:inline">背景</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title={isMuted ? '効果音をONにする' : '効果音をOFFにする'}
            aria-label="効果音切り替え"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>

          {/* Pause / Resume */}
          <button
            onClick={onTogglePause}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors ${
              isPaused
                ? 'bg-amber-600/90 border-amber-500 text-white'
                : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={isPaused ? 'ゲームを再開' : '一時停止'}
            aria-label="一時停止"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Restart */}
          <button
            onClick={onRequestRestart}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="最初からやり直す"
            aria-label="やり直し"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Change Image / Settings */}
          <button
            onClick={onRequestChangeImage}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1 shadow-sm"
            title="別の画像や設定に変更"
          >
            <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">画像変更</span>
          </button>
        </div>
      </div>
    </header>
  );
};
