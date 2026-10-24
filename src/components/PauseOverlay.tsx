import React from 'react';
import { Play, Pause } from 'lucide-react';

interface PauseOverlayProps {
  isPaused: boolean;
  onResume: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ isPaused, onResume }) => {
  if (!isPaused) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="text-center p-8 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xs w-full">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Pause className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">一時停止中</h2>
        <p className="text-xs text-slate-400 mb-6">タイマーとピース操作が停止しています</p>
        <button
          onClick={onResume}
          className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          ゲームを再開する
        </button>
      </div>
    </div>
  );
};
