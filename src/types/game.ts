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

export interface Tile {
  type: TileType;
  isRevealed: boolean;
  owner: Player | "NEUTRAL";
}

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  board: Tile[][];
  currentPlayer: Player;
  scores: {
    P1: number;
    P2: number;
  };
}
