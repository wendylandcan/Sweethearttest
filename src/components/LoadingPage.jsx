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
    const purpleGradients = [
      `linear-gradient(135deg, rgba(170, 160, 180, ${opacity * 1.5}) 0%, rgba(150, 145, 165, ${opacity * 1.2}) 50%, rgba(130, 125, 150, ${opacity * 0.8}) 100%)`,
      `linear-gradient(145deg, rgba(165, 155, 175, ${opacity * 1.4}) 0%, rgba(145, 140, 160, ${opacity * 1.1}) 50%, rgba(125, 120, 145, ${opacity * 0.7}) 100%)`,
      `linear-gradient(125deg, rgba(175, 165, 185, ${opacity * 1.6}) 0%, rgba(155, 150, 170, ${opacity * 1.3}) 50%, rgba(135, 130, 155, ${opacity * 0.9}) 100%)`,
      `linear-gradient(155deg, rgba(168, 158, 178, ${opacity * 1.5}) 0%, rgba(148, 143, 163, ${opacity * 1.2}) 50%, rgba(128, 123, 148, ${opacity * 0.8}) 100%)`
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
        color: 'transparent',
        background: purpleGradients[i % 4],
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        filter: `blur(${blur}px) drop-shadow(0 0 ${fontSize * 0.1}px rgba(155, 150, 165, ${opacity * 0.8}))`,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: opacity,
        animation: `ambientFloat${(i % 3) + 1} ${18 + Math.random() * 20}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 8}s`,
        textShadow: `0 0 ${fontSize * 0.08}px rgba(170, 165, 180, ${opacity * 1.2})`
      }
    };
  });

  return (
    <div className="loading-page">
      <div className="stars" />

      {/* 环境底纹符号 - 60个随机分布，种类齐全 */}
      {ambientSymbols.map((symbol, i) => (
        <div key={`ambient-${i}`} style={symbol.style}>{symbol.suit}</div>
      ))}

      {/* 核心四个符号 - 围绕心灵之蛋 - 降低饱和度 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-180%, -280%)',
        fontSize: 'clamp(24px, 5vw, 32px)',
        color: 'transparent',
        background: 'linear-gradient(135deg, rgba(170, 160, 180, 0.25) 0%, rgba(150, 145, 165, 0.18) 50%, rgba(130, 125, 150, 0.12) 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        filter: 'blur(1px) drop-shadow(0 0 4px rgba(155, 150, 165, 0.25))',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.15,
        animation: 'suitFloat1 10s ease-in-out infinite',
        textShadow: '0 0 3px rgba(170, 165, 180, 0.2)'
      }}>♠</div>

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(120%, 180%)',
        fontSize: 'clamp(20px, 4.5vw, 26px)',
        color: 'transparent',
        background: 'linear-gradient(135deg, rgba(170, 160, 180, 0.24) 0%, rgba(150, 145, 165, 0.17) 50%, rgba(130, 125, 150, 0.11) 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        filter: 'blur(1px) drop-shadow(0 0 3px rgba(155, 150, 165, 0.23))',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.14,
        animation: 'suitFloat2 11s ease-in-out infinite',
        textShadow: '0 0 2.5px rgba(170, 165, 180, 0.19)'
      }}>♦</div>

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
            <g clipPath="url(#eggClip)">
              {/* Ghostly curved filigree lines */}
              <path
                d="M30 54 C48 42, 72 44, 89 58"
                stroke="rgba(220, 195, 255, 0.12)"
                strokeWidth="0.9"
                fill="none"
              />
              <path
                d="M30 70 C47 60, 73 61, 90 74"
                stroke="rgba(228, 206, 255, 0.11)"
                strokeWidth="0.8"
                fill="none"
              />
              <path
                d="M31 86 C49 76, 71 78, 88 92"
                stroke="rgba(210, 185, 245, 0.1)"
                strokeWidth="0.75"
                fill="none"
              />
              {/* Thin vertical aurora bands */}
              <ellipse cx="52" cy="72" rx="3.8" ry="49" fill="rgba(198, 165, 240, 0.06)" />
              <ellipse cx="69" cy="72" rx="2.6" ry="47" fill="rgba(180, 150, 225, 0.05)" />
              {/* Faint suit sigils */}
              <text x="41" y="64" fontSize="11" fill="rgba(235, 215, 255, 0.12)">♥</text>
              <text x="65" y="60" fontSize="10" fill="rgba(225, 205, 250, 0.1)">♠</text>
              <text x="43" y="87" fontSize="10" fill="rgba(220, 198, 248, 0.1)">♣</text>
              <text x="66" y="90" fontSize="10" fill="rgba(238, 216, 255, 0.1)">♦</text>
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
