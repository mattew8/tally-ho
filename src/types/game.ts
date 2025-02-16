export type Player = "P1" | "P2";

export type TileType =
  | "HUNTER" // 사냥꾼
  | "LUMBERJACK" // 나무꾼
  | "FOX" // 여우
  | "BEAR" // 곰
  | "DUCK" // 오리
  | "PHEASANT" // 꿩
  | "TREE" // 나무
  | "EMPTY"; // 빈 칸

export interface Position {
  row: number;
  col: number;
}

export interface Tile {
  type: TileType;
  isRevealed: boolean;
  owner: Player | "NEUTRAL";
}

export interface GameState {
  board: Tile[][];
  currentPlayer: Player;
  scores: {
    P1: number;
    P2: number;
  };
  selectedTile: Position | null;
  gameOver: boolean;
}

// 각 타일 타입별 점수
export const CAPTURE_SCORES: Record<TileType, number> = {
  HUNTER: 5, // 곰이 사냥꾼 포획
  FOX: 5, // 사냥꾼이 여우 포획
  BEAR: 10, // 사냥꾼이 곰 포획
  DUCK: 2, // 여우/곰이 오리 포획
  PHEASANT: 3, // 여우/곰이 꿩 포획
  TREE: 2, // 나무꾼이 나무 제거
  LUMBERJACK: 0, // 포획 점수 없음
  EMPTY: 0, // 포획 점수 없음
};
