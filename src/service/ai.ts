import { Position, Tile, GameState } from "../types/game";
import { BOARD_SIZE, isValidMove, canCapture } from "./game";

interface Move {
  from: Position;
  to: Position;
}

export function findBestCaptureMove(
  gameState: GameState,
  isAIHuman: boolean
): Move | null {
  const board = gameState.board;
  const aiTeam = isAIHuman ? "HUMANS" : "ANIMALS";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = board[row][col];
      if (!tile.isRevealed || tile.owner !== aiTeam) continue;

      // 주변 타일 확인
      for (let newRow = 0; newRow < BOARD_SIZE; newRow++) {
        for (let newCol = 0; newCol < BOARD_SIZE; newCol++) {
          const targetTile = board[newRow][newCol];
          if (!targetTile.isRevealed || targetTile.type === "EMPTY") continue;

          if (
            isValidMove(
              { row, col },
              { row: newRow, col: newCol },
              board,
              aiTeam,
              gameState
            ) &&
            canCapture(
              tile,
              targetTile,
              { row, col },
              { row: newRow, col: newCol }
            )
          ) {
            return { from: { row, col }, to: { row: newRow, col: newCol } };
          }
        }
      }
    }
  }
  return null;
}

export function findBestEscapeMove(
  gameState: GameState,
  isAIHuman: boolean
): Move | null {
  const board = gameState.board;
  const aiTeam = isAIHuman ? "HUMANS" : "ANIMALS";
  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = board[row][col];
      if (!tile.isRevealed || tile.owner !== aiTeam) continue;

      // 위험한 상황인지 확인
      const nearbyEnemies = countNearbyEnemies(board, { row, col }, isAIHuman);
      if (nearbyEnemies > 0) {
        // 안전한 위치로 이동 시도
        for (let newRow = 0; newRow < BOARD_SIZE; newRow++) {
          for (let newCol = 0; newCol < BOARD_SIZE; newCol++) {
            if (
              isValidMove(
                { row, col },
                { row: newRow, col: newCol },
                board,
                aiTeam,
                gameState
              )
            ) {
              const newPosition = { row: newRow, col: newCol };
              const newDanger = countNearbyEnemies(
                board,
                newPosition,
                isAIHuman
              );
              if (newDanger < nearbyEnemies) {
                const score = nearbyEnemies - newDanger;
                if (score > bestScore) {
                  bestScore = score;
                  bestMove = { from: { row, col }, to: newPosition };
                }
              }
            }
          }
        }
      }
    }
  }
  return bestMove;
}

export function findUnrevealedTiles(board: Tile[][]): Position[] {
  const unrevealedTiles: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (
        !board[row][col].isRevealed &&
        board[row][col].type !== "EMPTY" &&
        board[row][col].type !== "EXIT"
      ) {
        unrevealedTiles.push({ row, col });
      }
    }
  }
  return unrevealedTiles;
}

export function findBestMove(
  gameState: GameState,
  isAIHuman: boolean
): Move | null {
  const board = gameState.board;
  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  const aiTeam = isAIHuman ? "HUMANS" : "ANIMALS";

  // final phase 로직
  if (gameState.finalPhase) {
    // 1. 최우선 탈출 시도 (인간팀: 나무꾼, 동물팀: 곰)
    const priorityEscape = findPriorityEscape(gameState, isAIHuman);
    if (priorityEscape) return priorityEscape;

    // 2. 높은 가치의 사냥 시도
    const valuableCapture = findValuableCapture(gameState, isAIHuman);
    if (valuableCapture) return valuableCapture;

    // 3. 차선 탈출 시도 (인간팀: 사냥꾼, 동물팀: 여우)
    const secondaryEscape = findSecondaryEscape(gameState, isAIHuman);
    if (secondaryEscape) return secondaryEscape;

    // 4. 일반 사냥 시도
    const normalCapture = findNormalCapture(gameState, isAIHuman);
    if (normalCapture) return normalCapture;
  }

  // 일반적인 이동 또는 탈출구 방향으로의 이동
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = board[row][col];
      if (!tile.isRevealed || tile.type === "EMPTY" || tile.owner !== aiTeam)
        continue;

      for (let newRow = 0; newRow < BOARD_SIZE; newRow++) {
        for (let newCol = 0; newCol < BOARD_SIZE; newCol++) {
          if (newRow === row && newCol === col) continue;

          if (
            isValidMove(
              { row, col },
              { row: newRow, col: newCol },
              board,
              aiTeam,
              gameState
            )
          ) {
            const moveScore = evaluateBestMove(
              board,
              { row, col },
              { row: newRow, col: newCol },
              isAIHuman,
              gameState.finalPhase
            );

            if (moveScore > bestScore) {
              bestScore = moveScore;
              bestMove = {
                from: { row, col },
                to: { row: newRow, col: newCol },
              };
            }
          }
        }
      }
    }
  }

  return bestMove;
}

