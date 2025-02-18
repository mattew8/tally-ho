import { useState } from "react";
import {
  GameState,
  Tile,
  TileType,
  Player,
  Position,
  CAPTURE_SCORES,
  Direction,
  ESCAPE_SCORES,
} from "./types/game";
import "./App.css";

const BOARD_SIZE = 9; // 전체 보드 크기
const GAME_AREA_START = 1; // 실제 게임 영역 시작 위치
const GAME_AREA_SIZE = 7; // 실제 게임 영역 크기

const createInitialBoard = (): Tile[][] => {
  // 빈 9x9 보드 생성
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

  // 타일 구성
  const tiles: TileType[] = [
    ...Array(8).fill("HUNTER"),
    ...Array(2).fill("LUMBERJACK"),
    ...Array(2).fill("BEAR"),
    ...Array(6).fill("FOX"),
    ...Array(8).fill("PHEASANT"),
    ...Array(7).fill("DUCK"),
    ...Array(15).fill("TREE"),
  ];

  // 타일 섞기
  const shuffledTiles = tiles.sort(() => Math.random() - 0.5);
  let tileIndex = 0;

  // 7x7 게임 영역에 타일 배치
  for (let i = 0; i < GAME_AREA_SIZE; i++) {
    for (let j = 0; j < GAME_AREA_SIZE; j++) {
      const row = i + GAME_AREA_START;
      const col = j + GAME_AREA_START;

      // 중앙 칸은 오두막
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
              ? "P1"
              : type === "FOX" || type === "BEAR"
              ? "P2"
              : "NEUTRAL",
          direction: type === "HUNTER" ? getRandomDirection() : undefined,
        };
        tileIndex++;
      }
    }
  }

  // 탈출구 설정
  const exits: Position[] = [
    { row: 0, col: 4 }, // 상
    { row: 8, col: 4 }, // 하
    { row: 4, col: 0 }, // 좌
    { row: 4, col: 8 }, // 우
  ];

  exits.forEach(({ row, col }) => {
    board[row][col] = {
      type: "EXIT",
      isRevealed: true,
      owner: "NEUTRAL",
    };
  });

  return board;
};

function isValidMove(
  from: Position,
  to: Position,
  board: Tile[][],
  currentPlayer: Player,
  gameState: GameState
): boolean {
  const fromTile = board[from.row][from.col];
  const toTile = board[to.row][to.col];

  // 탈출구 라인인지 확인 (탈출구 자체는 제외)
  const isExitLine =
    (to.row === 0 ||
      to.row === BOARD_SIZE - 1 ||
      to.col === 0 ||
      to.col === BOARD_SIZE - 1) &&
    toTile.type !== "EXIT";

  // 탈출구 라인으로는 이동 불가
  if (isExitLine) return false;

  // 이미 공개된 타일로만 이동 가능
  if (!fromTile.isRevealed || !toTile.isRevealed) return false;

  // 이동 불가능한 타일 체크
  if (["TREE", "EMPTY", "CABIN"].includes(fromTile.type)) {
    return false;
  }

  // 자신의 타일이거나 중립 타일(오리, 꿩)만 이동 가능
  if (
    fromTile.owner !== currentPlayer &&
    !(
      fromTile.owner === "NEUTRAL" &&
      ["DUCK", "PHEASANT"].includes(fromTile.type)
    )
  ) {
    return false;
  }

  // 목적지가 오두막인 경우 이동 불가
  if (toTile.type === "CABIN") {
    return false;
  }

  // 탈출구로의 이동은 마지막 단계에서만 가능
  if (toTile.type === "EXIT") {
    // 마지막 단계가 아니면 탈출 불가
    if (!gameState.finalPhase) return false;

    // 자신의 타일만 탈출 가능
    if (currentPlayer === "P1") {
      return ["HUNTER", "LUMBERJACK"].includes(fromTile.type);
    } else {
      return ["FOX", "BEAR"].includes(fromTile.type);
    }
  }

  // 목적지가 비어있거나 포획할 수 있는 경우만 이동 가능
  if (toTile.type !== "EMPTY" && !canCapture(fromTile, toTile, from, to)) {
    return false;
  }

  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;

  // 직선 이동만 가능 (상하좌우)
  if (rowDiff !== 0 && colDiff !== 0) {
    return false;
  }

  // 곰과 나무꾼은 상하좌우 한 칸만 이동 가능
  if (fromTile.type === "BEAR" || fromTile.type === "LUMBERJACK") {
    return Math.abs(rowDiff) + Math.abs(colDiff) === 1;
  }

  // 사냥꾼, 여우, 오리, 꿩은 직선으로 여러 칸 이동 가능
  if (["HUNTER", "FOX", "DUCK", "PHEASANT"].includes(fromTile.type)) {
    const startRow = Math.min(from.row, to.row);
    const endRow = Math.max(from.row, to.row);
    const startCol = Math.min(from.col, to.col);
    const endCol = Math.max(from.col, to.col);

    // 가로 이동
    if (rowDiff === 0) {
      for (let col = startCol + 1; col < endCol; col++) {
        if (board[from.row][col].type !== "EMPTY") {
          return false; // 경로 상에 타일이 있으면 이동 불가
        }
      }
      return true;
    }

    // 세로 이동
    if (colDiff === 0) {
      for (let row = startRow + 1; row < endRow; row++) {
        if (board[row][from.col].type !== "EMPTY") {
          return false; // 경로 상에 타일이 있으면 이동 불가
        }
      }
      return true;
    }
  }

  return false;
}

