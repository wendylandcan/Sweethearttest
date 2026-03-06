import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { QUESTIONS } from "../data/questions";

export default function PreloadingPage({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("请稍后，考官正在布置考场中");

  // 生成浮动扑克牌 - 与其他页面风格一致
  const floatingSymbols = useMemo(() => {
    const suits = ['♠', '♥', '♣', '♦'];
    const grayPurpleColors = [
      'rgba(170, 160, 180, OPACITY)',
      'rgba(165, 155, 175, OPACITY)',
      'rgba(160, 150, 170, OPACITY)',
      'rgba(155, 145, 165, OPACITY)'
    ];

    return Array.from({ length: 20 }, (_, i) => {
      const suit = suits[i % 4];
      const size = Math.random() * 20 + 15;
      const opacity = Math.random() * 0.03 + 0.01;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const duration = Math.random() * 30 + 25;
      const delay = Math.random() * 20;
      const blurAmount = Math.random() * 4 + 2;

      const colorTemplate = grayPurpleColors[i % 4];
      const color = colorTemplate.replace('OPACITY', opacity.toString());

      return {
        suit,
        blurAmount,
        style: {
          position: 'absolute',
          top: `${top}%`,
          left: `${left}%`,
          fontSize: `${size}px`,
          color: color,
          pointerEvents: 'none',
          animation: `float ${duration}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
          textShadow: `0 0 ${size * 0.15}px currentColor`,
        }
      };
    });
  }, []);

  useEffect(() => {
    const loadResources = async () => {
      const totalSteps = 100;
      let currentStep = 0;

      // 预加载音频
      const audioFiles = [
        '/bgm.mp3',
        '/option-sound.wav',
        '/error-sound.wav',
        '/success-sound.wav',
        '/start-sound.wav',
        '/result-sound.wav'
      ];

      const loadAudio = (src) => {
        return new Promise((resolve) => {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = src;
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.addEventListener('error', () => resolve(), { once: true });
          audio.load();
        });
      };

      // 预加载图片
      const imageFiles = [
        '/egg-icon.svg',
        ...Array.from({ length: 12 }, (_, i) => `/guardians/${i + 1}.png`)
      ];

      const loadImage = (src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        });
      };

      // 预加载字体
      const loadFonts = async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      };

      // 预加载题目数据（确保已加载）
      const preloadQuestions = () => {
        return new Promise((resolve) => {
          // 访问题目数据，确保已加载到内存
          const questionCount = QUESTIONS.length;
          console.log(`预加载 ${questionCount} 道题目`);
          resolve();
        });
      };

      const updateProgress = (step) => {
        currentStep = step;
        setProgress(Math.min(currentStep, 100));

        // 更新加载文本
        if (currentStep < 30) {
          setLoadingText("请稍后，考官正在布置考场中");
        } else if (currentStep < 60) {
          setLoadingText("正在准备考题");
        } else if (currentStep < 90) {
          setLoadingText("即将开始测验");
        } else {
          setLoadingText("准备完成");
        }
      };

      try {
        // 1. 加载音频 (0-40%)
        updateProgress(5);
        const audioPromises = audioFiles.map(loadAudio);
        await Promise.all(audioPromises);
        updateProgress(40);

        // 2. 加载图片 (40-70%)
        const imagePromises = imageFiles.map(loadImage);
        await Promise.all(imagePromises);
        updateProgress(70);

        // 3. 加载字体 (70-85%)
        await loadFonts();
        updateProgress(85);

        // 4. 预加载题目 (85-95%)
        await preloadQuestions();
        updateProgress(95);

        // 5. 完成 (95-100%)
        updateProgress(100);

        // 等待一小段时间确保用户看到完成状态
        setTimeout(() => {
          onComplete();
        }, 500);

      } catch (error) {
        console.error('预加载出错:', error);
        // 即使出错也继续
        updateProgress(100);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    };

    loadResources();
  }, [onComplete]);

  return (
    <div className="preloading-page">
      {/* 背景渐变 */}
      <div className="preloading-bg" />

      {/* 浮动扑克牌花纹 */}
      {floatingSymbols.map((symbol, i) => (
        <span
          key={i}
          style={{
            ...symbol.style,
            WebkitTextFillColor: symbol.style.color,
            MozTextFillColor: symbol.style.color,
            filter: `blur(${symbol.blurAmount}px)`,
          }}
        >
          {symbol.suit}
        </span>
      ))}

      {/* 主容器 */}
      <motion.div
        className="preloading-card"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* 标题 */}
        <motion.h1
          className="preloading-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {loadingText}
        </motion.h1>

        {/* 进度条 */}
        <motion.div
          className="preloading-progress-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="preloading-progress-bar">
            <motion.div
              className="preloading-progress-fill"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <p className="preloading-percentage">{progress}%</p>
        </motion.div>

        {/* 装饰性粒子 */}
        <div className="preloading-particles">
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
        className="preloading-watermark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        Project Humpty-Lock · Seiyo Academy
      </motion.div>

      <style jsx>{`
        .preloading-page {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', 'Noto Sans SC', sans-serif;
        }

        .preloading-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1a0b2e 0%, #0f0520 50%, #000000 100%);
          z-index: 0;
        }

        .preloading-card {
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

        .preloading-title {
          font-size: clamp(18px, 4.5vw, 24px);
          font-weight: 300;
          letter-spacing: 0.15em;
          text-align: center;
          color: rgba(230, 220, 255, 0.95);
          margin: 0 0 32px 0;
          text-shadow:
            0 0 20px rgba(180, 130, 255, 0.6),
            0 0 40px rgba(180, 130, 255, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.5);
          line-height: 1.6;
        }

        .preloading-progress-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .preloading-progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(20, 10, 40, 0.6);
          border: 1px solid rgba(180, 130, 255, 0.25);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }

        .preloading-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7B5AB5, #A78BFA, #C9A0E8);
          border-radius: 16px;
          box-shadow: 0 0 20px rgba(180, 130, 255, 0.6);
          position: relative;
          overflow: hidden;
        }

        .preloading-progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .preloading-percentage {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(200, 180, 230, 0.9);
          text-shadow: 0 0 10px rgba(180, 130, 255, 0.4);
          margin: 0;
        }

        .preloading-particles {
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

        .preloading-watermark {
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
          .preloading-card {
            padding: 40px 24px;
            width: 92%;
          }

          .preloading-title {
            font-size: 18px;
            margin-bottom: 24px;
          }

          .preloading-percentage {
            font-size: 14px;
          }

          .preloading-watermark {
            font-size: 10px;
            letter-spacing: 0.1em;
            bottom: 20px;
            width: 85%;
          }
        }
      `}</style>
    </div>
  );
}
