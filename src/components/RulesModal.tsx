import "./RulesModal.css";

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
        <h1 className="modal-title">Tally-Ho! 게임 설명서</h1>
        <div className="modal-content">
          <div className="rules-section">
            <h2>게임 소개</h2>
            <p>
              Tally-Ho는 인간팀과 동물팀이 대결하는 전략 보드게임입니다.
              인간팀(사냥꾼, 나무꾼)과 동물팀(여우, 곰)이 서로를 사냥하며 점수를
              얻습니다.
            </p>
          </div>

          <div className="rules-section">
            <h2>게임 진행</h2>
            <p>각 턴마다 플레이어는 다음 중 하나의 행동을 선택합니다:</p>
            <ul>
              <li>뒤집힌 타일 공개하기</li>
              <li>자신의 타일을 이동하여 상대방 사냥하기</li>
            </ul>
          </div>

          <div className="rules-section">
            <h2>진영 설명</h2>
            <div className="team-section">
              <h3>🤠 인간팀</h3>
              <ul>
                <li>
                  🏹 사냥꾼: 곰, 여우, 오리, 꿩을 사냥할 수 있습니다. 총구가
                  가리키는 방향의 타일만 사냥 가능합니다.
                </li>
                <li>👨‍🌾 나무꾼: 나무를 제거할 수 있습니다.</li>
              </ul>
            </div>
            <div className="team-section">
              <h3>🦁 동물팀</h3>
              <ul>
                <li>🦊 여우: 오리와 꿩을 사냥할 수 있습니다.</li>
                <li>🐻 곰: 사냥꾼과 나무꾼을 사냥할 수 있습니다.</li>
              </ul>
            </div>
            <div className="team-section">
              <h3>⚪ 중립</h3>
              <ul>
                <li>🦆 오리, 🐔 꿩: 양 팀 모두 이동시킬 수 있습니다.</li>
                <li>
                  🌲 나무: 나무꾼이 제거할 수 있습니다. 이동할 수 없습니다.
                </li>
                <li>🏠 오두막: 게임 중앙에 위치한 이동 불가능한 타일입니다.</li>
              </ul>
            </div>
          </div>

          <div className="rules-section">
            <h2>이동과 사냥 규칙</h2>
            <div className="rules-subsection">
              <h3>이동 규칙</h3>
              <ul>
                <li>
                  긴 이동: 사냥꾼, 여우, 오리, 꿩은 직선으로 여러 칸 이동할 수
                  있습니다.
                </li>
                <li>
                  짧은 이동: 곰과 나무꾼은 상하좌우 한 칸씩만 이동할 수
                  있습니다.
                </li>
                <li>모든 이동은 상하좌우 방향으로만 가능합니다.</li>
                <li>다른 타일을 뛰어넘을 수 없습니다.</li>
              </ul>
            </div>
            <div className="rules-subsection">
              <h3>사냥 규칙</h3>
              <ul>
                <li>
                  자기 진영의 타일을 움직여, 다른 타일을 사냥할 수 있습니다.
                </li>
                <li>
                  사냥 당한 타일은 사라지며, 해당 타일의 점수를 획득합니다.
                  (점수표 참고)
                </li>
                <li>
                  사냥은 이동과 동시에 이루어지며, 사냥한 타일이 있던 자리로
                  이동합니다.
                </li>
              </ul>
            </div>
          </div>

          <div className="rules-section">
            <h2>마지막 단계</h2>
            <p>모든 타일이 공개되면 마지막 단계가 시작됩니다:</p>
            <ul>
              <li>각 팀은 5번의 이동 기회를 가집니다.</li>
              <li>
                🚪 탈출구로 자신의 타일을 이동시켜 추가 점수를 얻을 수 있습니다.
              </li>
              <li>모든 이동 기회를 사용하면 게임이 종료됩니다.</li>
            </ul>
          </div>

          <div className="rules-section">
            <h2>점수표</h2>
            <div className="score-section">
              <h3>🎯 사냥 점수</h3>
              <div className="score-subsection">
                <h4>🏹 사냥꾼</h4>
                <ul>
                  <li>🐻 곰: 10점</li>
                  <li>🦊 여우: 5점</li>
                  <li>🐔 꿩: 3점</li>
                  <li>🦆 오리: 2점</li>
                </ul>
              </div>
              <div className="score-subsection">
                <h4>🐻 곰</h4>
                <ul>
                  <li>🏹 사냥꾼: 5점</li>
                  <li>👨‍🌾 나무꾼: 5점</li>
                </ul>
              </div>
              <div className="score-subsection">
                <h4>🦊 여우</h4>
                <ul>
                  <li>🐔 꿩: 3점</li>
                  <li>🦆 오리: 2점</li>
                </ul>
              </div>
              <div className="score-subsection">
                <h4>👨‍🌾 나무꾼</h4>
                <ul>
                  <li>🌲 나무: 2점</li>
                </ul>
              </div>
            </div>
            <div className="score-section">
              <h3>🚪 탈출 점수</h3>
              <ul>
                <li>🐻 곰 탈출: 10점</li>
                <li>🏹 사냥꾼 탈출: 5점</li>
                <li>🦊 여우 탈출: 5점</li>
                <li>👨‍🌾 나무꾼 탈출: 5점</li>
              </ul>
            </div>
          </div>
        </div>
        <button className="start-button" onClick={onClose}>
          게임 시작!
        </button>
      </div>
    </div>
  );
}
