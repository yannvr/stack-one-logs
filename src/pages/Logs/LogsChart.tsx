import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear } from '@visx/scale';
import { defaultStyles, useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { useId, useMemo } from 'react';

import type { ChartBucket, ChartSummary } from '~/data/types';
import { useHoverStore } from '~/state/hoverStore';
import { formatCount, formatDelta } from '~/lib/time';

type BucketRow = ChartBucket & { index: number };

const CHART_HEIGHT = 220;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 36 };

type Props = {
  summary: ChartSummary;
  onBucketClick?: (bucket: ChartBucket, index: number) => void;
};

export function LogsChart({ summary, onBucketClick }: Props) {
  return (
    <section className="chart-card" aria-labelledby="chart-heading">
      <header className="chart-header">
        <div className="chart-hero">
          <span className="chart-eyebrow" id="chart-heading">
            API Requests <span className="dot-sep">·</span> last 12 minutes
          </span>
          <span className="chart-hero-value">{formatCount(summary.totals.total)}</span>
          <span className="chart-hero-delta">
            <Delta value={summary.totals.totalDelta} />
            <span className="chart-hero-delta-label">vs prior period</span>
          </span>
        </div>
        <div className="chart-stats">
          <Stat
            label="Success"
            value={summary.totals.success}
            delta={summary.totals.successDelta}
            dot="success"
          />
          <Stat
            label="Error"
            value={summary.totals.error}
            delta={summary.totals.errorDelta}
            dot="error"
          />
        </div>
      </header>
      <ParentSize parentSizeStyles={{ height: CHART_HEIGHT }}>
        {({ width }) => (width > 0 ? <ChartBody buckets={summary.buckets} width={width} onBucketClick={onBucketClick} /> : null)}
      </ParentSize>
    </section>
  );
}

function Delta({ value }: { value: number }) {
  const d = formatDelta(value);
  return (
    <span className="stat-delta" data-sign={d.sign}>
      {d.text}
    </span>
  );
}

type StatProps = {
  label: string;
  value: number;
  delta: number;
  dot: 'success' | 'error' | 'neutral';
};

function Stat({ label, value, delta, dot }: StatProps) {
  return (
    <span className="stat" data-dot={dot}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{formatCount(value)}</span>
      <Delta value={delta} />
    </span>
  );
}

type ChartBodyProps = {
  buckets: ChartBucket[];
  width: number;
  onBucketClick?: (bucket: ChartBucket, index: number) => void;
};

