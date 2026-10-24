import React from 'react';
import { BackgroundThemeId } from '../types/puzzle';

interface BackgroundViewProps {
  theme: BackgroundThemeId;
}

export const THEME_LIST: { id: BackgroundThemeId; name: string; description: string; previewClass: string }[] = [
  {
    id: 'starry',
    name: '星空',
    description: '澄み渡る夜空と瞬く星々',
    previewClass: 'from-slate-950 via-indigo-950 to-blue-950',
  },
  {
    id: 'space',
    name: '宇宙',
    description: '神秘的な星雲と深遠なる銀河',
    previewClass: 'from-purple-950 via-slate-950 to-violet-900',
  },
  {
    id: 'ocean',
    name: '海',
    description: '深海の静けさと差し込む水光',
    previewClass: 'from-cyan-950 via-teal-950 to-slate-950',
  },
  {
    id: 'snow',
    name: '雪山',
    description: '白銀の山嶺と静かに舞う雪',
    previewClass: 'from-slate-900 via-sky-950 to-slate-950',
  },
  {
    id: 'cyber',
    name: '未来都市',
    description: 'サイバーネオンと摩天楼の地平線',
    previewClass: 'from-fuchsia-950 via-slate-950 to-cyan-950',
  },
  {
    id: 'minimal',
    name: 'シンプル無地',
    description: '落ち着きのあるシックなモノトーン',
    previewClass: 'from-slate-900 via-zinc-900 to-neutral-950',
  },
];

export const BackgroundView: React.FC<BackgroundViewProps> = ({ theme }) => {
  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 transition-colors duration-700">
      {theme === 'starry' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b1a] via-[#091531] to-[#040817]">
          {/* Subtle milky way streak */}
          <div className="absolute -top-1/4 left-1/3 w-[600px] h-[1000px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl transform -rotate-45" />
          {/* Static & twinkling stars */}
          <svg className="absolute inset-0 w-full h-full opacity-70" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Array of deterministic stars for stable rendering */}
            {[
              [12, 18, 1.5, 0.9], [25, 32, 2.0, 0.8], [40, 15, 1.2, 0.6], [58, 22, 2.2, 0.95],
              [72, 12, 1.6, 0.7], [85, 28, 1.4, 0.85], [15, 65, 1.8, 0.75], [30, 80, 1.2, 0.5],
              [52, 70, 2.4, 0.9], [68, 85, 1.5, 0.8], [88, 72, 1.8, 0.7], [94, 45, 1.3, 0.6],
              [8, 42, 1.4, 0.65], [48, 48, 1.7, 0.8], [62, 54, 1.1, 0.5], [78, 38, 2.0, 0.85],
              [22, 92, 1.5, 0.7], [38, 96, 1.3, 0.6], [82, 94, 1.6, 0.75]
            ].map(([x, y, r, op], idx) => (
              <circle
                key={idx}
                cx={`${x}%`}
                cy={`${y}%`}
                r={r}
                fill="#ffffff"
                opacity={op}
                className={idx % 3 === 0 ? 'animate-pulse' : ''}
                style={{ animationDuration: `${2 + (idx % 4)}s` }}
              />
            ))}
          </svg>
        </div>
      )}

      {theme === 'space' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#06020f] via-[#120524] to-[#04010a]">
          {/* Cosmic Nebulae */}
          <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-violet-600/15 via-fuchsia-600/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-600/15 via-cyan-600/10 to-transparent rounded-full blur-3xl" />
          {/* Deep celestial dust */}
          <svg className="absolute inset-0 w-full h-full opacity-65" xmlns="http://www.w3.org/2000/svg">
            {[
              [18, 24, 2.2, '#c084fc'], [32, 12, 1.4, '#e879f9'], [64, 28, 2.5, '#60a5fa'],
              [78, 16, 1.8, '#a78bfa'], [88, 35, 1.5, '#f472b6'], [12, 75, 2.0, '#38bdf8'],
              [42, 60, 1.6, '#e879f9'], [70, 78, 2.2, '#c084fc'], [86, 88, 1.4, '#a78bfa'],
              [24, 48, 1.5, '#93c5fd'], [54, 85, 2.0, '#f43f5e']
            ].map(([x, y, r, color], idx) => (
              <circle key={idx} cx={`${x}%`} cy={`${y}%`} r={r as number} fill={color as string} opacity={0.8} />
            ))}
          </svg>
        </div>
      )}

      {theme === 'ocean' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#021826] via-[#04283d] to-[#01101a]">
          {/* Sunbeams underwater */}
          <div className="absolute -top-20 left-1/4 w-[700px] h-[800px] bg-gradient-to-b from-teal-400/10 via-cyan-500/5 to-transparent rounded-full blur-3xl transform -rotate-12" />
          {/* Subtle floating bubble circles */}
          <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            {[
              [15, 80, 8], [22, 60, 5], [38, 85, 12], [55, 70, 7],
              [68, 90, 10], [80, 65, 6], [88, 82, 14], [48, 50, 4]
            ].map(([x, y, r], idx) => (
              <circle
                key={idx}
                cx={`${x}%`}
                cy={`${y}%`}
                r={r}
                fill="none"
                stroke="#5eead4"
                strokeWidth={1.2}
                opacity={0.6}
              />
            ))}
          </svg>
        </div>
      )}

      {theme === 'snow' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1320] via-[#132238] to-[#09101b]">
          {/* Distant frosted mountain silhouette at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-44 opacity-25">
            <svg viewBox="0 0 1200 240" preserveAspectRatio="none" className="w-full h-full fill-slate-300">
              <polygon points="0,240 0,160 180,90 320,170 520,60 720,180 920,80 1080,150 1200,100 1200,240" />
            </svg>
          </div>
          {/* Subtle snowflakes */}
          <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
            {[
              [10, 15, 2.5], [24, 38, 3.0], [45, 20, 2.0], [60, 45, 3.5], [78, 18, 2.8],
              [88, 42, 2.0], [16, 72, 3.2], [35, 65, 2.2], [52, 80, 3.0], [70, 75, 2.4],
              [84, 88, 3.6], [94, 68, 2.0]
            ].map(([x, y, r], idx) => (
              <circle key={idx} cx={`${x}%`} cy={`${y}%`} r={r} fill="#e2e8f0" opacity={0.7} />
            ))}
          </svg>
        </div>
      )}

      {theme === 'cyber' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#090314] via-[#16062a] to-[#080212]">
          {/* Distant Cyber Skyline silhouette */}
          <div className="absolute bottom-0 left-0 right-0 h-40 opacity-20 flex items-end justify-around">
            <div className="w-16 h-28 bg-fuchsia-500" />
            <div className="w-24 h-36 bg-cyan-500" />
            <div className="w-12 h-20 bg-indigo-500" />
            <div className="w-28 h-40 bg-fuchsia-600" />
            <div className="w-20 h-24 bg-cyan-600" />
            <div className="w-16 h-32 bg-purple-500" />
          </div>
          {/* Cyber horizon glow */}
          <div className="absolute bottom-28 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
          {/* Perspective grid floor */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(to right, #e879f9 1px, transparent 1px), linear-gradient(to bottom, #22d3ee 1px, transparent 1px)',
              backgroundSize: '40px 20px',
              transform: 'perspective(200px) rotateX(45deg)',
              transformOrigin: 'bottom',
            }}
          />
        </div>
      )}

      {theme === 'minimal' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#020617]">
          {/* Subtle luxury radial vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
        </div>
      )}

      {/* Uniform legibility scrim so puzzle board & pieces remain 100% visible and sharp */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px]" />
    </div>
  );
};
