import React from 'react';
import { X, Eye } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-[280px] sm:max-w-[340px] bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl p-3 text-slate-100 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-white truncate max-w-[190px]">
            完成見本: {imageTitle}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="見本を閉じる"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-700/60 bg-black/40 aspect-[4/3] flex items-center justify-center">
        <img
          src={imageUrl}
          alt={imageTitle}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="text-[10px] text-slate-400 text-center mt-2">
        ※右上の「見本」ボタンでいつでも開閉できます
      </div>
    </div>
  );
};
