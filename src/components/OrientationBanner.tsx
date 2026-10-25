import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

interface OrientationBannerProps {
  onDismiss?: () => void;
}

export const OrientationBanner: React.FC<OrientationBannerProps> = ({ onDismiss }) => {
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 && window.innerHeight > window.innerWidth;
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('puzzle_orientation_hint_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isPortrait);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  if (!isPortraitMobile || isDismissed) {
    return null;
  }

  const handleClose = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('puzzle_orientation_hint_dismissed', 'true');
    } catch {
      // ignore
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-200 select-none">
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-950/90 border border-indigo-500/40 text-indigo-100 text-xs shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <Smartphone className="w-4 h-4 text-indigo-300 rotate-90 shrink-0 animate-pulse" />
          <span className="leading-snug truncate sm:whitespace-normal font-medium">
            横向きにすると盤面とピースが広がり、より遊びやすくなります
          </span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 text-indigo-300 hover:text-white rounded-lg hover:bg-indigo-800/60 transition-colors shrink-0"
          title="案内を閉じる"
          aria-label="案内を閉じる"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
