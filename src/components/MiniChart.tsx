interface Point { value: number }

interface LineChartProps {
  data: Point[];
  height?: number;
  color?: string;
  goalValue?: number;
  goalColor?: string;
  showDots?: boolean;
  fillOpacity?: number;
}

export function LineChart({
  data, height = 48, color = '#3b82f6', goalValue,
  goalColor = '#ef4444', showDots = false, fillOpacity = 0.1,
}: LineChartProps) {
  if (!data.length) return null;
  const w = 200;
  const h = height;
  const pad = { t: 4, r: 4, b: 4, l: 4 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const vals = data.map(d => d.value);
  const min = Math.min(...vals) * 0.9;
  const max = Math.max(...vals) * 1.1;

  function xPos(i: number) { return pad.l + (i / (data.length - 1)) * iw; }
  function yPos(v: number) { return pad.t + ih - ((v - min) / (max - min)) * ih; }

  const pts = data.map((d, i) => `${xPos(i)},${yPos(d.value)}`).join(' ');
  const first = data[0];
  const last = data[data.length - 1];
  const fillPath = `M${xPos(0)},${yPos(first.value)} ${data.map((d, i) => `L${xPos(i)},${yPos(d.value)}`).join(' ')} L${xPos(data.length - 1)},${h - pad.b} L${xPos(0)},${h - pad.b} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="overflow-visible">
      <path d={fillPath} fill={color} fillOpacity={fillOpacity} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {goalValue !== undefined && (() => {
        const gy = yPos(goalValue);
        return gy >= pad.t && gy <= h - pad.b
          ? <line x1={pad.l} y1={gy} x2={w - pad.r} y2={gy} stroke={goalColor} strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
          : null;
      })()}
      {showDots && data.map((d, i) => (
        <circle key={i} cx={xPos(i)} cy={yPos(d.value)} r="2" fill={color} />
      ))}
      {/* last dot */}
      <circle cx={xPos(data.length - 1)} cy={yPos(last.value)} r="2.5" fill={color} />
    </svg>
  );
}

interface BarChartProps {
  data: Point[];
  labels?: string[];
  height?: number;
  color?: string;
  highlightLast?: boolean;
}

export function BarChart({ data, labels, height = 64, color = '#3b82f6', highlightLast = true }: BarChartProps) {
  if (!data.length) return null;
  const w = 200;
  const h = height;
  const padB = labels ? 14 : 4;
  const pad = { t: 4, r: 4, b: padB, l: 4 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const vals = data.map(d => d.value);
  const max = Math.max(...vals) * 1.1;
  const barW = (iw / data.length) * 0.65;
  const gap = iw / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      {data.map((d, i) => {
        const bh = (d.value / max) * ih;
        const x = pad.l + i * gap + (gap - barW) / 2;
        const y = pad.t + ih - bh;
        const isLast = highlightLast && i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} fill={isLast ? color : color} opacity={isLast ? 1 : 0.45} rx="1" />
            {labels && (
              <text x={x + barW / 2} y={h - 1} textAnchor="middle" fontSize="7" fill="#94a3b8">
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

interface GaugeProps {
  pct: number;
  color: string;
  size?: number;
}

export function Gauge({ pct, color, size = 56 }: GaugeProps) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}
