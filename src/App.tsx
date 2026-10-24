import { useState, useEffect, useRef, useCallback } from 'react';
import { BackgroundThemeId, PieceShape, PuzzlePiece, PuzzleSettings } from './types/puzzle';
import { sliceImageIntoPieces, shuffleArray, computeBoardDimensions } from './utils/puzzle';
import { getSoundMuted, setSoundMuted, playVictorySound } from './utils/audio';
import { BackgroundView } from './components/BackgroundView';
import { BackgroundSelectorModal } from './components/BackgroundSelectorModal';
import { Header } from './components/Header';
import { PuzzleBoard } from './components/PuzzleBoard';
import { SetupModal, PRESET_IMAGES } from './components/SetupModal';
import { SamplePreviewModal } from './components/SamplePreviewModal';
import { ConfirmModal } from './components/ConfirmModal';
import { PauseOverlay } from './components/PauseOverlay';
import { VictoryModal } from './components/VictoryModal';

export default function App() {
  // Theme state with localStorage persistence
  const [currentTheme, setCurrentTheme] = useState<BackgroundThemeId>(() => {
    try {
      const saved = localStorage.getItem('puzzle_bg_theme');
      if (saved && ['starry', 'space', 'ocean', 'snow', 'cyber', 'minimal'].includes(saved)) {
        return saved as BackgroundThemeId;
      }
    } catch {
      // fallback
    }
    return 'starry';
  });

  // Sound mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => getSoundMuted());

  // Game settings
  const [settings, setSettings] = useState<PuzzleSettings>({
    imageUrl: PRESET_IMAGES[0].url,
    imageTitle: PRESET_IMAGES[0].title,
    imageNaturalWidth: 1024,
    imageNaturalHeight: 768,
    cols: 4,
    rows: 4,
    shape: 'jigsaw' as PieceShape,
  });

  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Game flow states
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Modals
  const [showSamplePreview, setShowSamplePreview] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    onConfirm: () => {},
  });

  // Timer Ref
  const timerRef = useRef<number | null>(null);

  // Error message for initialization failures
  const [initError, setInitError] = useState<string | null>(null);

  // Build pieces from an image
  const initializePuzzle = useCallback((newSettings: PuzzleSettings) => {
    setIsInitializing(true);
    setInitError(null);
    setIsCompleted(false);
    setIsVictoryModalOpen(false);
    setIsPaused(false);
    setElapsedSeconds(0);

    const img = new Image();
    
    // Only set crossOrigin for remote HTTP(S) URLs to prevent CORS errors on data: or blob: URLs
    if (newSettings.imageUrl.startsWith('http://') || newSettings.imageUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    // Safety timeout in case image loading stalls
    const timeoutId = window.setTimeout(() => {
      console.warn('Image load timed out');
      setIsInitializing(false);
      setInitError('画像の読み込みがタイムアウトしました。画像形式またはサイズを確認してください。');
    }, 10000);

    img.onload = () => {
      window.clearTimeout(timeoutId);
      try {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const { boardWidth, boardHeight } = computeBoardDimensions(
          img.naturalWidth,
          img.naturalHeight,
          newSettings.cols,
          newSettings.rows,
          isMobile
        );

        const generatedPieces = sliceImageIntoPieces(
          img,
          newSettings.cols,
          newSettings.rows,
          newSettings.shape,
          boardWidth,
          boardHeight
        );

        if (!generatedPieces || generatedPieces.length === 0) {
          throw new Error('ピースの生成に失敗しました。');
        }

        // Randomize initial placement in the piece dock tray
        const shuffledIndices = shuffleArray(generatedPieces.map((_, i) => i));
        const placedPieces = generatedPieces.map((p, idx) => ({
          ...p,
          isLocked: false,
          inTray: true,
          isStaging: false,
          traySlotIndex: shuffledIndices[idx],
          currentX: p.correctX,
          currentY: p.correctY,
        }));

        const updatedSettings: PuzzleSettings = {
          ...newSettings,
          boardWidth,
          boardHeight,
          imageNaturalWidth: img.naturalWidth,
          imageNaturalHeight: img.naturalHeight,
        };

        setPieces(placedPieces);
        setSettings(updatedSettings);
        setIsInitializing(false);
        setIsSetupModalOpen(false);
      } catch (err) {
        console.error('Error during piece slicing:', err);
        setIsInitializing(false);
        setInitError('パズルの生成中にエラーが発生しました。別の画像をお試しください。');
      }
    };

    img.onerror = (e) => {
      window.clearTimeout(timeoutId);
      console.error('Failed to load image for puzzle slicing:', e);
      setIsInitializing(false);
      setInitError('画像の読み込みに失敗しました。破損したファイルでないか確認してください。');
    };

    img.src = newSettings.imageUrl;
  }, []);

  // Initial load
  useEffect(() => {
    initializePuzzle(settings);
  }, []); // Run once on mount

  // Timer runner
  useEffect(() => {
    if (isPaused || isCompleted || isSetupModalOpen || isInitializing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, isCompleted, isSetupModalOpen, isInitializing]);

  // Handle theme changes (preserves game state completely!)
  const handleSelectTheme = (theme: BackgroundThemeId) => {
    setCurrentTheme(theme);
    try {
      localStorage.setItem('puzzle_bg_theme', theme);
    } catch {
      // safe fallback
    }
  };

  // Sound mute toggle
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMuted(next);
  };

  // Victory callback
  const handleVictory = useCallback(() => {
    if (isCompleted) return; // Prevent duplicate execution
    setIsCompleted(true);
    playVictorySound();
    setIsVictoryModalOpen(true);
  }, [isCompleted]);

  // Request Restart with confirm dialog
  const handleRequestRestart = () => {
    setConfirmDialog({
      isOpen: true,
      title: '最初からやり直しますか？',
      message: '現在のピースの配置と経過時間がリセットされます。画像と難易度設定は維持されます。',
      confirmLabel: 'やり直す',
      isDestructive: false,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        initializePuzzle(settings);
      },
    });
  };

  // Request Change Image with confirm dialog if in progress
  const handleRequestChangeImage = () => {
    const isGameInProgress = pieces.some((p) => p.isLocked) || elapsedSeconds > 15;

    if (isGameInProgress) {
      setConfirmDialog({
        isOpen: true,
        title: '別の画像に変更しますか？',
        message: '現在のゲームの進行状況は破棄され、新しい設定で新しくゲームを開始します。',
        confirmLabel: '画像を変更する',
        isDestructive: true,
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          setIsSetupModalOpen(true);
        },
      });
    } else {
      setIsSetupModalOpen(true);
    }
  };

  // Completion calculation
  const totalPieces = settings.cols * settings.rows;
  const lockedPiecesCount = pieces.filter((p) => p.isLocked).length;
  const completionRate =
    totalPieces > 0 ? Math.round((lockedPiecesCount / totalPieces) * 100) : 0;

  return (
    <div className="relative min-h-screen w-full flex flex-col text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Scene */}
      <BackgroundView theme={currentTheme} />

      {/* Top Bar Header */}
      <Header
        elapsedSeconds={elapsedSeconds}
        completionRate={completionRate}
        totalPieces={totalPieces}
        lockedPiecesCount={lockedPiecesCount}
        cols={settings.cols}
        rows={settings.rows}
        isPaused={isPaused}
        isMuted={isMuted}
        showSamplePreview={showSamplePreview}
        currentTheme={currentTheme}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onToggleMute={handleToggleMute}
        onToggleSamplePreview={() => setShowSamplePreview((prev) => !prev)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onRequestRestart={handleRequestRestart}
        onRequestChangeImage={handleRequestChangeImage}
      />

      {/* Main Workspace Container */}
      <main className="relative flex-1 flex flex-col items-center justify-start p-2 sm:p-4 max-w-7xl mx-auto w-full">
        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-300">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">パズルピースを生成中...</p>
            <p className="text-xs text-slate-400 mt-1">画像を高品質にスライスしています</p>
          </div>
        ) : initError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-200">
            <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 max-w-md mx-auto">
              <p className="text-sm font-bold text-rose-300 mb-1">エラーが発生しました</p>
              <p className="text-xs text-rose-200/90 mb-4">{initError}</p>
              <button
                onClick={() => setIsSetupModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                画像を選び直す
              </button>
            </div>
          </div>
        ) : (
          <PuzzleBoard
            settings={settings}
            pieces={pieces}
            setPieces={setPieces}
            isPaused={isPaused}
            onVictory={handleVictory}
          />
        )}
      </main>

      {/* Completed Sample Floating Preview */}
      <SamplePreviewModal
        isOpen={showSamplePreview}
        imageUrl={settings.imageUrl}
        imageTitle={settings.imageTitle}
        onClose={() => setShowSamplePreview(false)}
      />

      {/* Background Theme Selector Modal */}
      <BackgroundSelectorModal
        isOpen={isThemeModalOpen}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Setup / Change Image Modal */}
      <SetupModal
        isOpen={isSetupModalOpen}
        initialSettings={settings}
        externalError={initError}
        canCancel={pieces.length > 0}
        onStartGame={(newSettings) => initializePuzzle(newSettings)}
        onClose={() => setIsSetupModalOpen(false)}
      />

      {/* Pause Screen Overlay */}
      <PauseOverlay
        isPaused={isPaused}
        onResume={() => setIsPaused(false)}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        elapsedSeconds={elapsedSeconds}
        totalPieces={totalPieces}
        cols={settings.cols}
        rows={settings.rows}
        shape={settings.shape}
        imageTitle={settings.imageTitle}
        onReplay={() => {
          setIsVictoryModalOpen(false);
          initializePuzzle(settings);
        }}
        onChangeImage={() => {
          setIsVictoryModalOpen(false);
          setIsSetupModalOpen(true);
        }}
      />

      {/* Reusable Confirm Dialog */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