function ChartBody({ buckets, width, onBucketClick }: ChartBodyProps) {
  const hoveredBucket = useHoverStore((s) => s.hoveredBucket);
  const hoverFromBar = useHoverStore((s) => s.hoverFromBar);
  const gradientId = useId();

  const data: BucketRow[] = useMemo(
    () => buckets.map((b, i) => ({ ...b, index: i })),
    [buckets],
  );

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  const xScale = useMemo(
    () =>
      scaleBand<number>({
        domain: data.map((d) => d.index),
        range: [0, innerWidth],
        padding: 0.22,
      }),
    [data, innerWidth],
  );

  const yMax = useMemo(
    () => Math.max(...data.map((d) => d.success + d.error), 1),
    [data],
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, yMax * 1.15],
        range: [innerHeight, 0],
        nice: true,
      }),
    [yMax, innerHeight],
  );

  const tickIndices = useMemo(() => {
    const step = Math.max(1, Math.ceil(data.length / 8));
    return data.filter((_, i) => i % step === 0).map((d) => d.index);
  }, [data]);

  const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
    useTooltip<BucketRow>();
  const { containerRef, containerBounds, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  return (
    <div className="chart-body" ref={containerRef}>
      <svg
        width={width}
        height={CHART_HEIGHT}
        role="img"
        aria-label="Stacked bar chart of API request volume by time bucket"
      >
        <defs>
          {/* Per-bucket gradients with a hard stop at the error/success boundary —
              produces a single visually-continuous bar per bucket instead of
              two stacked rects with a visible seam. */}
          {data.map((d) => {
            const total = d.success + d.error;
            const errorRatio = total === 0 ? 0 : d.error / total;
            return (
              <linearGradient
                key={d.index}
                id={`${gradientId}-${d.index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="var(--color-chart-error)" />
                <stop offset={`${errorRatio * 100}%`} stopColor="var(--color-chart-error)" />
                <stop offset={`${errorRatio * 100}%`} stopColor="var(--color-chart-success)" />
                <stop offset="100%" stopColor="var(--color-chart-success)" />
              </linearGradient>
            );
          })}
        </defs>
        <Group left={MARGIN.left} top={MARGIN.top}>
          {/* Subtle dashed gridlines at each Y tick. */}
          {yScale.ticks(3).map((tick) => {
            const y = yScale(tick);
            if (tick === 0) return null;
            return (
              <line
                key={tick}
                className="chart-grid-line"
                x1={0}
                x2={innerWidth}
                y1={y}
                y2={y}
              />
            );
          })}
          <AxisLeft
            scale={yScale}
            numTicks={3}
            tickFormat={(v) => {
              const n = v as number;
              if (n === 0) return '0';
              return `${Math.round(n / 1000)}k`;
            }}
            tickLabelProps={() => ({
              fill: 'var(--color-chart-axis)',
              fontSize: 10,
              fontWeight: 500,
              textAnchor: 'end',
              dx: -8,
              dy: 4,
            })}
            stroke="transparent"
            tickStroke="transparent"
          />
          {/* One rect per bucket using the matching gradient. Single hover region. */}
          {data.map((d) => {
            const total = d.success + d.error;
            const x = xScale(d.index) ?? 0;
            const w = xScale.bandwidth();
            const h = innerHeight - yScale(total);
            const y = yScale(total);
            const isHighlighted = hoveredBucket === d.index;
            const isDimmed = hoveredBucket !== null && hoveredBucket !== d.index;
            return (
              <rect
                key={d.index}
                className="chart-bar"
                data-highlighted={isHighlighted || undefined}
                data-dimmed={isDimmed || undefined}
                style={{ animationDelay: `${d.index * 8}ms`, transformOrigin: 'bottom' }}
                x={x}
                y={y}
                width={w}
                height={h}
                rx={2}
                fill={`url(#${gradientId}-${d.index})`}
                onMouseEnter={() => hoverFromBar(d.index)}
                onMouseLeave={() => {
                  hoverFromBar(null);
                  hideTooltip();
                }}
                onMouseMove={(event) => {
                  const svg = event.currentTarget.ownerSVGElement as SVGSVGElement;
                  const rect = svg.getBoundingClientRect();
                  showTooltip({
                    tooltipData: d,
                    tooltipLeft: event.clientX - containerBounds.left,
                    tooltipTop: event.clientY - rect.top - 20,
                  });
                }}
                onClick={() => onBucketClick?.(d, d.index)}
              />
            );
          })}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            tickValues={tickIndices}
            tickFormat={(idx) => {
              const bucket = data[idx as number];
              if (!bucket) return '';
              const date = new Date(bucket.timestamp);
              return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            }}
            tickLabelProps={() => ({
              fill: 'var(--color-chart-axis)',
              fontSize: 10,
              fontWeight: 500,
              textAnchor: 'middle',
              dy: 8,
            })}
            stroke="transparent"
            tickStroke="transparent"
          />
        </Group>
      </svg>
      {tooltipOpen && tooltipData ? (
        <TooltipInPortal
          top={tooltipTop}
          left={tooltipLeft}
          style={{ ...defaultStyles, padding: 0, background: 'transparent', boxShadow: 'none' }}
        >
          <div className="chart-tooltip">
            <div className="chart-tooltip-row">
              <span className="dot dot-success" /> {formatCount(tooltipData.success)}
            </div>
            <div className="chart-tooltip-row">
              <span className="dot dot-error" /> {formatCount(tooltipData.error)}
            </div>
          </div>
        </TooltipInPortal>
      ) : null}
    </div>
  );
}
