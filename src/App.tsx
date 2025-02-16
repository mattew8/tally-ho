import { useState } from "react";
import {
  GameState,
  Tile,
  TileType,
  Player,
  Position,
  CAPTURE_SCORES,
  Direction,
} from "./types/game";
import "./App.css";

const BOARD_SIZE = 7;

const createInitialBoard = (): Tile[][] => {
  // 타일 구성 수정
  const tiles: TileType[] = [
    ...Array(8).fill("HUNTER"), // 사냥꾼 8개
    ...Array(2).fill("LUMBERJACK"), // 나무꾼 2개
    ...Array(2).fill("BEAR"), // 곰 2개
    ...Array(6).fill("FOX"), // 여우 6개
    ...Array(8).fill("PHEASANT"), // 꿩 8개
    ...Array(7).fill("DUCK"), // 오리 7개
    ...Array(15).fill("TREE"), // 나무 15개
  ];

  // 타일 섞기
  const shuffledTiles = tiles.sort(() => Math.random() - 0.5);

  const board: Tile[][] = [];
  let tileIndex = 0;

  for (let i = 0; i < BOARD_SIZE; i++) {
    const row: Tile[] = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      // 중앙 칸은 비워둠
      if (
        i === Math.floor(BOARD_SIZE / 2) &&
        j === Math.floor(BOARD_SIZE / 2)
      ) {
        row.push({
          type: "CABIN" as TileType,
          isRevealed: true,
          owner: "NEUTRAL",
        });
      } else {
        const type = shuffledTiles[tileIndex];
        row.push({
          type,
          isRevealed: false,
          owner:
            type === "HUNTER" || type === "LUMBERJACK"
              ? "P1"
              : type === "FOX" || type === "BEAR"
              ? "P2"
              : "NEUTRAL",
          direction: type === "HUNTER" ? getRandomDirection() : undefined,
        });
        tileIndex++;
      }
    }
    board.push(row);
  }

  return board;
};

function isValidMove(
  from: Position,
  to: Position,
  board: Tile[][],
  currentPlayer: Player
): boolean {
  const fromTile = board[from.row][from.col];
  const toTile = board[to.row][to.col];

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

    // 타일을 열면 바로 턴 종료
    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === "P1" ? "P2" : "P1",
    }));
  };

  const handleMove = (row: number, col: number) => {
    if (!gameState.selectedTile) return;

    const from = gameState.selectedTile;
    const to = { row, col };

    if (isValidMove(from, to, gameState.board, gameState.currentPlayer)) {
      const newBoard = [...gameState.board];
      const movingTile = newBoard[from.row][from.col];
      const targetTile = newBoard[to.row][to.col];

      // 포획 처리
      const newScores = { ...gameState.scores };
      if (canCapture(movingTile, targetTile, from, to)) {
        const score = CAPTURE_SCORES[targetTile.type];
        newScores[gameState.currentPlayer] += score;

        newBoard[to.row][to.col] = {
          type: "EMPTY",
          isRevealed: true,
          owner: "NEUTRAL",
        };
      }

      // 이동
      newBoard[to.row][to.col] = movingTile;
      newBoard[from.row][from.col] = {
        type: "EMPTY",
        isRevealed: true,
        owner: "NEUTRAL",
      };

      const isGameOver = checkGameOver(newBoard);

      // 이동 후 턴 종료
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        scores: newScores,
        selectedTile: null,
        currentPlayer: prev.currentPlayer === "P1" ? "P2" : "P1",
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

  // 게임 종료 조건 체크
  const checkGameOver = (board: Tile[][]): boolean => {
    // 모든 타일이 공개되었는지 확인
    const allRevealed = board
      .flat()
      .every((tile) => tile.isRevealed || tile.type === "EMPTY");

    // 이동 가능한 타일이 있는지 확인
    const hasValidMoves = board.some((row, i) =>
      row.some((tile, j) => {
        if (tile.type === "EMPTY" || !tile.isRevealed) return false;
        // 상하좌우 이동 가능 여부 확인
        const directions = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        return directions.some(([dx, dy]) => {
          const newRow = i + dx;
          const newCol = j + dy;
          if (
            newRow >= 0 &&
            newRow < BOARD_SIZE &&
            newCol >= 0 &&
            newCol < BOARD_SIZE
          ) {
            return isValidMove(
              { row: i, col: j },
              { row: newRow, col: newCol },
              board,
              tile.owner as Player
            );
          }
          return false;
        });
      })
    );

    return allRevealed && !hasValidMoves;
  };

  return (
    <div className="game-container">
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
      </div>
      <div className="game-board">
        {gameState.board.flat().map((tile, index) => (
          <div
            key={index}
            className={`tile ${tile.isRevealed ? "revealed" : ""} ${
              gameState.selectedTile &&
              Math.floor(index / BOARD_SIZE) === gameState.selectedTile.row &&
              index % BOARD_SIZE === gameState.selectedTile.col
                ? "selected"
                : ""
            }`}
            data-type={tile.type}
            onClick={() =>
              handleTileClick(
                Math.floor(index / BOARD_SIZE),
                index % BOARD_SIZE
              )
            }
          >
            {tile.isRevealed ? getTileSymbol(tile) : "?"}
          </div>
        ))}
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
  }
}

function getRandomDirection(): Direction {
  const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
  return directions[Math.floor(Math.random() * directions.length)];
}

export default App;
