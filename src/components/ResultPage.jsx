import { useRef, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import RadarChart from "./RadarChart";
import { saveResult } from "../lib/supabase";
import { getCharById, SOCIAL_MAGNETISM } from "../data/characters";
import { useAudio } from "../contexts/AudioContext";

function StarField({ color }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 6,
        duration: 2.5 + Math.random() * 4,
      })),
    []
  );
  return (
    <div className="star-field" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="star-dot"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: color || "#b9a3e3",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/** 将 "手鞠 (Temari)" 拆为 { zh: "手鞠", en: "Temari" } */
function splitName(fullName) {
  if (!fullName) return { zh: fullName, en: null };
  const m = fullName.match(/^(.+?)\s*\(([^)]+)\)$/);
  return m ? { zh: m[1].trim(), en: m[2].trim() } : { zh: fullName, en: null };
}

/** 统一的角色名渲染：中文可爱圆润字体 + 英文 Nunito + 立体贴纸效果 + 整体光晕 */
function CharName({ name, color, zhSize = "20px", enSize = "10px" }) {
  const { zh, en } = splitName(name);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span className="char-name-glow" style={{
        background: `radial-gradient(circle, ${hexToRgba(color, 0.5)} 0%, transparent 75%)`,
      }} />
      <span style={{
        fontFamily: "'ZCOOL KuaiLe', 'Fredoka', 'Noto Sans SC', sans-serif",
        fontSize: zhSize,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color,
        textShadow: `
          -1px -1px 0 #fff,
          1px -1px 0 #fff,
          -1px 1px 0 #fff,
          1px 1px 0 #fff,
          0 3px 0 ${hexToRgba(color, 0.4)}
        `,
      }}>
        {zh}
      </span>
      {en && (
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: enSize,
          fontWeight: 700,
          letterSpacing: "0.18em",
          marginLeft: "6px",
          opacity: 0.65,
          color,
          verticalAlign: "middle",
        }}>
          {en.toUpperCase()}
        </span>
      )}
    </span>
  );
}

const SOUL_ICONS = {
  "灵魂底色": "◇",
  "天赋魔法": "✧",
  "暗影陷阱": "◆",
  "破壳寄语": "♡",
};

