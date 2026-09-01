/**
 * Small, dependency-free inline-SVG charts (per the dataviz skill: no new
 * charting library needed for this). Every value plotted here comes straight
 * from pilot_metrics — nothing invented to make a chart look fuller.
 */

const BAR_COLOR = "var(--brand-600)";
const TARGET_COLOR = "var(--false-info)";

interface Datum {
  label: string;
  value: number;
}

/** Horizontal bars vs. a single dashed target line — e.g. "% alerts within 30 min" vs. the SRS's 80% target. */
export function TargetBarChart({
  title,
  unit,
  target,
  targetLabel,
  data,
}: {
  title: string;
  unit: string;
  target: number;
  targetLabel: string;
  data: Datum[];
}) {
  const width = 480;
  const rowH = 34;
  const chartTop = 8;
  const chartLeft = 132;
  const chartRight = width - 16;
  const chartWidth = chartRight - chartLeft;
  const maxScale = Math.max(target, ...data.map((d) => d.value)) * 1.15 || 1;
  const height = chartTop + data.length * rowH + 24;
  const x = (v: number) => chartLeft + (v / maxScale) * chartWidth;
  const targetX = x(target);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-foreground/50">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: BAR_COLOR }} />
            Actual
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0 w-3 border-t-2 border-dashed" style={{ borderColor: TARGET_COLOR }} />
            {targetLabel}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full" role="img" aria-label={`${title}, values in ${unit}`}>
        {/* recessive gridlines at 0/25/50/75/100% of scale */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={chartLeft + f * chartWidth}
            x2={chartLeft + f * chartWidth}
            y1={chartTop}
            y2={chartTop + data.length * rowH}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}

        {data.map((d, i) => {
          const y = chartTop + i * rowH;
          const barW = Math.max(0, x(d.value) - chartLeft);
          return (
            <g key={d.label}>
              <text x={chartLeft - 10} y={y + rowH / 2 + 4} textAnchor="end" fontSize={12} fill="var(--foreground)" opacity={0.75}>
                {d.label}
              </text>
              <rect x={chartLeft} y={y + 7} width={Math.max(barW, 3)} height={20} rx={4} fill={BAR_COLOR}>
                <title>{`${d.label}: ${d.value}${unit}`}</title>
              </rect>
              <text x={x(d.value) + 8} y={y + rowH / 2 + 4} fontSize={12} fontWeight={600} fill="var(--foreground)">
                {d.value}
                {unit}
              </text>
            </g>
          );
        })}

        <line
          x1={targetX}
          x2={targetX}
          y1={chartTop}
          y2={chartTop + data.length * rowH}
          stroke={TARGET_COLOR}
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        <text x={targetX} y={chartTop + data.length * rowH + 16} textAnchor="middle" fontSize={11} fill={TARGET_COLOR}>
          target {target}
          {unit}
        </text>
      </svg>
    </div>
  );
}

/** Simple horizontal comparison bars for a raw count — no target line. */
export function ComparisonBarChart({ title, unit, data }: { title: string; unit: string; data: Datum[] }) {
  const width = 480;
  const rowH = 34;
  const chartTop = 8;
  const chartLeft = 132;
  const chartRight = width - 16;
  const chartWidth = chartRight - chartLeft;
  const maxScale = Math.max(...data.map((d) => d.value)) * 1.15 || 1;
  const height = chartTop + data.length * rowH + 8;
  const x = (v: number) => chartLeft + (v / maxScale) * chartWidth;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full" role="img" aria-label={`${title}, values in ${unit}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={chartLeft + f * chartWidth}
            x2={chartLeft + f * chartWidth}
            y1={chartTop}
            y2={chartTop + data.length * rowH}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        {data.map((d, i) => {
          const y = chartTop + i * rowH;
          const barW = Math.max(0, x(d.value) - chartLeft);
          return (
            <g key={d.label}>
              <text x={chartLeft - 10} y={y + rowH / 2 + 4} textAnchor="end" fontSize={12} fill="var(--foreground)" opacity={0.75}>
                {d.label}
              </text>
              <rect x={chartLeft} y={y + 7} width={Math.max(barW, 3)} height={20} rx={4} fill={BAR_COLOR}>
                <title>{`${d.label}: ${d.value}${unit}`}</title>
              </rect>
              <text x={x(d.value) + 8} y={y + rowH / 2 + 4} fontSize={12} fontWeight={600} fill="var(--foreground)">
                {d.value}
                {unit}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
