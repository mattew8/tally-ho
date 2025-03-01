import { useState, useEffect } from "react";
import "./App.css";
import {
  GameState,
  Position,
  CAPTURE_SCORES,
  ESCAPE_SCORES,
} from "./types/game";
import { RulesModal } from "./components/RulesModal";
import {
  createInitialBoard,
  BOARD_SIZE,
  GAME_AREA_START,
  GAME_AREA_SIZE,
  isValidMove,
  canCapture,
  getTileKoreanName,
  getTileSymbol,
} from "./service/game";
import {
  findBestCaptureMove,
  findBestEscapeMove,
  findUnrevealedTiles,
  findBestMove,
} from "./service/ai";
import {
  RoundStartModal,
  RoundEndModal,
  GameEndModal,
} from "./components/GameModals";

function App() {
  const [showRules, setShowRules] = useState(() => {
    const hasSeenRules = localStorage.getItem("hasSeenRules");
    return !hasSeenRules;
  });

  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    scores: { HUMANS: 0, ANIMALS: 0 },
    selectedTile: null,
    gameOver: false,
    finalPhase: false,
    remainingMoves: { HUMANS: 5, ANIMALS: 5 },
    isAITurn: true,
    logs: [],
    round: 1,
    roundScores: {
      round1: { HUMANS: 0, ANIMALS: 0 },
      round2: { HUMANS: 0, ANIMALS: 0 },
    },
    isUserHuman: true,
  });

  const [lastControlledPosition, setLastControlledPosition] =
    useState<Position | null>(null);

  const [showRoundStart, setShowRoundStart] = useState(true);
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [showGameEnd, setShowGameEnd] = useState(false);
  const [finalScores, setFinalScores] = useState({ user: 0, ai: 0 });
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(true);

  useEffect(() => {
    if (gameState.isAITurn && !gameState.gameOver) {
      const timer = setTimeout(() => {
        handleAITurn();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState.isAITurn, gameState.gameOver]);

  const handleAITurn = () => {
    const isAIHuman = !gameState.isUserHuman;
    const bestAttack = findBestCaptureMove(gameState, isAIHuman);
    if (bestAttack) {
      handleMove(bestAttack.from, bestAttack.to);
      return;
    }

    const bestEscape = findBestEscapeMove(gameState, isAIHuman);
    if (bestEscape) {
      handleMove(bestEscape.from, bestEscape.to);
      return;
    }

    const unrevealedTiles = findUnrevealedTiles(gameState.board);
    if (unrevealedTiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * unrevealedTiles.length);
      const position = unrevealedTiles[randomIndex];
      handleReveal(position.row, position.col);
      setGameState((prev) => ({ ...prev, isAITurn: false }));
      return;
    }

    const bestMove = findBestMove(gameState, isAIHuman);
    if (bestMove) {
      handleMove(bestMove.from, bestMove.to);
      return;
    }

    setGameState((prev) => ({ ...prev, isAITurn: false }));
  };

  const handleTileClick = (row: number, col: number) => {
    if (gameState.gameOver || gameState.isAITurn) return;

    const tile = gameState.board[row][col];
    const userTeam = gameState.isUserHuman ? "HUMANS" : "ANIMALS";

    if (gameState.selectedTile) {
      if (
        (gameState.selectedTile.row === row &&
          gameState.selectedTile.col === col) ||
        !isValidMove(
          gameState.selectedTile,
          { row, col },
          gameState.board,
          userTeam,
          gameState
        )
      ) {
        setGameState((prev) => ({ ...prev, selectedTile: null }));
        return;
      }

      handleMove(gameState.selectedTile, { row, col });
      return;
    }

    if (tile.isRevealed) {
      if (
        tile.owner === userTeam ||
        (tile.owner === "NEUTRAL" && ["DUCK", "PHEASANT"].includes(tile.type))
      ) {
        setGameState((prev) => ({ ...prev, selectedTile: { row, col } }));
      }
      return;
    }

    handleReveal(row, col);
    setGameState((prev) => ({ ...prev, isAITurn: true }));
  };

  const handleReveal = (row: number, col: number) => {
    if (gameState.board[row][col].isRevealed) return;

    const newBoard = [...gameState.board];
    const tile = newBoard[row][col];
    newBoard[row][col] = { ...tile, isRevealed: true };

    const shouldStartFinalPhase = newBoard
      .flat()
      .every(
        (tile) =>
          tile.isRevealed || tile.type === "EXIT" || tile.type === "EMPTY"
      );

    const logMessage = `${
      gameState.isAITurn ? "AI" : "유저"
    }가 ${getTileKoreanName(tile.type)} 타일을 열었습니다.`;

    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      finalPhase: shouldStartFinalPhase,
      isAITurn: true,
      logs: [logMessage, ...prev.logs],
    }));

    setLastControlledPosition({ row, col });
  };

  const handleMove = (from: Position, to: Position) => {
    const currentTeam = gameState.isAITurn
      ? gameState.isUserHuman
        ? "ANIMALS"
        : "HUMANS"
      : gameState.isUserHuman
      ? "HUMANS"
      : "ANIMALS";

    if (!isValidMove(from, to, gameState.board, currentTeam, gameState)) return;

    const newBoard = [...gameState.board];
    const movingTile = newBoard[from.row][from.col];
    const targetTile = newBoard[to.row][to.col];

    if (targetTile.type === "EXIT") {
      newBoard[from.row][from.col] = {
        type: "EMPTY",
        isRevealed: true,
        owner: "NEUTRAL",
      };
    } else {
      newBoard[to.row][to.col] = movingTile;
      newBoard[from.row][from.col] = {
        type: "EMPTY",
        isRevealed: true,
        owner: "NEUTRAL",
      };
    }

    const newScores = { ...gameState.scores };
    let logMessage = "";

    if (gameState.finalPhase && targetTile.type === "EXIT") {
      if (
        (currentTeam === "HUMANS" &&
          ["HUNTER", "LUMBERJACK"].includes(movingTile.type)) ||
        (currentTeam === "ANIMALS" && ["FOX", "BEAR"].includes(movingTile.type))
      ) {
        newScores[currentTeam] += ESCAPE_SCORES[movingTile.type] || 0;
        logMessage = `${
          gameState.isAITurn ? "AI" : "유저"
        }의 ${getTileKoreanName(movingTile.type)}이(가) 탈출했습니다!`;
      }
    } else if (canCapture(movingTile, targetTile, from, to)) {
      newScores[currentTeam] += CAPTURE_SCORES[targetTile.type] || 0;
      logMessage = `${gameState.isAITurn ? "AI" : "유저"}의 ${getTileKoreanName(
        movingTile.type
      )}이(가) ${getTileKoreanName(targetTile.type)}을(를) 잡았습니다!`;
    } else {
      logMessage = `${gameState.isAITurn ? "AI" : "유저"}의 ${getTileKoreanName(
        movingTile.type
      )}이(가) 이동했습니다.`;
    }

    const newRemainingMoves = { ...gameState.remainingMoves };
    if (gameState.finalPhase) {
      newRemainingMoves[currentTeam]--;
    }

    const isRoundOver =
      gameState.finalPhase &&
      newRemainingMoves.HUMANS === 0 &&
      newRemainingMoves.ANIMALS === 0;

    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      scores: newScores,
      selectedTile: null,
      remainingMoves: newRemainingMoves,
      isAITurn: !isRoundOver && !prev.isAITurn,
      logs: [logMessage, ...prev.logs],
    }));

    setLastControlledPosition(to);

    if (isRoundOver) {
      handleRoundEnd();
    }
  };

  const handleRoundEnd = () => {
    const currentRound = gameState.round;
    const currentScores = { ...gameState.scores };

    setGameState((prev) => ({
      ...prev,
      roundScores: {
        ...prev.roundScores,
        [`round${currentRound}`]: currentScores,
      },
    }));

    if (currentRound === 2) {
      const finalScores = {
        user: 0,
        ai: 0,
      };

      finalScores.user += gameState.roundScores.round1.HUMANS;
      finalScores.ai += gameState.roundScores.round1.ANIMALS;
      finalScores.user += gameState.roundScores.round2.ANIMALS;
      finalScores.ai += gameState.roundScores.round2.HUMANS;

      setFinalScores(finalScores);
      setShowGameEnd(true);
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        logs: [
          `게임 종료! 최종 점수 - 유저: ${finalScores.user}, AI: ${finalScores.ai}`,
          `승자: ${
            finalScores.user > finalScores.ai
              ? "유저"
              : finalScores.user < finalScores.ai
              ? "AI"
              : "무승부"
          }`,
          ...prev.logs,
        ],
      }));
    } else {
      setShowRoundEnd(true);
    }
  };

  const handleRoundEndClose = () => {
    setShowRoundEnd(false);
    setShowRoundStart(true);
    setGameState((prev) => ({
      ...prev,
      board: createInitialBoard(),
      scores: { HUMANS: 0, ANIMALS: 0 },
      selectedTile: null,
      gameOver: false,
      finalPhase: false,
      remainingMoves: { HUMANS: 5, ANIMALS: 5 },
      isAITurn: false,
      round: 2,
      isUserHuman: false,
      logs: [`라운드 ${prev.round} 종료! 다음 라운드 시작`, ...prev.logs],
    }));
  };

  const handleCloseRules = () => {
    localStorage.setItem("hasSeenRules", "true");
    setShowRules(false);
  };

  const resetGame = () => {
    setShowGameEnd(false);
    setShowRoundStart(true);
    setGameState({
      board: createInitialBoard(),
      scores: { HUMANS: 0, ANIMALS: 0 },
      selectedTile: null,
      gameOver: false,
      finalPhase: false,
      remainingMoves: { HUMANS: 5, ANIMALS: 5 },
      isAITurn: true,
      logs: [],
      round: 1,
      roundScores: {
        round1: { HUMANS: 0, ANIMALS: 0 },
        round2: { HUMANS: 0, ANIMALS: 0 },
      },
      isUserHuman: false,
    });
    setLastControlledPosition(null);
  };

  return (
    <>
      {showRules && <RulesModal onClose={handleCloseRules} />}
      {showRoundStart && (
        <RoundStartModal
          round={gameState.round}
          isUserHuman={gameState.isUserHuman}
          onClose={() => setShowRoundStart(false)}
        />
      )}
      {showRoundEnd && (
        <RoundEndModal
          scores={gameState.scores}
          onClose={handleRoundEndClose}
        />
      )}
      {showGameEnd && (
        <GameEndModal finalScores={finalScores} onClose={resetGame} />
      )}
      <div
        className={`game-container ${
          gameState.finalPhase ? "final-phase" : ""
        }`}
        data-ai-turn={gameState.isAITurn}
      >
        <div className={`game-info ${isInfoCollapsed ? "collapsed" : ""}`}>
          <div className="info-header">
            <h2>게임 정보</h2>
            <button
              className="collapse-button"
              onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}
            >
              {isInfoCollapsed ? "펼치기" : "접기"}
            </button>
          </div>

          <div className="always-visible-info">
            <div className="game-progress">
              <p>라운드: {gameState.round}/2</p>
              <p>
                현재 차례:{" "}
                <span className="team-highlight">
                  {gameState.isAITurn ? "AI" : "유저"}
                </span>{" "}
                (
                {gameState.isUserHuman
                  ? gameState.isAITurn
                    ? "동물팀"
                    : "인간팀"
                  : gameState.isAITurn
                  ? "인간팀"
                  : "동물팀"}
                )
              </p>

              {gameState.finalPhase && (
                <div className="remaining-moves">
                  <p className="phase-title">🎯 마지막 단계: 탈출!</p>
                  <p>남은 이동 - 인간팀: {gameState.remainingMoves.HUMANS}</p>
                  <p>남은 이동 - 동물팀: {gameState.remainingMoves.ANIMALS}</p>
                </div>
              )}
            </div>
          </div>

          <div className="collapsible-content">
            <div className="info-section">
              <h3>진영 정보</h3>
              <p>
                인간팀:{" "}
                <span className="team-highlight">
                  {gameState.isUserHuman ? "유저" : "AI"}
                </span>
              </p>
              <p>
                동물팀:{" "}
                <span className="team-highlight">
                  {gameState.isUserHuman ? "AI" : "유저"}
                </span>
              </p>
            </div>

            <div className="info-section">
              <h3>현재 라운드 점수</h3>
              <p>인간팀: {gameState.scores.HUMANS}</p>
              <p>동물팀: {gameState.scores.ANIMALS}</p>
            </div>

            {gameState.round === 2 && (
              <div className="info-section">
                <h3>1라운드 결과</h3>
                <p>
                  유저:{" "}
                  {
                    gameState.roundScores.round1[
                      gameState.isUserHuman ? "HUMANS" : "ANIMALS"
                    ]
                  }
                </p>
                <p>
                  AI:{" "}
                  {
                    gameState.roundScores.round1[
                      gameState.isUserHuman ? "ANIMALS" : "HUMANS"
                    ]
                  }
                </p>
              </div>
            )}

            <button className="rules-button" onClick={() => setShowRules(true)}>
              게임 설명서 보기
            </button>
          </div>

          <div className="game-logs">
            <h3>게임 로그</h3>
            <ul>
              {gameState.logs.map((log, index) => (
                <li key={index}>
                  <span className="log-content">{log}</span>
                  <span className="log-number">
                    {` #${gameState.logs.length - index}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="game-board">
          {gameState.board.map((row, i) =>
            row.map((tile, j) => {
              const isGameArea =
                i >= GAME_AREA_START &&
                i < GAME_AREA_START + GAME_AREA_SIZE &&
                j >= GAME_AREA_START &&
                j < GAME_AREA_START + GAME_AREA_SIZE;

              const isExitLine =
                (i === 0 ||
                  i === BOARD_SIZE - 1 ||
                  j === 0 ||
                  j === BOARD_SIZE - 1) &&
                tile.type !== "EXIT";

              const userTeam = gameState.isUserHuman ? "HUMANS" : "ANIMALS";

              const isMovable =
                gameState.selectedTile &&
                isValidMove(
                  gameState.selectedTile,
                  { row: i, col: j },
                  gameState.board,
                  userTeam,
                  gameState
                );

              const isHuntable =
                gameState.selectedTile &&
                tile.isRevealed &&
                isMovable &&
                canCapture(
                  gameState.board[gameState.selectedTile.row][
                    gameState.selectedTile.col
                  ],
                  tile,
                  gameState.selectedTile,
                  { row: i, col: j }
                );

              const isDisabled =
                tile.isRevealed &&
                !isHuntable &&
                !isMovable &&
                (isExitLine ||
                  (gameState.isAITurn &&
                    (gameState.isUserHuman
                      ? ["HUNTER", "LUMBERJACK"].includes(tile.type)
                      : ["FOX", "BEAR"].includes(tile.type))) ||
                  ["EMPTY", "CABIN"].includes(tile.type));

              const canEscape =
                gameState.selectedTile &&
                tile.type === "EXIT" &&
                gameState.finalPhase &&
                isValidMove(
                  gameState.selectedTile,
                  { row: i, col: j },
                  gameState.board,
                  userTeam,
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
                  data-last-controlled={
                    lastControlledPosition?.row === i &&
                    lastControlledPosition?.col === j
                      ? "true"
                      : "false"
                  }
                  onClick={() => handleTileClick(i, j)}
                >
                  {tile.isRevealed
                    ? getTileSymbol(tile)
                    : isGameArea
                    ? "?"
                    : ""}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export default App;
