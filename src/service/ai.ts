import {
  Position,
  Tile,
  TileType,
  GameState,
  CAPTURE_SCORES,
  ESCAPE_SCORES,
} from "../types/game";
import {
  BOARD_SIZE,
  GAME_AREA_START,
  GAME_AREA_SIZE,
  isValidMove,
  canCapture,
  EXIT_LINES,
} from "./game";

export function findBestCaptureMove(
  gameState: GameState
): { from: Position; to: Position } | null {
  let bestMove = null;
  let bestScore = -Infinity;

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const tile = gameState.board[i][j];

      if (tile.owner === "ANIMALS" && tile.isRevealed) {
        for (let di = -BOARD_SIZE; di <= BOARD_SIZE; di++) {
          for (let dj = -BOARD_SIZE; dj <= BOARD_SIZE; dj++) {
            const newRow = i + di;
            const newCol = j + dj;

            if (
              newRow < 0 ||
              newRow >= BOARD_SIZE ||
              newCol < 0 ||
              newCol >= BOARD_SIZE
            ) {
              continue;
            }

            const to = { row: newRow, col: newCol };
            const from = { row: i, col: j };
            const targetTile = gameState.board[to.row][to.col];

            if (
              isValidMove(from, to, gameState.board, "ANIMALS", gameState) &&
              canCapture(tile, targetTile, from, to)
            ) {
              const score = CAPTURE_SCORES[targetTile.type] || 0;
              const priorityScore =
                tile.type === "BEAR" &&
                (targetTile.type === "HUNTER" ||
                  targetTile.type === "LUMBERJACK")
                  ? score * 2
                  : score;

              if (priorityScore > bestScore) {
                bestScore = priorityScore;
                bestMove = { from, to };
              }
            }
          }
        }
      }
    }
  }
  return bestScore > 0 ? bestMove : null;
}

export function findUnrevealedTiles(board: Tile[][]): Position[] {
  const tiles: Position[] = [];
  for (let i = GAME_AREA_START; i < GAME_AREA_START + GAME_AREA_SIZE; i++) {
    for (let j = GAME_AREA_START; j < GAME_AREA_START + GAME_AREA_SIZE; j++) {
      if (!board[i][j].isRevealed) {
        tiles.push({ row: i, col: j });
      }
    }
  }
  return tiles;
}

export function findBestMove(
  gameState: GameState
): { from: Position; to: Position } | null {
  let bestMove = null;
  let bestScore = -Infinity;

  for (let i = GAME_AREA_START; i < GAME_AREA_START + GAME_AREA_SIZE; i++) {
    for (let j = GAME_AREA_START; j < GAME_AREA_START + GAME_AREA_SIZE; j++) {
      const tile = gameState.board[i][j];
      if (tile.owner === "ANIMALS" && tile.isRevealed) {
        const possibleMoves = getPossibleMoves({ row: i, col: j }, tile.type);

        for (const to of possibleMoves) {
          const from = { row: i, col: j };
          if (isValidMove(from, to, gameState.board, "ANIMALS", gameState)) {
            const score = evaluateBestMove(from, to, gameState);
            if (score > bestScore) {
              bestScore = score;
              bestMove = { from, to };
            }
          }
        }
      }
    }
  }
  return bestMove;
}

function getPossibleMoves(from: Position, tileType: TileType): Position[] {
  const moves: Position[] = [];

  switch (tileType) {
    case "BEAR":
    case "LUMBERJACK": {
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];

      for (const [dx, dy] of directions) {
        const newRow = from.row + dx;
        const newCol = from.col + dy;
        if (isInBoard(newRow, newCol)) {
          moves.push({ row: newRow, col: newCol });
        }
      }
      break;
    }

    case "FOX":
    case "DUCK":
    case "PHEASANT": {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (col !== from.col) {
          moves.push({ row: from.row, col });
        }
      }
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (row !== from.row) {
          moves.push({ row, col: from.col });
        }
      }
      break;
    }
  }

  return moves;
}

function isInBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function evaluateBestMove(
  from: Position,
  to: Position,
  gameState: GameState
): number {
  const fromTile = gameState.board[from.row][from.col];
  const toTile = gameState.board[to.row][to.col];
  let score = 0;

  if (canCapture(fromTile, toTile, from, to)) {
    score += CAPTURE_SCORES[toTile.type] * 2;
  }

  if (gameState.finalPhase && toTile.type === "EXIT") {
    score += 1000;
  }

  const isInHunterRange = checkIfInHunterRange(to, gameState.board);
  if (isInHunterRange) {
    score -= 100;
  }

  const nearbyEnemies = countNearbyEnemies(to, gameState.board);
  if (fromTile.type === "BEAR") {
    score += nearbyEnemies * 5;
  } else {
    score -= nearbyEnemies * 3;
  }

  return score;
}

function checkIfInHunterRange(pos: Position, board: Tile[][]): boolean {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const tile = board[i][j];
      if (
        tile.type === "HUNTER" &&
        tile.isRevealed &&
        tile.owner === "HUMANS" &&
        tile.direction
      ) {
        switch (tile.direction) {
          case "UP":
            if (pos.col === j && pos.row < i) return true;
            break;
          case "DOWN":
            if (pos.col === j && pos.row > i) return true;
            break;
          case "LEFT":
            if (pos.row === i && pos.col < j) return true;
            break;
          case "RIGHT":
            if (pos.row === i && pos.col > j) return true;
            break;
        }
      }
    }
  }
  return false;
}

function countNearbyEnemies(pos: Position, board: Tile[][]): number {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const newRow = pos.row + i;
      const newCol = pos.col + j;
      if (isInBoard(newRow, newCol)) {
        const tile = board[newRow][newCol];
        if (tile.owner === "HUMANS" && tile.isRevealed) {
          count++;
        }
      }
    }
  }
  return count;
}

export function findBestEscapeMove(
  gameState: GameState
): { from: Position; to: Position } | null {
  if (!gameState.finalPhase) return null;

  let bestMove = null;
  let bestScore = -Infinity;

  for (let i = GAME_AREA_START; i < GAME_AREA_START + GAME_AREA_SIZE; i++) {
    for (let j = GAME_AREA_START; j < GAME_AREA_START + GAME_AREA_SIZE; j++) {
      const tile = gameState.board[i][j];

      if (tile.owner === "ANIMALS" && tile.isRevealed) {
        for (const exit of EXIT_LINES) {
          const from = { row: i, col: j };
          const to = { row: exit.row, col: exit.col };

          if (!isInBoard(to.row, to.col)) continue;

          const distance = Math.abs(i - exit.row) + Math.abs(j - exit.col);

          if (tile.type === "BEAR" || tile.type === "LUMBERJACK") {
            if (distance > 1) continue;
          } else if (["FOX", "DUCK", "PHEASANT"].includes(tile.type)) {
            if (from.row !== exit.row && from.col !== exit.col) continue;
          }

          if (isValidMove(from, to, gameState.board, "ANIMALS", gameState)) {
            const escapeScore = ESCAPE_SCORES[tile.type] || 0;
            if (escapeScore > bestScore) {
              bestScore = escapeScore;
              bestMove = { from, to };
            }
          }
        }
      }
    }
  }
  return bestMove;
}
