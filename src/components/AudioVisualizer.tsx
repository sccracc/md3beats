import { motion, useReducedMotion } from "motion/react";

interface AudioVisualizerProps {
  size?: "sm" | "lg";
  className?: string;
}

const bars = [
  32, 48, 24, 64, 84, 42, 72, 36, 92, 58, 30, 76,
  50, 96, 40, 68, 88, 34, 74, 46, 62, 28, 82, 54,
];

export default function AudioVisualizer({ size = "lg", className = "" }: AudioVisualizerProps) {
  const reducedMotion = useReducedMotion();
  const width = size === "lg" ? 420 : 220;
  const height = size === "lg" ? 180 : 84;
  const barWidth = size === "lg" ? 8 : 4;
  const gap = size === "lg" ? 9 : 5;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      className={`h-auto w-full overflow-visible ${className}`}
      role="img"
    >
      <defs>
        <linearGradient id={`eq-gradient-${size}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#00D1FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00D1FF" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size === "lg" ? 10 : 6} 0)`}>
        {bars.map((bar, index) => {
          const x = index * (barWidth + gap);
          const barHeight = (bar / 100) * (height * 0.76);
          const y = (height - barHeight) / 2;
          const duration = 0.8 + (index % 6) * 0.2;

          return (
            <motion.rect
              key={`${bar}-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2}
              fill={`url(#eq-gradient-${size})`}
              initial={false}
              animate={
                reducedMotion
                  ? { y }
                  : {
                      y: [y, y - 16 - (index % 5) * 3, y + 10, y],
                      opacity: [0.16, 0.3, 0.2, 0.16],
                    }
              }
              transition={{
                duration: reducedMotion ? 0 : duration,
                repeat: reducedMotion ? 0 : Infinity,
                repeatType: "mirror",
                delay: index * 0.035,
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
