import React from "react";
import "./GameModals.css";

interface ModalProps {
  onClose: () => void;
}

interface RoundStartModalProps extends ModalProps {
  round: 1 | 2;
  isUserHuman: boolean;
}

interface RoundEndModalProps extends ModalProps {
  scores: {
    HUMANS: number;
    ANIMALS: number;
  };
}

interface GameEndModalProps extends ModalProps {
  finalScores: {
    user: number;
    ai: number;
  };
}

export const RoundStartModal: React.FC<RoundStartModalProps> = ({
  round,
  isUserHuman,
  onClose,
}) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>라운드 {round} 시작!</h2>
      <div className="team-info">
        <p>
          <strong>유저</strong>: {isUserHuman ? "인간팀 🏹" : "동물팀 🦊"}
        </p>
        <p>
          <strong>AI</strong>: {isUserHuman ? "동물팀 🦊" : "인간팀 🏹"}
        </p>
      </div>
      <p className="team-description">
        {isUserHuman ? (
          <>
            인간팀은 <strong>사냥꾼</strong>과 <strong>나무꾼</strong>을
            조종합니다.
            <br />
            동물을 사냥하거나 나무를 베어 점수를 얻을 수 있습니다.
          </>
        ) : (
          <>
            동물팀은 <strong>곰</strong>과 <strong>여우</strong>를 조종합니다.
            <br />
            사냥꾼과 나무꾼을 공격하거나 오리와 꿩을 사냥해 점수를 얻을 수
            있습니다.
          </>
        )}
      </p>
      <button className="modal-button" onClick={onClose}>
        게임 시작!
      </button>
    </div>
  </div>
);

export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  scores,
  onClose,
}) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>라운드 종료!</h2>
      <div className="score-info">
        <p>
          인간팀 점수: <strong>{scores.HUMANS}</strong>
        </p>
        <p>
          동물팀 점수: <strong>{scores.ANIMALS}</strong>
        </p>
      </div>
      <p className="round-result">
        {scores.HUMANS > scores.ANIMALS
          ? "인간팀 승리! 🏹"
          : scores.HUMANS < scores.ANIMALS
          ? "동물팀 승리! 🦊"
          : "무승부!"}
      </p>
      <button className="modal-button" onClick={onClose}>
        다음 라운드 시작
      </button>
    </div>
  </div>
);

export const GameEndModal: React.FC<GameEndModalProps> = ({
  finalScores,
  onClose,
}) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>게임 종료!</h2>
      <div className="final-score-info">
        <p>
          유저 최종 점수: <strong>{finalScores.user}</strong>
        </p>
        <p>
          AI 최종 점수: <strong>{finalScores.ai}</strong>
        </p>
      </div>
      <p className="final-result">
        {finalScores.user > finalScores.ai
          ? "축하합니다! 유저 승리! 🎉"
          : finalScores.user < finalScores.ai
          ? "아쉽네요! AI 승리! 🤖"
          : "무승부! 👏"}
      </p>
      <button className="modal-button" onClick={onClose}>
        새 게임 시작
      </button>
    </div>
  </div>
);
