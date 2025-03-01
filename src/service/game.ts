import {
  Tile,
  TileType,
  Team,
  Position,
  GameState,
  Direction,
} from "../types/game";

export const BOARD_SIZE = 9;
export const GAME_AREA_START = 1;
export const GAME_AREA_SIZE = 7;

export const EXIT_LINES: Position[] = [
  { row: 0, col: 4 },
  { row: 8, col: 4 },
  { row: 4, col: 0 },
  { row: 4, col: 8 },
];

export const createInitialBoard = (): Tile[][] => {
  const board: Tile[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() =>
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => ({
          type: "EMPTY",
          isRevealed: true,
          owner: "NEUTRAL",
        }))
    );

  const tiles = [
    ...Array(8).fill("HUNTER"),
    ...Array(2).fill("LUMBERJACK"),
    ...Array(2).fill("BEAR"),
    ...Array(6).fill("FOX"),
    ...Array(8).fill("PHEASANT"),
    ...Array(7).fill("DUCK"),
    ...Array(15).fill("TREE"),
  ];

  const shuffledTiles = tiles.sort(() => Math.random() - 0.5);
  let tileIndex = 0;

  for (let i = 0; i < GAME_AREA_SIZE; i++) {
    for (let j = 0; j < GAME_AREA_SIZE; j++) {
      const row = i + GAME_AREA_START;
      const col = j + GAME_AREA_START;

      if (
        i === Math.floor(GAME_AREA_SIZE / 2) &&
        j === Math.floor(GAME_AREA_SIZE / 2)
      ) {
        board[row][col] = {
          type: "CABIN",
          isRevealed: true,
          owner: "NEUTRAL",
        };
      } else {
        const type = shuffledTiles[tileIndex];
        board[row][col] = {
          type,
          isRevealed: false,
          owner:
            type === "HUNTER" || type === "LUMBERJACK"
              ? "HUMANS"
              : type === "FOX" || type === "BEAR"
              ? "ANIMALS"
              : "NEUTRAL",
          direction: type === "HUNTER" ? getRandomDirection() : undefined,
        };
        tileIndex++;
      }
    }
  }

  EXIT_LINES.forEach(({ row, col }) => {
    board[row][col] = {
      type: "EXIT",
      isRevealed: true,
      owner: "NEUTRAL",
    };
  });

  return board;
};

export function isValidMove(
  from: Position,
  to: Position,
  board: Tile[][],
  currentTeam: Team,
  gameState: GameState
): boolean {
  const fromTile = board[from.row][from.col];
  const toTile = board[to.row][to.col];

  // 기본 검증
  if (!fromTile.isRevealed) return false;
  if (fromTile.type === "EMPTY" || fromTile.type === "CABIN") return false;
  if (fromTile.owner !== currentTeam && fromTile.owner !== "NEUTRAL")
    return false;
  if (toTile.type === "CABIN") return false;

  // 이동 방향 및 거리 계산
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);
  const isDiagonal = rowDiff > 0 && colDiff > 0;

  // 대각선 이동 불가
  if (isDiagonal) return false;

  // 게임 영역 검증 (EXIT가 아닌 경우에만)
  if (toTile.type !== "EXIT") {
    const isFromInGameArea =
      from.row >= GAME_AREA_START &&
      from.row < GAME_AREA_START + GAME_AREA_SIZE &&
      from.col >= GAME_AREA_START &&
      from.col < GAME_AREA_START + GAME_AREA_SIZE;

    const isToInGameArea =
      to.row >= GAME_AREA_START &&
      to.row < GAME_AREA_START + GAME_AREA_SIZE &&
      to.col >= GAME_AREA_START &&
      to.col < GAME_AREA_START + GAME_AREA_SIZE;

    if (!isFromInGameArea || !isToInGameArea) return false;
  }

  // 이동 규칙 검증
  const isShortMover = ["BEAR", "LUMBERJACK"].includes(fromTile.type);

  // 짧은 이동 타일 (곰, 나무꾼)은 한 칸만 이동 가능
  if (isShortMover && (rowDiff > 1 || colDiff > 1)) {
    return false;
  }

  // 긴 이동 타일의 경로 상에 다른 타일이 있는지 확인
  if (!isShortMover) {
    const rowStep = rowDiff ? (to.row - from.row) / rowDiff : 0;
    const colStep = colDiff ? (to.col - from.col) / colDiff : 0;

    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;

    while (currentRow !== to.row || currentCol !== to.col) {
      const pathTile = board[currentRow][currentCol];
      if (pathTile.type !== "EMPTY") {
        return false;
      }
      currentRow += rowStep;
      currentCol += colStep;
    }
  }

  // EXIT 타일로의 이동 검증
  if (toTile.type === "EXIT") {
    if (!gameState.finalPhase) return false;

    // 인간팀은 사냥꾼과 나무꾼만 탈출 가능
    if (
      currentTeam === "HUMANS" &&
      !["HUNTER", "LUMBERJACK"].includes(fromTile.type)
    ) {
      return false;
    }
    // 동물팀은 곰과 여우만 탈출 가능
    if (currentTeam === "ANIMALS" && !["BEAR", "FOX"].includes(fromTile.type)) {
      return false;
    }
    return true;
  }

  // 일반적인 이동 규칙
  if (toTile.type !== "EMPTY") {
    return canCapture(fromTile, toTile, from, to);
  }

  return true;
}