function canCapture(
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

      // 사냥꾼의 방향과 타겟의 위치가 일치하는지 확인
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

function App() {
  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    currentPlayer: "P1",
    scores: { P1: 0, P2: 0 },
    selectedTile: null,
    gameOver: false,
    finalPhase: false,
    remainingMoves: { P1: 5, P2: 5 },
  });

  const handleTileClick = (row: number, col: number) => {
    if (gameState.gameOver) return;

    const tile = gameState.board[row][col];

    // 이동할 타일이 선택된 상태
    if (gameState.selectedTile) {
      handleMove(row, col);
      return;
    }

    // 타일이 이미 공개된 경우: 이동을 위한 타일 선택
    if (tile.isRevealed) {
      // 자신의 타일이거나 중립 타일(오리, 꿩)인 경우만 선택 가능
      if (
        tile.owner === gameState.currentPlayer ||
        (tile.owner === "NEUTRAL" && ["DUCK", "PHEASANT"].includes(tile.type))
      ) {
        setGameState((prev) => ({
          ...prev,
          selectedTile: { row, col },
        }));
      }
      return;
    }

    // 타일이 공개되지 않은 경우: 타일 공개
    handleReveal(row, col);
  };

  const handleReveal = (row: number, col: number) => {
    if (gameState.board[row][col].isRevealed) return;

    const newBoard = [...gameState.board];
    newBoard[row][col] = {
      ...newBoard[row][col],
      isRevealed: true,
    };

    // 모든 타일이 공개되었는지 확인
    const shouldStartFinalPhase = checkAllTilesRevealed(newBoard);

    // 타일을 열면 바로 턴 종료
    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === "P1" ? "P2" : "P1",
      finalPhase: shouldStartFinalPhase, // 마지막 타일이 열리면 바로 마지막 단계 시작
    }));
  };

  // 모든 타일이 공개되었는지 확인하는 함수
  const checkAllTilesRevealed = (board: Tile[][]): boolean => {
    return board
      .flat()
      .every(
        (tile) =>
          tile.isRevealed || tile.type === "EXIT" || tile.type === "EMPTY"
      );
  };

  const handleMove = (row: number, col: number) => {
    if (!gameState.selectedTile) return;

    const from = gameState.selectedTile;
    const to = { row, col };

    if (
      isValidMove(from, to, gameState.board, gameState.currentPlayer, gameState)
    ) {
      const newBoard = [...gameState.board];
      const movingTile = newBoard[from.row][from.col];
      const targetTile = newBoard[to.row][to.col];

      const newScores = { ...gameState.scores };

      // 탈출 처리
      if (gameState.finalPhase && targetTile.type === "EXIT") {
        if (
          (gameState.currentPlayer === "P1" &&
            ["HUNTER", "LUMBERJACK"].includes(movingTile.type)) ||
          (gameState.currentPlayer === "P2" &&
            ["FOX", "BEAR"].includes(movingTile.type))
        ) {
          // 탈출 점수 추가
          newScores[gameState.currentPlayer] +=
            ESCAPE_SCORES[movingTile.type] || 0;

          // 탈출한 타일은 제거만 하고, 탈출구로는 이동하지 않음
          newBoard[from.row][from.col] = {
            type: "EMPTY",
            isRevealed: true,
            owner: "NEUTRAL",
          };
        }
      } else {
        // 일반 이동 또는 포획
        if (canCapture(movingTile, targetTile, from, to)) {
          // 포획 점수 추가
          const score = CAPTURE_SCORES[targetTile.type];
          newScores[gameState.currentPlayer] += score;
        }

        // 이동 처리
        newBoard[to.row][to.col] = movingTile;
        newBoard[from.row][from.col] = {
          type: "EMPTY",
          isRevealed: true,
          owner: "NEUTRAL",
        };
      }

      // 남은 이동 횟수 감소 (마지막 단계에서만)
      const newRemainingMoves = { ...gameState.remainingMoves };
      if (gameState.finalPhase) {
        newRemainingMoves[gameState.currentPlayer]--;
      }

      // 게임 종료 조건 체크
      const isGameOver =
        gameState.finalPhase &&
        newRemainingMoves.P1 === 0 &&
        newRemainingMoves.P2 === 0;

      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        scores: newScores,
        selectedTile: null,
        currentPlayer: prev.currentPlayer === "P1" ? "P2" : "P1",
        remainingMoves: newRemainingMoves,
        gameOver: isGameOver,
      }));
    } else {
      // 잘못된 이동이면 선택 취소
      setGameState((prev) => ({
        ...prev,
        selectedTile: null,
      }));
    }
  };

  return (
    <div
      className={`game-container ${gameState.finalPhase ? "final-phase" : ""}`}
    >
      <div className="game-info">
        <div>
          현재 차례: {gameState.currentPlayer === "P1" ? "인간팀" : "동물팀"}
        </div>
        <div>
          점수 - 인간팀: {gameState.scores.P1} | 동물팀: {gameState.scores.P2}
        </div>
        <div className="turn-info">
          행동을 선택하세요:
          <br />
          1. 타일 열기 (뒤집힌 타일 클릭)
          <br />
          2. 타일 이동하기 (공개된 타일 선택 후 목적지 클릭)
        </div>
        {gameState.gameOver && (
          <div className="game-over">
            게임 종료! 승자:{" "}
            {gameState.scores.P1 > gameState.scores.P2
              ? "인간팀"
              : gameState.scores.P1 < gameState.scores.P2
              ? "동물팀"
              : "무승부"}
          </div>
        )}
        {gameState.finalPhase && (
          <div className="final-phase-message">
            마지막 단계: 탈출 가능!
            <br />
            남은 이동 횟수 - 인간팀: {gameState.remainingMoves.P1} | 동물팀:{" "}
            {gameState.remainingMoves.P2}
          </div>
        )}
      </div>
      <div className="game-board">
        {gameState.board.map((row, i) =>
          row.map((tile, j) => {
            const isGameArea =
              i >= GAME_AREA_START &&
              i < GAME_AREA_START + GAME_AREA_SIZE &&
              j >= GAME_AREA_START &&
              j < GAME_AREA_START + GAME_AREA_SIZE;

            // 탈출구 라인인지 확인
            const isExitLine =
              (i === 0 ||
                i === BOARD_SIZE - 1 ||
                j === 0 ||
                j === BOARD_SIZE - 1) &&
              tile.type !== "EXIT";

            // 사냥 가능 여부 확인
            const isHuntable =
              gameState.selectedTile &&
              tile.isRevealed &&
              canCapture(
                gameState.board[gameState.selectedTile.row][
                  gameState.selectedTile.col
                ],
                tile,
                gameState.selectedTile,
                { row: i, col: j }
              );

            // 이동 가능 여부 확인
            const isMovable =
              gameState.selectedTile &&
              tile.type === "EMPTY" &&
              isValidMove(
                gameState.selectedTile,
                { row: i, col: j },
                gameState.board,
                gameState.currentPlayer,
                gameState
              );

            // 현재 플레이어가 선택할 수 없는 타일인지 확인
            const isDisabled =
              tile.isRevealed &&
              !isHuntable &&
              !isMovable &&
              (isExitLine ||
                (gameState.currentPlayer === "P1" &&
                  ["FOX", "BEAR", "TREE"].includes(tile.type)) ||
                (gameState.currentPlayer === "P2" &&
                  ["HUNTER", "LUMBERJACK", "TREE"].includes(tile.type)) ||
                ["EMPTY", "CABIN"].includes(tile.type));

            // 탈출 가능 여부 확인
            const canEscape =
              gameState.selectedTile &&
              tile.type === "EXIT" &&
              gameState.finalPhase &&
              isValidMove(
                gameState.selectedTile,
                { row: i, col: j },
                gameState.board,
                gameState.currentPlayer,
                gameState
              );

            return (
              <div
                key={`${i}-${j}`}
                className={`tile ${tile.isRevealed ? "revealed" : ""} ${
                  gameState.selectedTile?.row === i &&
                  gameState.selectedTile?.col === j
                    ? "selected"
                    : ""
                }`}
                data-type={tile.type}
                data-outside={!isGameArea && tile.type !== "EXIT"}
                data-exit-line={isExitLine}
                data-disabled={isDisabled}
                data-huntable={isHuntable}
                data-movable={isMovable}
                data-escapable={canEscape}
                onClick={() => handleTileClick(i, j)}
              >
                {tile.isRevealed ? getTileSymbol(tile) : isGameArea ? "?" : ""}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getTileSymbol(tile: Tile): string {
  switch (tile.type) {
    case "HUNTER":
      // 방향에 따른 화살표 추가
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

function getRandomDirection(): Direction {
  const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
  return directions[Math.floor(Math.random() * directions.length)];
}

export default App;
