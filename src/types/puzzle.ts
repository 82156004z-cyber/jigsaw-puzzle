export type PieceShape = 'classic' | 'jigsaw';

export type InterlockingTab = -1 | 0 | 1;

export interface PieceEdges {
  top: InterlockingTab;
  right: InterlockingTab;
  bottom: InterlockingTab;
  left: InterlockingTab;
}

export interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  // Dimensions
  width: number; // nominal width (without tab protrusions)
  height: number; // nominal height (without tab protrusions)
  tabMargin: number; // margin added around the piece for tabs
  edges: PieceEdges;
  dataUrl: string; // rendered piece slice image (with tabs & shadows)
  // Coordinates
  correctX: number; // target X position on the puzzle board
  correctY: number; // target Y position on the puzzle board
  currentX: number; // current X position in workspace/tray
  currentY: number; // current Y position in workspace/tray
  // State
  isLocked: boolean; // correctly placed on board
  inTray: boolean; // currently placed in the piece dock/tray
  isStaging?: boolean; // temporarily placed outside the board in staging area
  traySlotIndex: number; // position index in tray if in tray
  zIndex: number;
}

export type PlayMode = 'drag' | 'swap';

export type BackgroundThemeId = 'starry' | 'space' | 'ocean' | 'snow' | 'cyber' | 'minimal';

export interface BackgroundTheme {
  id: BackgroundThemeId;
  name: string;
  description: string;
  previewBg: string;
}

export interface PuzzleSettings {
  imageUrl: string;
  imageTitle: string;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  cols: number;
  rows: number;
  shape: PieceShape;
  boardWidth?: number;
  boardHeight?: number;
}
