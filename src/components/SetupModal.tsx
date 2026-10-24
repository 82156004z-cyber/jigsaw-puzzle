import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, X, Check, Image as ImageIcon, Sliders } from 'lucide-react';
import { PieceShape, PuzzleSettings } from '../types/puzzle';

export const PRESET_IMAGES = [
  {
    title: '富士山と桜',
    url: new URL('../assets/images/puzzle_sample_landscape_1792830812150.jpg', import.meta.url).href,
  },
  {
    title: '花畑の三毛猫',
    url: new URL('../assets/images/puzzle_sample_cat_1792830812856.jpg', import.meta.url).href,
  },
  {
    title: '夜の街並みと提灯',
    url: new URL('../assets/images/puzzle_sample_city_1792830814028.jpg', import.meta.url).href,
  },
  {
    title: '滝と幻想の古城',
    url: new URL('../assets/images/puzzle_sample_castle_1792830812962.jpg', import.meta.url).href,
  },
];

interface SetupModalProps {
  isOpen: boolean;
  initialSettings?: PuzzleSettings | null;
  externalError?: string | null;
  onStartGame: (settings: PuzzleSettings) => void;
  onClose?: () => void;
  canCancel?: boolean;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  initialSettings,
  externalError,
  onStartGame,
  onClose,
  canCancel = false,
}) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>(
    initialSettings?.imageUrl || PRESET_IMAGES[0].url
  );
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>(
    initialSettings?.imageTitle || PRESET_IMAGES[0].title
  );
  const [naturalWidth, setNaturalWidth] = useState<number>(initialSettings?.imageNaturalWidth || 800);
  const [naturalHeight, setNaturalHeight] = useState<number>(initialSettings?.imageNaturalHeight || 600);
  const [shape, setShape] = useState<PieceShape>(initialSettings?.shape || 'jigsaw');

  const [cols, setCols] = useState<number>(initialSettings?.cols || 4);
  const [rows, setRows] = useState<number>(initialSettings?.rows || 4);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync external error if any
  React.useEffect(() => {
    if (externalError) {
      setErrorMessage(externalError);
      setIsProcessing(false);
    }
  }, [externalError]);

  // Reset processing when modal re-opens
  React.useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalPieces = cols * rows;

  const handleApplyPresetDifficulty = (c: number, r: number) => {
    setCols(c);
    setRows(r);
  };

  const handleFileProcess = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

    if (!validExtensions.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|gif|svg|avif)$/i)) {
      setErrorMessage('未対応のファイル形式です。PNG、JPEG、WEBP、GIF、SVG、AVIFの画像を選択してください。');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('ファイルサイズが25MBを超えています。より小さい画像を選択してください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setErrorMessage('画像の読み込みに失敗しました。ファイルが破損していないか確認してください。');
        return;
      }

      // Validate image rendering and optimize dimensions
      const testImg = new Image();
      testImg.onload = () => {
        let finalDataUrl = result;
        const maxDim = 1200;
        if (testImg.naturalWidth > maxDim || testImg.naturalHeight > maxDim) {
          try {
            const scale = Math.min(maxDim / testImg.naturalWidth, maxDim / testImg.naturalHeight);
            const w = Math.round(testImg.naturalWidth * scale);
            const h = Math.round(testImg.naturalHeight * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(testImg, 0, 0, w, h);
              finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            }
          } catch (scaleErr) {
            console.warn('Image scaling skipped, using raw data url', scaleErr);
          }
        }

        setSelectedImageUrl(finalDataUrl);
        setSelectedImageTitle(file.name);
        setNaturalWidth(testImg.naturalWidth);
        setNaturalHeight(testImg.naturalHeight);
        setErrorMessage(null);
      };
      testImg.onerror = () => {
        setErrorMessage('画像ファイルの展開に失敗しました。壊れたデータでないか確認してください。');
      };
      testImg.src = result;
    };
    reader.onerror = () => {
      setErrorMessage('ファイル読み取り中にエラーが発生しました。別の画像を試してください。');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handlePresetSelect = (preset: { title: string; url: string }) => {
    setErrorMessage(null);
    setSelectedImageUrl(preset.url);
    setSelectedImageTitle(preset.title);

    const img = new Image();
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
    };
    img.src = preset.url;
  };

  const handleSubmit = () => {
    // Validate inputs
    if (cols < 2 || cols > 8 || rows < 2 || rows > 8) {
      setErrorMessage('分割数は横・縦ともに2〜8の間で指定してください。');
      return;
    }
    if (!selectedImageUrl) {
      setErrorMessage('パズルに使用する画像を選択してください。');
      return;
    }

    setIsProcessing(true);
    try {
      onStartGame({
        imageUrl: selectedImageUrl,
        imageTitle: selectedImageTitle,
        imageNaturalWidth: naturalWidth,
        imageNaturalHeight: naturalHeight,
        cols,
        rows,
        shape,
      });
    } catch (err) {
      console.error('Error starting game:', err);
      setIsProcessing(false);
      setErrorMessage('パズルの開始に失敗しました。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-100 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">パズルの設定と画像選択</h2>
          </div>
          {canCancel && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <span className="font-semibold">読み込みエラー: </span>
              {errorMessage}
            </div>
          </div>
        )}

        <div className="space-y-4 my-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: Image Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              1. 画像を選択（プリセットまたは自分の画像）
            </label>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {PRESET_IMAGES.map((preset) => {
                const isSelected = selectedImageUrl === preset.url;
                return (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`group relative rounded-xl overflow-hidden border text-left transition-all aspect-[4/3] ${
                      isSelected
                        ? 'border-indigo-400 ring-2 ring-indigo-400/40 shadow-md'
                        : 'border-slate-700/70 opacity-75 hover:opacity-100 hover:border-slate-500'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
                      <span className="text-[11px] font-medium text-white truncate w-full">
                        {preset.title}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Image Upload Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 sm:p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                isDraggingFile
                  ? 'border-indigo-400 bg-indigo-950/30'
                  : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-5 h-5 mx-auto text-indigo-400 mb-1" />
              <p className="text-xs font-medium text-slate-200">
                お好きな画像ファイルをアップロード（クリックまたはドラッグ＆ドロップ）
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                対応形式: PNG, JPG, WEBP, GIF, SVG, AVIF（ブラウザ内で処理され外部送信されません）
              </p>
            </div>

            {/* Selected Image Preview with Aspect Ratio */}
            {selectedImageUrl && (
              <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                  <img
                    src={selectedImageUrl}
                    alt="プレビュー"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-white truncate">{selectedImageTitle}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    解像度: {naturalWidth} × {naturalHeight} px (縦横比維持)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Piece Shape Selection */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              2. ピースの形状を選択
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Jigsaw Type */}
              <button
                type="button"
                onClick={() => setShape('jigsaw')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  shape === 'jigsaw'
                    ? 'border-indigo-400 bg-slate-800/90 shadow-md ring-2 ring-indigo-400/30'
                    : 'border-slate-700/70 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0">
                  {/* Jigsaw piece icon */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-indigo-300 fill-current">
                    <path d="M20 10V6c0-1.1-.9-2-2-2h-4c0 1.1-.9 2-2 2s-2-.9-2-2H6c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h4c0-1.1.9-2 2-2s2 .9 2 2h4c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">凹凸ジグソー</div>
                  <div className="text-[10px] text-slate-400">本格的な継ぎ目と凹凸</div>
                </div>
              </button>

              {/* Classic Square Type */}
              <button
                type="button"
                onClick={() => setShape('classic')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  shape === 'classic'
                    ? 'border-indigo-400 bg-slate-800/90 shadow-md ring-2 ring-indigo-400/30'
                    : 'border-slate-700/70 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-700/40 border border-slate-600 flex items-center justify-center shrink-0">
                  <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                    <div className="bg-slate-300 rounded-[1px]" />
                    <div className="bg-slate-300 rounded-[1px]" />
                    <div className="bg-slate-300 rounded-[1px]" />
                    <div className="bg-slate-300 rounded-[1px]" />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">四角形タイプ</div>
                  <div className="text-[10px] text-slate-400">シンプルなグリッド</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Division and Piece Count */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                3. 分割数と難易度（2〜8×2〜8）
              </label>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-0.5 rounded-lg">
                総ピース数: {totalPieces} ピース ({cols}×{rows})
              </span>
            </div>

            {/* Quick Difficulty Presets */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { label: 'かんたん', c: 3, r: 3, count: 9 },
                { label: 'ふつう', c: 4, r: 4, count: 16 },
                { label: 'むずかしい', c: 5, r: 5, count: 25 },
                { label: '上級', c: 6, r: 6, count: 36 },
              ].map((p) => {
                const isActive = cols === p.c && rows === p.r;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPresetDifficulty(p.c, p.r)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                      isActive
                        ? 'border-indigo-400 bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-xs font-medium">{p.label}</div>
                    <div className="text-[10px] opacity-80">{p.count}P</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input Spinners */}
            <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  横方向の分割数 (2〜8):
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={cols}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setCols(Math.max(2, Math.min(8, val)));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  縦方向の分割数 (2〜8):
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={rows}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setRows(Math.max(2, Math.min(8, val)));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {canCancel && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              キャンセル
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            {isProcessing ? 'パズル生成中...' : 'パズルを開始する'}
          </button>
        </div>
      </div>
    </div>
  );
};
