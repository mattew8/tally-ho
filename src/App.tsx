import { useState } from "react";
import { GameState, Tile, TileType } from "./types/game";
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
          type: "EMPTY" as TileType,
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
        });
        tileIndex++;
      }
    }
    board.push(row);
  }

  return board;
};

function App() {
  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    currentPlayer: "P1",
    scores: { P1: 0, P2: 0 },
  });

  const handleTileClick = (row: number, col: number) => {
    if (gameState.board[row][col].isRevealed) return;

    const newBoard = [...gameState.board];
    newBoard[row][col] = {
      ...newBoard[row][col],
      isRevealed: true,
    };

    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === "P1" ? "P2" : "P1",
    }));
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
      </div>
      <div className="game-board">
        {gameState.board.flat().map((tile, index) => (
          <div
            key={index}
            className={`tile ${tile.isRevealed ? "revealed" : ""}`}
            data-type={tile.type}
            onClick={() =>
              handleTileClick(
                Math.floor(index / BOARD_SIZE),
                index % BOARD_SIZE
              )
            }
          >
            {tile.isRevealed ? getTileSymbol(tile.type) : "?"}
          </div>
        ))}
      </div>
    </div>
  );
}

function getTileSymbol(type: TileType): string {
  switch (type) {
    case "HUNTER":
      return "🏹";
    case "LUMBERJACK":
      return "🌲";
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
    case "EMPTY":
      return " ";
  }
}

export default App;
