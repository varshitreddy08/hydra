"use client";

import { cn } from "@/lib/utils/cn";
import { triageLevelColor } from "@/lib/utils/formatters";

interface TriageScoreGaugeProps {
  score: number; // 0-100
  level: string;
  size?: number;
}

export function TriageScoreGauge({ score, level, size = 120 }: TriageScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));

  // SVG arc parameters
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.72;
  const strokeWidth = size * 0.085;

  // 270-degree sweep: from 135deg to 405deg (i.e., -135 clockwise to +135)
  // We'll use angles in standard SVG coordinate space
  const startAngleDeg = 135;
  const endAngleDeg = 405; // 135 + 270
  const totalSweep = 270;

  function polarToCartesian(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function describeArc(startDeg: number, endDeg: number) {
    const start = polarToCartesian(startDeg);
    const end = polarToCartesian(endDeg);
    const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  }

  const backgroundPath = describeArc(startAngleDeg, endAngleDeg);

  const progressEndDeg = startAngleDeg + (clamped / 100) * totalSweep;
  const progressPath =
    clamped > 0
      ? describeArc(startAngleDeg, Math.min(progressEndDeg, endAngleDeg - 0.01))
      : null;

  // Color based on score: red (high urgency) to green (low urgency)
  let progressColor: string;
  let gradientId: string;
  if (clamped >= 70) {
    progressColor = "#ef4444"; // red - critical
    gradientId = "gauge-red";
  } else if (clamped >= 40) {
    progressColor = "#f59e0b"; // amber - moderate
    gradientId = "gauge-amber";
  } else {
    progressColor = "#10b981"; // green - stable
    gradientId = "gauge-green";
  }

  const shortLevel = level.replace("_IMMEDIATE", "").replace("_EMERGENT", "").replace("_URGENT", "").replace("_LESS_URGENT", "").replace("_NON_URGENT", "");
  const levelColorClass = triageLevelColor(level);
  const fontSize = size * 0.22;
  const labelFontSize = size * 0.1;

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Triage score ${clamped}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={progressColor} stopOpacity={0.6} />
            <stop offset="100%" stopColor={progressColor} stopOpacity={1} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d={backgroundPath}
          fill="none"
          stroke="#1e2d4a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        {progressPath && (
          <path
            d={progressPath}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Center score */}
        <text
          x={cx}
          y={cy + fontSize * 0.35}
          textAnchor="middle"
          fill="white"
          fontWeight="bold"
          fontSize={fontSize}
          fontFamily="monospace"
        >
          {Math.round(clamped)}
        </text>

        {/* Level label */}
        <text
          x={cx}
          y={cy + fontSize * 0.35 + labelFontSize + 4}
          textAnchor="middle"
          fill={progressColor}
          fontSize={labelFontSize}
          fontWeight="600"
        >
          {shortLevel}
        </text>
      </svg>
    </div>
  );
}
