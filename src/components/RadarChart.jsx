import { memo } from "react";
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { DIMENSIONS } from "../data/characters";

const MAX_VAL = 28;

function hexToRgba(hex, a) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return `rgba(90,70,120,${a})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function RadarChart({ scores, color, glowColor, size = 240, characterId }) {
  // 构建雷达图数据
  const chartData = DIMENSIONS.map((dimension, index) => ({
    subject: dimension,
    A: scores[index],
    fullMark: MAX_VAL,
  }));

  // 动态配色逻辑
  let strokeColor = color;
  let fillColor = color;

  if (characterId === 'SC02') {
    // 大地 - 使用深棕色
    strokeColor = '#5E3B25';
    fillColor = '#5E3B25';
  } else if (characterId === 'SC04') {
    // 节奏 - 使用深紫色
    strokeColor = '#2A0F45';
    fillColor = '#2A0F45';
  }

  const gridColor = hexToRgba(strokeColor, 0.25);

  return (
    <div style={{
      height: `${size}px`,
      width: '100%',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar
          cx="50%"
          cy="50%"
          outerRadius="70%"
          data={chartData}
        >
          {/* 网格线 - 虚线效果 */}
          <PolarGrid
            stroke={gridColor}
            strokeDasharray="4 4"
            strokeWidth={2}
          />

          {/* 轴标签 */}
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: '#4A342E',
              fontSize: size >= 220 ? 15 : 13,
              fontFamily: "'ZCOOL KuaiLe', 'Fredoka', 'Noto Sans SC', sans-serif",
              fontWeight: 700,
            }}
            tickLine={false}
          />

          {/* 雷达区域 */}
          <Radar
            name="Stats"
            dataKey="A"
            stroke={strokeColor}
            fill={fillColor}
            fillOpacity={0.3}
            strokeWidth={2.5}
            dot={{
              r: 2.4,
              fill: strokeColor,
              stroke: 'rgba(255, 255, 255, 0.6)',
              strokeWidth: 3.2,
            }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}

// 使用 memo 优化性能，避免不必要的重渲染
export default memo(RadarChart);
