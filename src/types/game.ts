export type Team = "HUMANS" | "ANIMALS";

export type TileType =
  | "HUNTER" // 사냥꾼
  | "LUMBERJACK" // 나무꾼
  | "FOX" // 여우
  | "BEAR" // 곰
  | "DUCK" // 오리
  | "PHEASANT" // 꿩
  | "TREE" // 나무
  | "CABIN" // 오두막
  | "EXIT" // 탈출구
  | "EMPTY"; // 빈 칸

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface Position {
  row: number;
  col: number;
}

export interface Tile {
  type: TileType;
  isRevealed: boolean;
  owner: Team | "NEUTRAL";
  direction?: Direction; // 사냥꾼의 방향
}

export interface RoundScore {
  HUMANS: number;
  ANIMALS: number;
}

export interface GameState {
  board: Tile[][];
  scores: RoundScore;
  selectedTile: Position | null;
  gameOver: boolean;
  finalPhase: boolean;
  remainingMoves: RoundScore;
  isAITurn: boolean;
  logs: string[];
  round: 1 | 2; // 1라운드 또는 2라운드
  roundScores: {
    round1: RoundScore; // 1라운드 점수
    round2: RoundScore; // 2라운드 점수
  };
  isUserHuman: boolean; // 현재 라운드에서 유저가 인간팀인지 여부
}

// 각 타일 타입별 점수
export const CAPTURE_SCORES: Record<TileType, number> = {
  HUNTER: 5, // 곰이 사냥꾼 포획
  FOX: 5, // 사냥꾼이 여우 포획
  BEAR: 10, // 사냥꾼이 곰 포획
  DUCK: 2, // 여우/곰이 오리 포획
  PHEASANT: 3, // 여우/곰이 꿩 포획
  TREE: 2, // 나무꾼이 나무 제거
  LUMBERJACK: 5, // 곰이 나무꾼 포획
  CABIN: 0, // 포획 불가
  EMPTY: 0, // 포획 점수 없음
  EXIT: 0, // 포획 점수 없음
};

// 탈출 시 얻는 점수
export const ESCAPE_SCORES: Partial<Record<TileType, number>> = {
  HUNTER: 5,
  LUMBERJACK: 5,
  FOX: 5,
  BEAR: 10,
};
