import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QUESTIONS } from "../data/questions";
import { calculateScores, findMatch } from "../utils/algorithm";
import { useAudio } from "../contexts/AudioContext";

const SUITS = ["♣", "♥", "♠", "♦"];
const SUIT_COLORS = ["#a8d8a8", "#ff9fb2", "#c0c0c0", "#ffd700"];
const QUESTIONS_PER_SUIT = 8; // 32 / 4

export default function QuizPage({ onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnsweredFirstHighPressure, setHasAnsweredFirstHighPressure] = useState(false);
  const { playSFX } = useAudio(); // 获取音效播放方法

  const current = QUESTIONS[currentIdx];
  const isHighPressure = current?.isHighPressure;
  const progress = currentIdx / QUESTIONS.length;

  // High pressure intensity (0 = Q28, 1 = Q32)
  const hpIntensity = isHighPressure
    ? (currentIdx - 27) / 4
    : 0;

  const handleSelect = (optionIdx) => {
    if (isAnimating || selected !== null) return;

    // 使用统一的音效播放方法（会自动降低 BGM 音量）
    playSFX('/option-sound.wav');

    setSelected(optionIdx);
    setDirection(1);
    setIsAnimating(true);

    // 检测是否是第一道高压题
    if (isHighPressure && !hasAnsweredFirstHighPressure) {
      setHasAnsweredFirstHighPressure(true);
    }

    const newAnswers = [...answers, QUESTIONS[currentIdx].options[optionIdx]];

    // Quicker handoff to next question for smoother flow
    setTimeout(() => {
      if (currentIdx < QUESTIONS.length - 1) {
        setAnswers(newAnswers);
        setCurrentIdx((i) => i + 1);
        setSelected(null);
        setIsAnimating(false);
      } else {
        const scores = calculateScores(newAnswers);
        const match = findMatch(scores);
        onComplete({ scores, match });
      }
    }, 190);
  };

  // Background interpolation for high pressure
  const bgStyle = isHighPressure
    ? {
        background: `linear-gradient(135deg,
          rgba(8, 4, 20, ${0.85 + hpIntensity * 0.1}) 0%,
          rgba(15, 5, 35, ${0.9 + hpIntensity * 0.05}) 100%)`,
      }
    : {};

  const cardVariants = {
    enter: (dir) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      rotateY: dir > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: (dir) => ({
      x: dir > 0 ? "-120%" : "120%",
      opacity: 0,
      rotateY: dir > 0 ? -20 : 20,
      rotate: dir > 0 ? -6 : 6,
      transition: { duration: 0.18, ease: "easeIn" },
    }),
  };

  return (
    <div className="quiz-page" style={bgStyle}>
      {/* Stars overlay for high pressure */}
      {isHighPressure && (
        <div
          className="stars-overlay"
          style={{ opacity: 0.3 + hpIntensity * 0.5 }}
        />
      )}

      {/* Suit progress indicator */}
      <div className="suit-progress">
        {SUITS.map((suit, si) => {
          const startQ = si * QUESTIONS_PER_SUIT;
          const endQ = startQ + QUESTIONS_PER_SUIT;
          return (
            <div key={suit} className="suit-group">
              <span
                className="suit-symbol"
                style={{
                  color:
                    currentIdx >= endQ
                      ? SUIT_COLORS[si]
                      : currentIdx >= startQ
                      ? SUIT_COLORS[si]
                      : "rgba(255,255,255,0.2)",
                  opacity: currentIdx >= startQ ? 1 : 0.3,
                  textShadow:
                    currentIdx >= startQ
                      ? `0 0 10px ${SUIT_COLORS[si]}`
                      : "none",
                }}
              >
                {suit}
              </span>
              <div className="suit-pips">
                {Array.from({ length: QUESTIONS_PER_SUIT }).map((_, pi) => {
                  const qIdx = startQ + pi;
                  const lit = currentIdx > qIdx;
                  const active = currentIdx === qIdx;
                  return (
                    <div
                      key={pi}
                      className="pip"
                      style={{
                        background: lit
                          ? SUIT_COLORS[si]
                          : active
                          ? SUIT_COLORS[si]
                          : "rgba(255,255,255,0.12)",
                        opacity: lit ? 0.9 : active ? 1 : 0.4,
                        transform: active ? "scale(1.4)" : "scale(1)",
                        boxShadow: active
                          ? `0 0 6px ${SUIT_COLORS[si]}`
                          : "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Question card */}
      <div className="card-stage">
        {/* 卡片容器 - 包含气泡和卡片 */}
        <div className="card-wrapper">
          {/* "请相信你的第一直觉" 气泡 - 吸附在卡片上方 */}
          <AnimatePresence>
            {isHighPressure && !hasAnsweredFirstHighPressure && (
              <motion.div
                className="intuition-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.3,
                  exit: { duration: 0.5, ease: "easeOut" }
                }}
              >
                <div className="intuition-icon">✨</div>
                <div className="intuition-text">请相信你的第一直觉</div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIdx}
              className={`question-card ${isHighPressure ? "hp-card" : ""}`}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{
                borderColor: isHighPressure
                  ? `rgba(139, 127, 212, ${0.3 + hpIntensity * 0.4})`
                  : undefined,
                boxShadow: isHighPressure
                  ? `0 0 ${20 + hpIntensity * 30}px rgba(139,127,212,${0.1 + hpIntensity * 0.2})`
                  : undefined,
              }}
            >
              <div className="question-card-header">
              <div className="question-card-header-left">
                {currentIdx > 0 ? (
                  <button
                    type="button"
                    className="back-btn back-btn-in-card"
                    style={{
                      opacity: selected !== null ? 0.6 : 1,
                      pointerEvents: selected !== null ? "none" : "auto",
                    }}
                    onClick={() => {
                      if (isAnimating || selected !== null) return;
                      setDirection(-1);
                      setCurrentIdx((i) => i - 1);
                      setAnswers((a) => a.slice(0, -1));
                    }}
                  >
                    ← 上一题
                  </button>
                ) : (
                  <span />
                )}
              </div>
              <div className="q-number">
                {isHighPressure ? (
                  <span className="hp-label">⚡ 高压 · Q{current.id}<span className="q-total">/{QUESTIONS.length}</span></span>
                ) : (
                  <span>Q{current.id}<span className="q-total">/{QUESTIONS.length}</span></span>
                )}
              </div>
            </div>

            <h2 className="q-text">{current.text}</h2>

            <div className="options-list">
              {current.options.map((opt, oi) => (
                <motion.button
                  key={oi}
                  className={`option-btn ${
                    selected === oi ? "option-selected" : ""
                  } ${isHighPressure ? "hp-option" : ""}`}
                  onClick={() => handleSelect(oi)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: oi * 0.08 }}
                  disabled={selected !== null}
                >
                  <span className="option-letter">
                    {["A", "B", "C"][oi]}
                  </span>
                  <span className="option-text">{opt.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrap">
        <div
          className="progress-bar-fill"
          style={{
            width: `${progress * 100}%`,
            background: isHighPressure
              ? "linear-gradient(90deg, #8B7FD4, #C9A0E8)"
              : "linear-gradient(90deg, #7B5AB5, #A78BFA)",
          }}
        />
      </div>
    </div>
  );
}
