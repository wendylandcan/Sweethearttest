import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validatePasscode } from "../lib/supabase";
import { useAudio } from "../contexts/AudioContext";

export default function InvitationPage({ onVerified, initialCode = "" }) {
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const { tryPlay } = useAudio();

  useEffect(() => {
    // 当 initialCode 改变时，更新 code
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    // 自动聚焦输入框
    inputRef.current?.focus();
  }, []);

  // 强制应用可爱字体到整个页面
  useEffect(() => {
    document.body.style.fontFamily = "'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', 'Noto Sans SC', sans-serif";
  }, []);

  // 使用 useMemo 固定扑克牌位置，避免每次输入都刷新
  const floatingSymbols = useMemo(() => {
    const suits = ['♠', '♥', '♣', '♦'];
    // 为所有符号使用统一的灰紫色系，深浅不一
    const grayPurpleColors = [
      'rgba(170, 160, 180, OPACITY)', // 浅灰紫
      'rgba(165, 155, 175, OPACITY)', // 中浅灰紫
      'rgba(160, 150, 170, OPACITY)', // 中灰紫
      'rgba(155, 145, 165, OPACITY)'  // 深灰紫
    ];

    return Array.from({ length: 12 }, (_, i) => {
      const suit = suits[i % 4];
      const size = Math.random() * 20 + 15; // 15-35px
      const opacity = Math.random() * 0.03 + 0.01; // 0.01-0.04
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const duration = Math.random() * 30 + 25; // 25-55s
      const delay = Math.random() * 20;

      // 使用灰紫色，不区分红黑
      const colorTemplate = grayPurpleColors[i % 4];
      const color = colorTemplate.replace('OPACITY', opacity.toString());

      return {
        suit,
        style: {
          position: 'absolute',
          top: `${top}%`,
          left: `${left}%`,
          fontSize: `${size}px`,
          color: color, // 直接使用灰紫色
          pointerEvents: 'none',
          animation: `float ${duration}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
          filter: `blur(${Math.random() * 4 + 2}px)`, // 2-6px 增加模糊
          textShadow: `0 0 ${size * 0.15}px currentColor`, // 进一步减少光晕
        }
      };
    });
  }, []); // 空依赖数组，只在组件挂载时计算一次

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 用户点击提交时尝试播放 BGM
    tryPlay();

    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setErrorMessage("请输入考号");
      setError(true);
      setShake(true);

      // 播放失败音效
      const errorAudio = new Audio('/error-sound.wav');
      errorAudio.play().catch(err => console.log('音频播放失败:', err));

      setTimeout(() => setShake(false), 600);
      setTimeout(() => setError(false), 2000);
      return;
    }

    setLoading(true);

    try {
      // 调用 Supabase 验证函数
      const result = await validatePasscode(trimmedCode);

      if (result.valid) {
        // 播放成功音效
        const successAudio = new Audio('/success-sound.wav');
        successAudio.play().catch(err => console.log('音频播放失败:', err));

        // 验证成功：触发心灵之蛋破壳动画，并传递邀请码
        onVerified(trimmedCode);
      } else {
        // 播放失败音效
        const errorAudio = new Audio('/error-sound.wav');
        errorAudio.play().catch(err => console.log('音频播放失败:', err));

        // 验证失败：触发抖动和红色光晕
        setErrorMessage(result.error || "考号无效");
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setTimeout(() => {
          setError(false);
          setErrorMessage("");
        }, 3000);
      }
    } catch (err) {
      console.error("Validation error:", err);

      // 播放失败音效
      const errorAudio = new Audio('/error-sound.wav');
      errorAudio.play().catch(err => console.log('音频播放失败:', err));

      setErrorMessage("网络错误，请稍后重试");
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => {
        setError(false);
        setErrorMessage("");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    // 自动转大写
    setCode(e.target.value.toUpperCase());
  };

  return (
    <div className="invitation-page">
      {/* 背景渐变 */}
      <div className="invitation-bg" />

      {/* 浮动扑克牌花纹 - 使用 useMemo 固定位置 */}
      {floatingSymbols.map((symbol, i) => (
        <span
          key={i}
          style={{
            ...symbol.style,
            WebkitTextFillColor: symbol.style.color,
            MozTextFillColor: symbol.style.color,
            // 使用 filter 强制去色并着色为灰紫色
            filter: `${symbol.style.filter} grayscale(100%) brightness(1.2) sepia(20%) hue-rotate(240deg) saturate(0.3)`,
          }}
        >
          {symbol.suit}
        </span>
      ))}

      {/* 主容器 */}
      <motion.div
        className={`invitation-card ${shake ? 'shake' : ''} ${error ? 'error' : ''}`}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* 标题 */}
        <motion.h1
          className="invitation-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          圣夜学园入学测试已开始
        </motion.h1>

        <motion.p
          className="invitation-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          请输入你的考号
        </motion.p>

        {/* 输入表单 */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="invitation-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="输入考号"
              className="invitation-input"
              maxLength={20}
              autoComplete="off"
              autoCapitalize="characters"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="invitation-button"
            disabled={code.length === 0 || loading}
          >
            <span className="invitation-button-text">
              {loading ? "验证中..." : "进入测验"}
            </span>
            <span className="invitation-button-glow" />
          </button>
        </motion.form>

        {/* 错误提示 */}
        <AnimatePresence>
          {error && errorMessage && (
            <motion.p
              className="invitation-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              ✕ {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>

        {/* 装饰性粒子 */}
        <div className="invitation-particles">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}>✦</span>
          ))}
        </div>
      </motion.div>

      {/* 底部水印 */}
      <motion.div
        className="invitation-watermark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        Project Humpty-Lock · Seiyo Academy
      </motion.div>

      <style jsx>{`
        .invitation-page {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', 'Noto Sans SC', sans-serif;
        }

        .invitation-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1a0b2e 0%, #0f0520 50%, #000000 100%);
          z-index: 0;
        }

        .invitation-card {
          position: relative;
          width: 90%;
          max-width: 480px;
          padding: 48px 32px;
          background: rgba(15, 5, 30, 0.75);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          border: 1px solid rgba(180, 130, 255, 0.2);
          box-shadow:
            0 0 60px rgba(139, 127, 212, 0.3),
            0 0 120px rgba(139, 127, 212, 0.15),
            inset 0 0 80px rgba(180, 130, 255, 0.05);
          z-index: 10;
          animation: breathe 4s ease-in-out infinite;
          transition: all 0.3s ease;
        }

        .invitation-card.error {
          border-color: rgba(255, 80, 120, 0.5);
          box-shadow:
            0 0 60px rgba(255, 80, 120, 0.4),
            0 0 120px rgba(255, 80, 120, 0.2),
            inset 0 0 80px rgba(255, 80, 120, 0.08);
        }

        .invitation-card.shake {
          animation: shake 0.6s ease-in-out;
        }

        @keyframes breathe {
          0%, 100% {
            box-shadow:
              0 0 60px rgba(139, 127, 212, 0.3),
              0 0 120px rgba(139, 127, 212, 0.15),
              inset 0 0 80px rgba(180, 130, 255, 0.05);
          }
          50% {
            box-shadow:
              0 0 80px rgba(139, 127, 212, 0.4),
              0 0 140px rgba(139, 127, 212, 0.2),
              inset 0 0 100px rgba(180, 130, 255, 0.08);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-15px) rotate(60deg);
            opacity: 0.4;
          }
        }

        .invitation-title {
          font-size: clamp(20px, 5vw, 26px);
          font-weight: 300;
          letter-spacing: 0.15em;
          text-align: center;
          color: rgba(230, 220, 255, 0.95);
          margin: 0 0 16px 0;
          text-shadow:
            0 0 20px rgba(180, 130, 255, 0.6),
            0 0 40px rgba(180, 130, 255, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.5);
          line-height: 1.6;
          font-family: 'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', 'Noto Sans SC', sans-serif;
        }

        .invitation-subtitle {
          font-size: 16px;
          font-weight: 300;
          letter-spacing: 0.2em;
          text-align: center;
          color: rgba(200, 180, 230, 0.8);
          margin: 0 0 40px 0;
          text-shadow: 0 0 10px rgba(180, 130, 255, 0.4);
          font-family: 'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', 'Noto Sans SC', sans-serif;
        }

        .invitation-input-wrapper {
          margin-bottom: 24px;
        }

        .invitation-input {
          width: 100%;
          padding: 16px 20px;
          font-size: 18px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-align: center;
          color: rgba(255, 255, 255, 0.95);
          background: rgba(20, 10, 40, 0.6);
          border: 1px solid rgba(180, 130, 255, 0.25);
          border-radius: 16px;
          outline: none;
          transition: all 0.3s ease;
          font-family: 'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', sans-serif;
        }

        .invitation-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .invitation-input::placeholder {
          color: rgba(150, 130, 180, 0.5);
          letter-spacing: 0.1em;
        }

        .invitation-input:focus:not(:disabled) {
          border-color: rgba(180, 130, 255, 0.6);
          box-shadow:
            0 0 30px rgba(180, 130, 255, 0.4),
            0 0 60px rgba(180, 130, 255, 0.2),
            inset 0 0 20px rgba(180, 130, 255, 0.1);
          transform: scale(1.02);
          background: rgba(25, 15, 50, 0.7);
        }

        .invitation-button {
          position: relative;
          width: 100%;
          padding: 16px 32px;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.25em;
          color: rgba(255, 255, 255, 0.9);
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.4s ease;
          font-family: 'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', sans-serif;
        }

        .invitation-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .invitation-button:not(:disabled):hover {
          border-color: rgba(180, 130, 255, 0.8);
          background: linear-gradient(135deg, rgba(139, 127, 212, 0.3) 0%, rgba(180, 130, 255, 0.2) 100%);
          box-shadow:
            0 0 30px rgba(180, 130, 255, 0.5),
            0 0 60px rgba(180, 130, 255, 0.3),
            inset 0 0 40px rgba(180, 130, 255, 0.15);
          transform: translateY(-2px);
        }

        .invitation-button:not(:disabled):active {
          transform: translateY(0);
        }

        .invitation-button-text {
          position: relative;
          z-index: 2;
        }

        .invitation-button-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(180, 130, 255, 0.4) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .invitation-button:not(:disabled):hover .invitation-button-glow {
          opacity: 1;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        .invitation-error {
          margin-top: 16px;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-align: center;
          color: rgba(255, 120, 150, 0.95);
          text-shadow: 0 0 10px rgba(255, 80, 120, 0.6);
          font-family: 'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', 'Noto Sans SC', sans-serif;
        }

        .invitation-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          border-radius: 32px;
        }

        .particle {
          position: absolute;
          top: -20px;
          font-size: 12px;
          color: rgba(180, 130, 255, 0.6);
          animation: particleFall 3s ease-in infinite;
          text-shadow: 0 0 8px currentColor;
        }

        @keyframes particleFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(360deg);
            opacity: 0;
          }
        }

        .invitation-watermark {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.15em;
          color: rgba(180, 150, 200, 0.4);
          text-shadow: 0 0 8px rgba(180, 130, 255, 0.3);
          font-family: 'Fredoka', 'Quicksand', 'Nunito', sans-serif;
          z-index: 5;
          text-align: center;
          width: 90%;
          max-width: 400px;
        }

        /* 移动端适配 */
        @media (max-width: 640px) {
          .invitation-card {
            padding: 40px 24px;
            width: 92%;
          }

          .invitation-title {
            font-size: 20px;
            margin-bottom: 12px;
          }

          .invitation-subtitle {
            font-size: 14px;
            margin-bottom: 32px;
          }

          .invitation-input {
            font-size: 16px;
            padding: 14px 16px;
          }

          .invitation-button {
            font-size: 16px;
            padding: 14px 28px;
          }

          .invitation-watermark {
            font-size: 10px;
            letter-spacing: 0.1em;
            bottom: 20px;
            width: 85%;
          }
        }

        /* 键盘弹出时保持居中 */
        @media (max-height: 600px) {
          .invitation-page {
            align-items: flex-start;
            padding-top: 40px;
          }

          .invitation-card {
            margin-bottom: 40px;
          }
        }
      `}</style>
    </div>
  );
}