export function canCapture(
  attacker: Tile,
  target: Tile,
  from: Position,
  to: Position
): boolean {
  if (!target.isRevealed) return false;

  switch (attacker.type) {
    case "HUNTER": {
      if (!attacker.direction) return false;
      if (!["FOX", "BEAR", "DUCK", "PHEASANT"].includes(target.type))
        return false;

      const rowDiff = to.row - from.row;
      const colDiff = to.col - from.col;

      switch (attacker.direction) {
        case "UP":
          return rowDiff < 0 && colDiff === 0;
        case "DOWN":
          return rowDiff > 0 && colDiff === 0;
        case "LEFT":
          return colDiff < 0 && rowDiff === 0;
        case "RIGHT":
          return colDiff > 0 && rowDiff === 0;
        default:
          return false;
      }
    }
    case "LUMBERJACK":
      return target.type === "TREE";
    case "FOX":
      return ["DUCK", "PHEASANT"].includes(target.type);
    case "BEAR":
      return target.type === "HUNTER" || target.type === "LUMBERJACK";
    default:
      return false;
  }
}

export function checkLinearPath(
  from: Position,
  to: Position,
  board: Tile[][]
): boolean {
  const startRow = Math.min(from.row, to.row);
  const endRow = Math.max(from.row, to.row);
  const startCol = Math.min(from.col, to.col);
  const endCol = Math.max(from.col, to.col);

  if (from.row === to.row) {
    for (let col = startCol + 1; col < endCol; col++) {
      if (board[from.row][col].type !== "EMPTY") return false;
    }
    return true;
  }

  if (from.col === to.col) {
    for (let row = startRow + 1; row < endRow; row++) {
      if (board[row][from.col].type !== "EMPTY") return false;
    }
    return true;
  }

  return false;
}

function getRandomDirection(): Direction {
  const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
  return directions[Math.floor(Math.random() * directions.length)];
}

export function getTileKoreanName(type: TileType): string {
  switch (type) {
    case "HUNTER":
      return "사냥꾼";
    case "LUMBERJACK":
      return "나무꾼";
    case "FOX":
      return "여우";
    case "BEAR":
      return "곰";
    case "DUCK":
      return "오리";
    case "PHEASANT":
      return "꿩";
    case "TREE":
      return "나무";
    case "CABIN":
      return "오두막";
    case "EXIT":
      return "출구";
    case "EMPTY":
      return "빈 칸";
  }
}

export function getTileSymbol(tile: Tile): string {
  switch (tile.type) {
    case "HUNTER":
      switch (tile.direction) {
        case "UP":
          return "🏹⬆️";
        case "DOWN":
          return "🏹⬇️";
        case "LEFT":
          return "🏹⬅️";
        case "RIGHT":
          return "🏹➡️";
        default:
          return "🏹";
      }
    case "LUMBERJACK":
      return "👨‍🌾";
    case "FOX":
      return "🦊";
    case "BEAR":
      return "🐻";
    case "DUCK":
      return "🦆";
    case "PHEASANT":
      return "🐔";
    case "TREE":
      return "🌲";
    case "CABIN":
      return "🏠";
    case "EMPTY":
      return " ";
    case "EXIT":
      return "🚪";
  }
}
