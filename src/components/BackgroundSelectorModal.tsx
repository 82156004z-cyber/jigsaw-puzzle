import React from 'react';
import { X, Check } from 'lucide-react';
import { BackgroundThemeId } from '../types/puzzle';
import { THEME_LIST } from './BackgroundView';

interface BackgroundSelectorModalProps {
  isOpen: boolean;
  currentTheme: BackgroundThemeId;
  onSelectTheme: (theme: BackgroundThemeId) => void;
  onClose: () => void;
}

export const BackgroundSelectorModal: React.FC<BackgroundSelectorModalProps> = ({
  isOpen,
  currentTheme,
  onSelectTheme,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">背景テーマを選択</h3>
            <p className="text-xs text-slate-400 mt-0.5">ゲームの進行を維持したまま、いつでも変更できます</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-2 gap-3.5 my-5 max-h-[60vh] overflow-y-auto pr-1">
          {THEME_LIST.map((t) => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTheme(t.id);
                }}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-400 bg-slate-800/90 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-400/30'
                    : 'border-slate-700/70 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
              >
                {/* Visual Thumbnail */}
                <div
                  className={`w-full h-16 rounded-lg bg-gradient-to-br ${t.previewClass} border border-white/10 relative overflow-hidden mb-2.5 shadow-inner`}
                >
                  {/* Subtle decorative accents per theme in thumbnail */}
                  {t.id === 'starry' && (
                    <div className="absolute inset-0 flex items-center justify-around opacity-60">
                      <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                      <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full" />
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                  )}
                  {t.id === 'space' && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(192,132,252,0.4),transparent_60%)]" />
                  )}
                  {t.id === 'ocean' && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,234,212,0.3),transparent_70%)]" />
                  )}
                  {t.id === 'snow' && (
                    <div className="absolute bottom-0 inset-x-0 h-4 bg-slate-400/20" />
                  )}
                  {t.id === 'cyber' && (
                    <div className="absolute bottom-0 inset-x-0 h-0.5 bg-fuchsia-400 shadow-[0_0_8px_#e879f9]" />
                  )}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">{t.name}</span>
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{t.description}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm"
          >
            決定
          </button>
        </div>
      </div>
    </div>
  );
};
