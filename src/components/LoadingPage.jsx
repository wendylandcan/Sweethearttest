import { useState, useEffect } from "react";
import { useAudio } from "../contexts/AudioContext";

export default function LoadingPage({ onStart }) {
  const [crackStage, setCrackStage] = useState(0);
  const [started, setStarted] = useState(false);
  const [ripple, setRipple] = useState(false);
  const { tryPlay } = useAudio();

  useEffect(() => {
    if (!started) return;
    const stages = [300, 600, 900, 1200, 1500];
    const timers = stages.map((delay, i) =>
      setTimeout(() => setCrackStage(i + 1), delay)
    );
    const done = setTimeout(() => onStart(), 2000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [started, onStart]);

  const handleClick = () => {
    if (started) return;

    // 用户点击时尝试播放 BGM
    tryPlay();

    // 播放开始测试音效
    const startAudio = new Audio('/start-sound.wav');
    startAudio.play().catch(err => console.log('音频播放失败:', err));

    setStarted(true);
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
  };

  // 生成环境底纹符号 - 增加到60个，确保种类齐全
  const suits = ['♠', '♥', '♣', '♦'];
  const ambientSymbols = Array.from({ length: 60 }, (_, i) => {
    const suit = suits[i % 4]; // 确保每种花色均匀分布

    // 尺寸分级：大(15个)、中(20个)、小(25个) - 降低透明度
    let size, fontSize, opacity, blur;
    if (i < 15) {
      // 大型：远景装饰
      size = 'large';
      fontSize = Math.random() * 25 + 40; // 40-65px
      opacity = Math.random() * 0.02 + 0.02; // 0.02-0.04 (降低75%)
      blur = 3; // 增加模糊
    } else if (i < 35) {
      // 中型：中景点缀
      size = 'medium';
      fontSize = Math.random() * 15 + 22; // 22-37px
      opacity = Math.random() * 0.015 + 0.015; // 0.015-0.03 (降低75%)
      blur = 2.5; // 增加模糊
    } else {
      // 小型：近景底纹
      size = 'small';
      fontSize = Math.random() * 10 + 14; // 14-24px
      opacity = Math.random() * 0.012 + 0.012; // 0.012-0.024 (降低75%)
      blur = 2; // 增加模糊
    }

    // 紫色宝石渐变 - 降低饱和度，接近灰紫色
    // 为每个符号分配不同深浅的灰紫色
    const grayPurpleColors = [
      `rgba(170, 160, 180, ${opacity})`,  // 浅灰紫
      `rgba(160, 150, 170, ${opacity})`,  // 中灰紫
      `rgba(150, 145, 165, ${opacity})`,  // 深灰紫
      `rgba(165, 155, 175, ${opacity})`   // 中浅灰紫
    ];

    // 使用百分比定位，移动端自动收缩
    const topPercent = Math.random() * 85 + 5; // 5%-90%
    const leftPercent = Math.random() * 85 + 5; // 5%-90%

    return {
      suit,
      style: {
        position: 'absolute',
        top: `${topPercent}%`,
        left: `${leftPercent}%`,
        fontSize: `${fontSize}px`,
        color: grayPurpleColors[i % 4], // 直接使用灰紫色，不依赖 background-clip
        pointerEvents: 'none',
        zIndex: 0,
        opacity: opacity,
        animation: `ambientFloat${(i % 3) + 1} ${18 + Math.random() * 20}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 8}s`,
        filter: `blur(${blur}px)`,
        textShadow: `0 0 ${fontSize * 0.08}px currentColor`
      }
    };
  });

  return (
    <div className="loading-page">
      <div className="stars" />

      {/* 环境底纹符号 - 60个随机分布，种类齐全 */}
      {ambientSymbols.map((symbol, i) => (
        <span
          key={`ambient-${i}`}
          style={{
            ...symbol.style,
            WebkitTextFillColor: symbol.style.color,
            MozTextFillColor: symbol.style.color,
            // 调整 filter 参数，增加紫色调
            filter: `${symbol.style.filter} grayscale(100%) sepia(40%) hue-rotate(250deg) saturate(0.5) brightness(0.9)`,
          }}
        >
          {symbol.suit}
        </span>
      ))}

      {/* 核心四个符号 - 围绕心灵之蛋 - 灰紫色 */}
      <span style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-180%, -280%)',
        fontSize: 'clamp(24px, 5vw, 32px)',
        color: 'rgba(165, 155, 175, 0.15)',
        WebkitTextFillColor: 'rgba(165, 155, 175, 0.15)',
        MozTextFillColor: 'rgba(165, 155, 175, 0.15)',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.15,
        animation: 'suitFloat1 10s ease-in-out infinite',
        filter: 'blur(1px) grayscale(100%) sepia(40%) hue-rotate(250deg) saturate(0.5) brightness(0.9)',
        textShadow: '0 0 3px currentColor'
      }}>♠</span>

      <span style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(120%, 180%)',
        fontSize: 'clamp(20px, 4.5vw, 26px)',
        color: 'rgba(160, 150, 170, 0.14)',
        WebkitTextFillColor: 'rgba(160, 150, 170, 0.14)',
        MozTextFillColor: 'rgba(160, 150, 170, 0.14)',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.14,
        animation: 'suitFloat2 11s ease-in-out infinite',
        filter: 'blur(1px) grayscale(100%) sepia(40%) hue-rotate(250deg) saturate(0.5) brightness(0.9)',
        textShadow: '0 0 2.5px currentColor'
      }}>♦</span>

      <div className="loading-content">
        <p className="loading-subtitle-en">Seiyo Academy</p>
        <p className="loading-subtitle">圣 夜 学 园</p>
        <h1 className="loading-title">心灵之蛋</h1>
        <p className="loading-subtitle2">性 格 测 验</p>

        <div
          className={`egg-container ${started ? "egg-hatching" : "egg-idle"}`}
          onClick={handleClick}
          style={{ cursor: started ? "default" : "pointer" }}
        >
          <svg
            viewBox="0 0 120 140"
            width="160"
            height="186"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="eggAura" cx="50%" cy="50%">
                <stop offset="0%" stopColor="rgba(180, 130, 255, 0.28)" />
                <stop offset="100%" stopColor="rgba(180, 130, 255, 0)" />
              </radialGradient>
              <radialGradient id="eggGrad" cx="38%" cy="28%">
                <stop offset="0%" stopColor="rgba(244, 236, 255, 0.72)" />
                <stop offset="38%" stopColor="rgba(176, 155, 214, 0.5)" />
                <stop offset="100%" stopColor="rgba(58, 42, 86, 0.35)" />
              </radialGradient>
              <radialGradient id="eggVeil" cx="64%" cy="72%">
                <stop offset="0%" stopColor="rgba(210, 176, 255, 0.18)" />
                <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
              </radialGradient>
              <filter id="eggGlow">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <clipPath id="eggClip">
                <ellipse cx="60" cy="72" rx="35.2" ry="53.2" />
              </clipPath>
            </defs>

            {/* Outer aura for mysterious atmosphere */}
            <ellipse cx="60" cy="72" rx="54" ry="66" fill="url(#eggAura)" />

            {/* Egg body: slightly slimmer and taller */}
            <ellipse
              cx="60"
              cy="72"
              rx="36"
              ry="54"
              fill="url(#eggGrad)"
              stroke="rgba(245,245,255,0.34)"
              strokeWidth="1.25"
              filter="url(#eggGlow)"
            />

            {/* Subtle inner veil for depth */}
            <ellipse cx="60" cy="72" rx="33.5" ry="50" fill="url(#eggVeil)" />

            {/* Hidden ornate textures for mysterious atmosphere */}
            <g clipPath="url(#eggClip)" style={{ filter: 'grayscale(100%) sepia(40%) hue-rotate(250deg) saturate(0.5) brightness(0.9)' }}>
              {/* Ghostly curved filigree lines - 降低饱和度 */}
              <path
                d="M30 54 C48 42, 72 44, 89 58"
                stroke="rgba(170, 165, 175, 0.04)"
                strokeWidth="0.9"
                fill="none"
              />
              <path
                d="M30 70 C47 60, 73 61, 90 74"
                stroke="rgba(168, 163, 173, 0.035)"
                strokeWidth="0.8"
                fill="none"
              />
              <path
                d="M31 86 C49 76, 71 78, 88 92"
                stroke="rgba(165, 160, 170, 0.03)"
                strokeWidth="0.75"
                fill="none"
              />
              {/* Thin vertical aurora bands */}
              <ellipse cx="52" cy="72" rx="3.8" ry="49" fill="rgba(170, 165, 175, 0.02)" />
              <ellipse cx="69" cy="72" rx="2.6" ry="47" fill="rgba(165, 160, 170, 0.015)" />
              {/* Faint suit sigils - 极低饱和度灰紫色，强制覆盖默认颜色 */}
              <text
                x="41"
                y="64"
                fontSize="11"
                fill="rgba(170, 165, 175, 0.04)"
                style={{ fill: 'rgba(170, 165, 175, 0.04)' }}
              >♥</text>
              <text
                x="65"
                y="60"
                fontSize="10"
                fill="rgba(165, 160, 170, 0.035)"
                style={{ fill: 'rgba(165, 160, 170, 0.035)' }}
              >♠</text>
              <text
                x="43"
                y="87"
                fontSize="10"
                fill="rgba(168, 163, 173, 0.035)"
                style={{ fill: 'rgba(168, 163, 173, 0.035)' }}
              >♣</text>
              <text
                x="66"
                y="90"
                fontSize="10"
                fill="rgba(172, 167, 177, 0.035)"
                style={{ fill: 'rgba(172, 167, 177, 0.035)' }}
              >♦</text>
            </g>

            {/* Primary highlight */}
            <ellipse
              cx="46"
              cy="49"
              rx="10"
              ry="15"
              fill="rgba(255,255,255,0.16)"
              transform="rotate(-14,46,49)"
            />

            {/* Secondary tiny highlight */}
            <ellipse
              cx="50"
              cy="61"
              rx="4.5"
              ry="6.5"
              fill="rgba(255,255,255,0.12)"
              transform="rotate(-14,50,61)"
            />

            {crackStage >= 1 && (
              <path d="M60 35 L55 50 L62 58" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" className="crack-line" />
            )}
            {crackStage >= 2 && (
              <path d="M62 58 L70 65 L65 75" stroke="rgba(255,255,255,0.55)" strokeWidth="1" fill="none" className="crack-line" />
            )}
            {crackStage >= 3 && (
              <path d="M55 50 L48 62 L54 70" stroke="rgba(255,255,255,0.5)" strokeWidth="0.9" fill="none" className="crack-line" />
            )}
            {crackStage >= 4 && (
              <path d="M65 75 L72 85 L62 90" stroke="rgba(255,255,255,0.5)" strokeWidth="0.9" fill="none" className="crack-line" />
            )}
            {crackStage >= 5 && (
              <path d="M54 70 L46 80 L52 95" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" fill="none" className="crack-line" />
            )}
          </svg>

          {!started && (
            <div className={`egg-hint ${ripple ? "ripple" : ""}`}>
              轻 触 破 壳
            </div>
          )}
          {started && crackStage < 5 && (
            <div className="egg-hint egg-cracking">
              {"· ".repeat(crackStage + 1).trim()}
            </div>
          )}
        </div>

        <p className="loading-desc">
          32 道沉浸式问题 · 六维性格向量算法
          <br />
          遇见属于你的守护甜心
        </p>

        {!started && (
          <button className="start-btn" onClick={handleClick}>
            开始测验
          </button>
        )}
      </div>
    </div>
  );
}