function CardSparkles({ color }) {
  const orbs = useMemo(() => [
    { top: "8%",  left: "6%",   size: 13, delay: 0,   dur: 3.2 },
    { top: "14%", right: "7%",  size: 10, delay: 1.3, dur: 2.7 },
    { top: "38%", left: "4%",   size: 9,  delay: 0.7, dur: 3.6 },
    { top: "32%", right: "5%",  size: 14, delay: 1.9, dur: 2.9 },
    { top: "60%", left: "7%",   size: 8,  delay: 2.5, dur: 3.1 },
    { top: "52%", right: "4%",  size: 11, delay: 0.4, dur: 2.5 },
    { top: "20%", left: "16%",  size: 7,  delay: 1.6, dur: 3.8 },
    { top: "24%", right: "15%", size: 8,  delay: 2.9, dur: 3.0 },
  ], []);
  return (
    <div className="card-sparkles" aria-hidden="true">
      {orbs.map((o, i) => (
        <span
          key={i}
          className="card-sparkle"
          style={{
            top: o.top,
            left: o.left,
            right: o.right,
            fontSize: `${o.size}px`,
            color,
            textShadow: `0 0 6px ${color}`,
            animationDelay: `${o.delay}s`,
            animationDuration: `${o.dur}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

function SectionDivider({ color }) {
  const lineColor = hexToRgba(color, 0.18);
  return (
    <div className="section-divider" aria-hidden="true">
      <span className="divider-line" style={{ background: lineColor }} />
      <span className="divider-star" style={{ color }}>✦</span>
      <span className="divider-line" style={{ background: lineColor }} />
    </div>
  );
}

function GemIcon({ color }) {
  return (
    <svg
      className="soul-catalog-gem"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color }}
    >
      {/* top facets */}
      <polygon points="4,7 10,2 16,7 10,9" fill={color} opacity="0.9" />
      {/* left facet */}
      <polygon points="2,9 4,7 10,9 10,18" fill={color} opacity="0.5" />
      {/* right facet */}
      <polygon points="18,9 16,7 10,9 10,18" fill={color} opacity="0.7" />
      {/* center bright highlight */}
      <polygon points="10,3.5 13,7 10,8 7,7" fill="white" opacity="0.55" />
      {/* bottom outline */}
      <polygon points="4,7 10,2 16,7 18,9 10,18 2,9" fill="none" stroke={color} strokeWidth="0.6" opacity="0.6" />
    </svg>
  );
}

function hexToRgba(hex, a) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "rgba(255,255,255,0.4)";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function ResultPage({ match, scores, onRetry }) {
  const resultRef = useRef(null);
  const posterAreaRef = useRef(null); // 专门用于海报区域
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(''); // 新增：进度提示
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const { playSFX } = useAudio(); // 获取音效播放方法
  const guardianImageUrl = `/guardians/${match.id}.png`;
  const themeColor = match.themeColor || match.color;
  const themeGlow = hexToRgba(themeColor, 0.4);
  const themeBgGradient = `linear-gradient(180deg, ${themeColor}22 0%, #fffaf5 60%, #ffffff 100%)`;
  const nameMatch = match.name.match(/^(.+?)\s*\(([^)]+)\)$/);
  const nameZh = nameMatch ? nameMatch[1].trim() : match.name;
  const nameEn = nameMatch ? nameMatch[2].trim() : null;
  const social = SOCIAL_MAGNETISM[match.id];
  const fatedChar = social ? getCharById(social.fatedId) : null;
  const avoidChar = social ? getCharById(social.avoidId) : null;

  // 播放结果展示音效
  useEffect(() => {
    playSFX('/result-sound.wav');
  }, [playSFX]);

  // 强制应用可爱字体到整个页面
  useEffect(() => {
    document.body.style.fontFamily = "'ZCOOL KuaiLe', 'Fredoka', 'Quicksand', 'Noto Sans SC', sans-serif";
  }, []);

  // 模态框显示时锁定滚动
  useEffect(() => {
    if (showModal) {
      // 锁定滚动
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';

      // ESC 键关闭
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowModal(false);
        }
      };
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      // 恢复滚动
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // 清理函数
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showModal]);

  // Save to Supabase once on mount
  useState(() => {
    saveResult({ characterId: match.id, scores });
  });

  const handleSavePoster = async () => {
    // 播放保存海报音效
    playSFX('/poster-sound.wav');

    if (!posterAreaRef.current || saving) return;

    setSaving(true);
    setSavingProgress('准备中...');

    try {
      console.log('🎨 开始生成海报...');

      // 1. 等待字体加载
      setSavingProgress('加载资源中...');
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
        console.log('✅ 字体加载完成');
      }

      // 2. 等待所有图片加载完成
      const images = posterAreaRef.current.querySelectorAll('img');
      console.log(`📷 找到 ${images.length} 张图片`);

      await Promise.all(
        Array.from(images).map((img, index) => {
          const htmlImg = img;

          // 检查图片状态
          console.log(`图片 ${index + 1}:`, {
            src: htmlImg.src,
            complete: htmlImg.complete,
            naturalWidth: htmlImg.naturalWidth,
            naturalHeight: htmlImg.naturalHeight
          });

          // 已加载完成
          if (htmlImg.complete && htmlImg.naturalWidth > 0) {
            console.log(`✅ 图片 ${index + 1} 已加载`);
            return Promise.resolve();
          }

          // 等待加载
          return new Promise((resolve) => {
            htmlImg.onload = () => {
              console.log(`✅ 图片 ${index + 1} 加载成功`);
              resolve();
            };
            htmlImg.onerror = (e) => {
              console.error(`❌ 图片 ${index + 1} 加载失败:`, htmlImg.src, e);
              resolve(); // 即使失败也继续
            };
            setTimeout(() => {
              console.warn(`⚠️  图片 ${index + 1} 加载超时`);
              resolve();
            }, 5000);
          });
        })
      );
      console.log('✅ 所有图片加载完成');

      // 3. 额外等待 500ms 确保渲染完成
      setSavingProgress('渲染海报中...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. 获取完整尺寸（使用 scrollHeight）
      const actualHeight = posterAreaRef.current.scrollHeight;
      const actualWidth = posterAreaRef.current.offsetWidth;
      console.log('📐 海报尺寸:', actualWidth, 'x', actualHeight);

      // 5. 动态导入 modern-screenshot
      console.log('📦 导入 modern-screenshot...');
      const { domToPng } = await import('modern-screenshot');
      console.log('✅ modern-screenshot 导入成功');

      // 6. 生成海报
      console.log('📸 开始生成图片...');
      const dataUrl = await domToPng(posterAreaRef.current, {
        quality: 1,           // 最高质量
        scale: 2,             // 2倍分辨率（足够清晰）
        width: actualWidth,
        height: actualHeight, // 使用完整高度
        backgroundColor: '#ffffff',
        filter: (node) => {
          // 过滤掉不需要的元素
          if (node.classList?.contains('star-field')) {
            return false; // 不截取背景星星
          }
          return true;
        }
      });

      console.log('✅ 图片生成完成，大小:', dataUrl.length, 'bytes');

      // 7. 显示模态框
      setGeneratedImage(dataUrl);
      setShowModal(true);
      setSaved(true);

    } catch (e) {
      console.error('❌ 保存海报失败:', e);
      console.error('错误堆栈:', e.stack);
      const errorMsg = e.message || '未知错误';
      alert(`保存失败: ${errorMsg}\n\n请尝试：\n1. 刷新页面后重试\n2. 检查网络连接\n3. 清除浏览器缓存\n\n技术信息：${e.stack?.split('\n')[0] || '无'}`);
    } finally {
      setSaving(false);
      setSavingProgress('');
    }
  };

  return (
    <div className="result-page" style={{ background: themeBgGradient }}>
      <div className="result-bg-glow" style={{ background: themeGlow }} />
      <StarField color={hexToRgba(themeColor, 0.9)} />

      <div className="result-scroll">
        {/* Poster area */}
        <div ref={posterAreaRef} className="poster-area">
          {/* 别针装饰 - 右上角 */}
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '30px',
            width: '16px',
            height: '16px',
            background: 'radial-gradient(circle at 30% 30%, #E8D4B8 0%, #C9B299 100%)',
            border: '2px solid var(--moore-brown)',
            borderRadius: '50%',
            boxShadow: '0 2px 0 var(--moore-brown), 0 4px 8px rgba(94, 59, 37, 0.3), inset -1px -1px 2px rgba(0, 0, 0, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 0.6)',
            zIndex: 10
          }} />

          {/* 别针装饰 - 左下角 */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '25px',
            width: '16px',
            height: '16px',
            background: 'radial-gradient(circle at 30% 30%, #E8D4B8 0%, #C9B299 100%)',
            border: '2px solid var(--moore-brown)',
            borderRadius: '50%',
            boxShadow: '0 2px 0 var(--moore-brown), 0 4px 8px rgba(94, 59, 37, 0.3), inset -1px -1px 2px rgba(0, 0, 0, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 0.6)',
            zIndex: 10
          }} />

          {/* 别针装饰 - 右下角 */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '25px',
            width: '16px',
            height: '16px',
            background: 'radial-gradient(circle at 30% 30%, #E8D4B8 0%, #C9B299 100%)',
            border: '2px solid var(--moore-brown)',
            borderRadius: '50%',
            boxShadow: '0 2px 0 var(--moore-brown), 0 4px 8px rgba(94, 59, 37, 0.3), inset -1px -1px 2px rgba(0, 0, 0, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 0.6)',
            zIndex: 10
          }} />

          {/* Header */}
          <motion.div
            className="result-header"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="result-school">圣夜学园 · 心灵之蛋</p>
            <p className="result-label">你的守护甜心是</p>
          </motion.div>

          {/* 人物：中文名 + 英文名 */}
          <motion.div
            className="result-name-block"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 160, damping: 18 }}
          >
            <h1
              className="result-char-name-zh"
              style={{
                color: themeColor,
              }}
            >
              <span className="result-char-name-glow" style={{
                background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.5)} 0%, transparent 70%)`,
              }} />
              {nameZh}
            </h1>
            {nameEn && (
              <p className="result-char-name-en" style={{ color: themeColor }}>
                {nameEn.toUpperCase()}
              </p>
            )}
          </motion.div>

          <motion.div
            className="result-guardian"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <CardSparkles color={themeColor} />
            <div
              className="guardian-glow"
              style={{
                background: `radial-gradient(circle, ${hexToRgba(themeColor, 0.4)} 0%, ${hexToRgba(themeColor, 0.2)} 40%, transparent 70%)`,
              }}
            />
            <div
              className="guardian-platform"
              style={{
                background: `radial-gradient(ellipse at center, ${hexToRgba(themeColor, 0.18)} 0%, transparent 72%)`,
              }}
            />
            <img
              className="result-guardian-image"
              src={guardianImageUrl}
              alt={`${match.name} 守护甜心`}
              crossOrigin="anonymous"
              loading="eager"
            />
          </motion.div>

          {/* 关键词 + 口号：放在人物与六维表之间 */}
          <motion.div
            className="result-keyword-tagline-block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <div
              className="result-keyword-badge"
              style={{
                borderColor: themeColor,
                color: themeColor,
                boxShadow: `0 0 18px ${hexToRgba(themeColor, 0.3)}, inset 0 0 12px ${hexToRgba(themeColor, 0.06)}`,
              }}
            >
              <span style={{ fontSize: "10px", opacity: 0.7 }}>✦</span>
              {match.keyword}
              <span style={{ fontSize: "10px", opacity: 0.7 }}>✦</span>
            </div>
            <div
              className="result-tagline-box"
              style={{
                borderColor: hexToRgba(themeColor, 0.5),
                backgroundColor: hexToRgba(themeColor, 0.07),
              }}
            >
              <p className="result-tagline-text" style={{ color: hexToRgba(themeColor, 0.9) }}>
                {match.tagline}
              </p>
            </div>
          </motion.div>

          <SectionDivider color={themeColor} />

          {/* 六维雷达图 */}
          <div className="radar-container">
            <RadarChart
              scores={scores}
              color={themeColor}
              glowColor={themeGlow}
              size={240}
              characterId={match.id}
            />
          </div>

          <SectionDivider color={themeColor} />

          {/* 灵魂图鉴：分区标题 + 介绍 */}
          <motion.div
            className="soul-desc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="soul-catalog-title" style={{ color: themeColor }}>
              <span className="soul-catalog-title-glow" style={{
                background: `radial-gradient(ellipse, ${hexToRgba(themeColor, 0.4)} 0%, transparent 70%)`,
              }} />
              <GemIcon color={themeColor} />
              灵魂图鉴
            </h3>
            {[
              { label: "灵魂底色", text: match.soulColor },
              { label: "天赋魔法", text: match.magicGift },
              { label: "暗影陷阱", text: match.shadowTrap },
              ...(match.letter ? [{ label: "破壳寄语", text: match.letter }] : []),
            ].map(({ label, text }) => (
              <div
                key={label}
                className="soul-section"
                style={{
                  borderLeft: `3px solid ${themeColor}`,
                  backgroundColor: hexToRgba(themeColor, 0.07),
                }}
              >
                <h4 className="soul-section-title" style={{ color: themeColor }}>
                  <span style={{ fontSize: "11px", opacity: 0.8 }}>{SOUL_ICONS[label] ?? "◇"}</span>
                  {label}
                </h4>
                <p className="soul-text">{text}</p>
              </div>
            ))}
          </motion.div>

          {/* 社交磁场：宿命契合 / 绝对避雷 */}
          {social && (fatedChar || avoidChar) && (
            <motion.div
              className="social-magnetism"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="soul-catalog-title" style={{ color: themeColor }}>
                <span className="soul-catalog-title-glow" style={{
                  background: `radial-gradient(ellipse, ${hexToRgba(themeColor, 0.4)} 0%, transparent 70%)`,
                }} />
                <GemIcon color={themeColor} />
                社交磁场
              </h3>
              {fatedChar && social.fatedDesc && (
                <div
                  className="social-card social-card-fated"
                  style={{
                    background: `${fatedChar.themeColor || fatedChar.color || '#7CB9E8'}18`,
                    borderColor: hexToRgba(fatedChar.themeColor || fatedChar.color || '#7CB9E8', 0.4),
                  }}
                >
                  <h4 className="social-card-label" style={{ color: fatedChar.themeColor || fatedChar.color }}>
                    宿命契合
                  </h4>
                  <p className="social-card-name">
                    <CharName name={fatedChar.name} color={fatedChar.themeColor || fatedChar.color} zhSize="22px" enSize="10px" />
                  </p>
                  <p className="social-card-desc" style={{ color: hexToRgba(fatedChar.themeColor || fatedChar.color, 0.88) }}>
                    {social.fatedDesc}
                  </p>
                </div>
              )}
              {avoidChar && social.avoidDesc && (
                <div
                  className="social-card social-card-avoid"
                  style={{
                    background: `${avoidChar.themeColor || avoidChar.color || '#9B59B6'}18`,
                    borderColor: hexToRgba(avoidChar.themeColor || avoidChar.color || '#9B59B6', 0.4),
                  }}
                >
                  <h4 className="social-card-label" style={{ color: avoidChar.themeColor || avoidChar.color }}>
                    绝对避雷
                  </h4>
                  <p className="social-card-name">
                    <CharName name={avoidChar.name} color={avoidChar.themeColor || avoidChar.color} zhSize="22px" enSize="10px" />
                  </p>
                  <p className="social-card-desc" style={{ color: hexToRgba(avoidChar.themeColor || avoidChar.color, 0.88) }}>
                    {social.avoidDesc}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Watermark */}
          <div className="poster-watermark">圣夜学园 · 心灵之蛋 · Project Humpty-Lock</div>
        </div>

        {/* Action buttons */}
        <motion.div
          className="result-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <button
            className="action-btn primary"
            style={{
              background: themeColor,
              boxShadow: `0 6px 24px ${hexToRgba(themeColor, 0.45)}`,
            }}
            onClick={handleSavePoster}
            disabled={saving}
          >
            {saving ? savingProgress : saved ? "再次保存海报" : "保存海报"}
          </button>
          <button className="action-btn ghost" onClick={() => {
            playSFX('/poster-sound.wav');
            setTimeout(() => onRetry(), 100);
          }}>
            重新测验
          </button>
        </motion.div>
      </div>

      {/* 长按保存模态框 */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
            animation: 'modalFadeIn 0.3s ease-out'
          }}
          onClick={(e) => {
            // 点击背景关闭模态框
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <style>
            {`
              @keyframes modalFadeIn {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes textPulse {
                0%, 100% { opacity: 1; transform: translateY(0); }
                50% { opacity: 0.7; transform: translateY(-2px); }
              }
            `}
          </style>

          {/* 提示文字 */}
          <p
            style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '24px',
              textAlign: 'center',
              letterSpacing: '0.05em',
              fontFamily: "'ZCOOL KuaiLe', 'Fredoka', 'Noto Sans SC', sans-serif",
              animation: 'textPulse 2s ease-in-out infinite',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
            }}
          >
            ✨ 长按下方图片保存到相册
          </p>

          {/* 生成的图片 */}
          <img
            src={generatedImage}
            alt="我的守护甜心海报"
            style={{
              maxWidth: '85%',
              maxHeight: '75%',
              width: 'auto',
              height: 'auto',
              borderRadius: '12px',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.5), 0 0 60px rgba(139, 127, 212, 0.3)',
              display: 'block',
              objectFit: 'contain',
              WebkitTouchCallout: 'default',
              userSelect: 'none',
              marginBottom: '24px',
              // 移动端优化
              '@media (max-width: 768px)': {
                maxWidth: '90%',
                maxHeight: '70%'
              }
            }}
            onContextMenu={(e) => {
              // 允许右键菜单（桌面端保存）
              return true;
            }}
          />

          {/* 关闭按钮 */}
          <button
            onClick={() => setShowModal(false)}
            style={{
              padding: '12px 40px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '50px',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              background: 'rgba(255, 255, 255, 0.1)',
              fontFamily: "'ZCOOL KuaiLe', 'Fredoka', 'Noto Sans SC', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
}
