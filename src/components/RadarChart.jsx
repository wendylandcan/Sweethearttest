import { useEffect, useRef } from "react";
import { DIMENSIONS } from "../data/characters";

const MAX_VAL = 28;

function hexToRgba(hex, a) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return `rgba(90,70,120,${a})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function RadarChart({ scores, color, glowColor, size = 280, characterId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displaySize = size;
    const drawSize = size * dpr;
    if (canvas.width !== drawSize || canvas.height !== drawSize) {
      canvas.width = drawSize;
      canvas.height = drawSize;
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.21; // 下调 15%
    const n = 6;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    const getPoint = (i, r) => ({
      x: cx + r * Math.cos(startAngle + i * angleStep),
      y: cy + r * Math.sin(startAngle + i * angleStep),
    });

    // 动态配色逻辑
    let lineColor = '#5E3B25';
    let fillColor = hexToRgba(color, 0.3);
    let dotColor = '#5E3B25';

    if (characterId === 'SC02') {
      // 大地
      lineColor = '#5E3B25';
      fillColor = hexToRgba(color, 0.3);
      dotColor = '#5E3B25';
    } else if (characterId === 'SC04') {
      // 节奏
      lineColor = '#2A0F45';
      fillColor = hexToRgba(color, 0.3);
      dotColor = '#2A0F45';
    } else {
      // 其他角色使用主题色
      lineColor = color;
      fillColor = hexToRgba(color, 0.3);
      dotColor = color;
    }

    const gridColor = hexToRgba(lineColor, 0.25);

    ctx.clearRect(0, 0, size, size);

    // Web rings — 淡色虚线
    [0.25, 0.5, 0.75, 1].forEach((frac) => {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const p = getPoint(i % n, radius * frac);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Spokes — 淡色虚线
    for (let i = 0; i < n; i++) {
      const p = getPoint(i, radius);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Data polygon - 静态
    const dataPoints = scores.map((v, i) => {
      const r = (Math.max(0, v) / MAX_VAL) * radius;
      return getPoint(i, r);
    });

    // Fill
    ctx.beginPath();
    dataPoints.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Stroke - 加粗至 2.5px
    ctx.beginPath();
    dataPoints.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.closePath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Vertices - 缩小黑点，使用深色主题色
    dataPoints.forEach((p) => {
      // 白色发光效果
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();

      // 主节点 - 更小
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    });

    // Labels + percentage values
    const labelOffset = size >= 220 ? 48 : 38;
    const labelFontSize = size >= 220 ? 15 : 13;
    const valueFontSize = size >= 220 ? 14 : 12;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
      const labelR = radius + labelOffset;
      const p = getPoint(i, labelR);
      // dimension name
      ctx.font = `700 ${labelFontSize}px 'ZCOOL KuaiLe', 'Fredoka', 'Noto Sans SC', sans-serif`;
      ctx.fillStyle = '#4A342E';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeText(DIMENSIONS[i], p.x, p.y - 9);
      ctx.fillText(DIMENSIONS[i], p.x, p.y - 9);
      // percentage value
      const pct = Math.round((Math.max(0, scores[i]) / MAX_VAL) * 100);
      ctx.font = `600 ${valueFontSize}px 'ZCOOL KuaiLe', 'Fredoka', 'Noto Sans SC', sans-serif`;
      ctx.fillStyle = '#4A342E';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.strokeText(`${pct}%`, p.x, p.y + 10);
      ctx.fillText(`${pct}%`, p.x, p.y + 10);
    }
  }, [scores, color, glowColor, size, characterId]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}
