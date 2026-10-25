import React, { useState } from 'react';
import { X, Eye, Maximize2, Minimize2 } from 'lucide-react';

interface SamplePreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  imageTitle: string;
  onClose: () => void;
}

export const SamplePreviewModal: React.FC<SamplePreviewModalProps> = ({
  isOpen,
  imageUrl,
  imageTitle,
  onClose,
}) => {
  const [isCompact, setIsCompact] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="完成見本"
      className={`fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-slate-100 backdrop-blur-md transition-all duration-200 select-none animate-in slide-in-from-bottom-2 ${
        isCompact
          ? 'w-[min(200px,calc(100vw-24px))]'
          : 'w-[min(320px,calc(100vw-24px))] sm:w-[340px] md:w-[380px]'
      }`}
      style={{
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 80px)',
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Eye className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-white truncate">
            {imageTitle}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setIsCompact((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={isCompact ? '拡大する' : '縮小する'}
            aria-label={isCompact ? '拡大する' : '縮小する'}
          >
            {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="見本を閉じる"
            aria-label="見本を閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image container: ensures the ENTIRE picture is visible with aspect ratio strictly preserved */}
      <div
        className={`w-full rounded-xl overflow-hidden border border-slate-700/60 bg-black/60 flex items-center justify-center p-1 ${
          isCompact
            ? 'h-[110px]'
            : 'min-h-[140px] max-h-[32vh] sm:max-h-[220px]'
        }`}
      >
        <img
          src={imageUrl}
          alt={imageTitle}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-sm"
        />
      </div>

      {/* Footer hint */}
      {!isCompact && (
        <div className="text-[10px] text-slate-400 text-center mt-1.5">
          ※右上の「見本」ボタンで開閉できます
        </div>
      )}
    </div>
  );
};