// 최우선 탈출 (나무꾼/곰)
function findPriorityEscape(
  gameState: GameState,
  isAIHuman: boolean
): Move | null {
  const board = gameState.board;
  const aiTeam = isAIHuman ? "HUMANS" : "ANIMALS";
  const priorityType = isAIHuman ? "LUMBERJACK" : "BEAR";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = board[row][col];
      if (
        !tile.isRevealed ||
        tile.owner !== aiTeam ||
        tile.type !== priorityType
      )
        continue;

      const escapeMove = findEscapeMove(gameState, { row, col });
      if (escapeMove) return escapeMove;
    }
  }
  return null;
}

// 높은 가치의 사냥
function findValuableCapture(
  gameState: GameState,
  isAIHuman: boolean
): Move | null {
  const board = gameState.board;
  const aiTeam = isAIHuman ? "HUMANS" : "ANIMALS";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = board[row][col];
      if (!tile.isRevealed || tile.owner !== aiTeam) continue;

      // 인간팀: 곰 > 여우 사냥 우선
      // 동물팀: 사냥꾼/나무꾼 사냥 우선
      const targetTypes = isAIHuman
        ? ["BEAR", "FOX"]
        : ["HUNTER", "LUMBERJACK"];

      for (const targetType of targetTypes) {
        const captureMove = findSpecificCapture(
          gameState,
          { row, col },
          targetType
        );
        if (captureMove) return captureMove;
      }
    }
  }
  return null;
}

// 차선 탈출 (사냥꾼/여우)
function findSecondaryEscape(
  gameState: GameState,
  isAIHuman: boolean
): Move | null {
  const board = gameState.board;
  const aiTeam = isAIHuman ? "HUMANS" : "ANIMALS";
  const secondaryType = isAIHuman ? "HUNTER" : "FOX";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = board[row][col];
      if (
        !tile.isRevealed ||
        tile.owner !== aiTeam ||
        tile.type !== secondaryType
      )
        continue;

      const escapeMove = findEscapeMove(gameState, { row, col });
      if (escapeMove) return escapeMove;
    }
  }
  return null;
}

// 일반 사냥 (꿩/오리/나무)
function findNormalCapture(
  gameState: GameState,
  isAIHuman: boolean
): Move | null {
  const board = gameState.board;
  const aiTeam = isAIHuman ? "HUMANS" : "ANIMALS";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const tile = board[row][col];
      if (!tile.isRevealed || tile.owner !== aiTeam) continue;

      const targetTypes = ["PHEASANT", "DUCK"];
      if (isAIHuman && tile.type === "LUMBERJACK") {
        targetTypes.push("TREE");
      }

      for (const targetType of targetTypes) {
        const captureMove = findSpecificCapture(
          gameState,
          { row, col },
          targetType
        );
        if (captureMove) return captureMove;
      }
    }
  }
  return null;
}

// 특정 타입 사냥을 위한 이동 찾기
function findSpecificCapture(
  gameState: GameState,
  from: Position,
  targetType: string
): Move | null {
  const board = gameState.board;
  const aiTeam = board[from.row][from.col].owner;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const targetTile = board[row][col];
      if (!targetTile.isRevealed || targetTile.type !== targetType) continue;
      if (aiTeam === "NEUTRAL") continue;

      if (
        isValidMove(from, { row, col }, board, aiTeam, gameState) &&
        canCapture(board[from.row][from.col], targetTile, from, { row, col })
      ) {
        return { from, to: { row, col } };
      }
    }
  }
  return null;
}

// 탈출 이동 찾기
function findEscapeMove(gameState: GameState, from: Position): Move | null {
  const board = gameState.board;
  const aiTeam = board[from.row][from.col].owner;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (aiTeam === "NEUTRAL") continue;

      if (
        board[row][col].type === "EXIT" &&
        isValidMove(from, { row, col }, board, aiTeam, gameState)
      ) {
        return { from, to: { row, col } };
      }
    }
  }
  return null;
}

function evaluateBestMove(
  _board: Tile[][],
  _from: Position,
  to: Position,
  _isAIHuman: boolean,
  isFinalPhase: boolean
): number {
  let score = 1;

  if (isFinalPhase) {
    // 탈출구 방향으로의 이동 점수
    const distanceToExit = Math.min(
      to.row,
      to.col,
      BOARD_SIZE - 1 - to.row,
      BOARD_SIZE - 1 - to.col
    );
    score += (BOARD_SIZE - distanceToExit) * 2;
  }

  return score;
}

function countNearbyEnemies(
  board: Tile[][],
  position: Position,
  isAIHuman: boolean
): number {
  let count = 0;
  const aiTeam = isAIHuman ? "HUMANS" : "ANIMALS";
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dx, dy] of directions) {
    const newRow = position.row + dx;
    const newCol = position.col + dy;

    if (
      newRow >= 0 &&
      newRow < BOARD_SIZE &&
      newCol >= 0 &&
      newCol < BOARD_SIZE
    ) {
      const tile = board[newRow][newCol];
      if (
        tile.isRevealed &&
        tile.owner !== aiTeam &&
        tile.owner !== "NEUTRAL"
      ) {
        count++;
      }
    }
  }

  return count;
}
