import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { BarStack } from '@visx/shape';
import { defaultStyles, useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { useMemo } from 'react';

import type { ChartBucket, ChartSummary } from '~/data/types';
import { useHoverStore } from '~/state/hoverStore';
import { formatCount, formatDelta } from '~/lib/time';

type BucketRow = ChartBucket & { index: number };

const KEYS = ['success', 'error'] as const;
type Key = (typeof KEYS)[number];

const VIEWBOX_WIDTH = 1024;
const VIEWBOX_HEIGHT = 200;
const MARGIN = { top: 12, right: 12, bottom: 22, left: 36 };

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
        <div className="chart-divider" aria-hidden="true" />
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
      <ChartBody buckets={summary.buckets} onBucketClick={onBucketClick} />
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

function ChartBody({
  buckets,
  onBucketClick,
}: {
  buckets: ChartBucket[];
  onBucketClick?: (bucket: ChartBucket, index: number) => void;
}) {
  const hoveredBucket = useHoverStore((s) => s.hoveredBucket);
  const setHoveredBucket = useHoverStore((s) => s.setHoveredBucket);

  const data: BucketRow[] = useMemo(
    () => buckets.map((b, i) => ({ ...b, index: i })),
    [buckets],
  );

  const innerWidth = VIEWBOX_WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = VIEWBOX_HEIGHT - MARGIN.top - MARGIN.bottom;

  const xScale = useMemo(
    () =>
      scaleBand<number>({
        domain: data.map((d) => d.index),
        range: [0, innerWidth],
        padding: 0.25,
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

  const color: Record<Key, string> = {
    success: 'var(--color-chart-success)',
    error: 'var(--color-chart-error)',
  };

  const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
    useTooltip<BucketRow>();
  const { containerRef, containerBounds, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  return (
    <div className="chart-body" ref={containerRef}>
      <svg
        width="100%"
        height={VIEWBOX_HEIGHT}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Stacked bar chart of API request volume by time bucket"
      >
        <Group left={MARGIN.left} top={MARGIN.top}>
          {/* Subtle horizontal grid at each Y tick — anchors the eye to scale. */}
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
              letterSpacing: '0.02em',
              textAnchor: 'end',
              dx: -8,
              dy: 4,
            })}
            stroke="transparent"
            tickStroke="transparent"
          />
          <BarStack<BucketRow, Key>
            data={data}
            keys={KEYS as unknown as Key[]}
            x={(d) => d.index}
            xScale={xScale}
            yScale={yScale}
            color={(key) => color[key]}
          >
            {(stacks) =>
              stacks.map((stack) =>
                stack.bars.map((bar) => {
                  const isHighlighted = hoveredBucket === bar.index;
                  const isDimmed = hoveredBucket !== null && hoveredBucket !== bar.index;
                  return (
                    <rect
                      key={`${stack.index}-${bar.index}`}
                      className="chart-bar"
                      data-highlighted={isHighlighted || undefined}
                      data-dimmed={isDimmed || undefined}
                      style={{ animationDelay: `${bar.index * 6}ms`, transformOrigin: 'bottom' }}
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      fill={bar.color}
                      rx={1.5}
                      onMouseEnter={() => setHoveredBucket(bar.index)}
                      onMouseLeave={() => {
                        setHoveredBucket(null);
                        hideTooltip();
                      }}
                      onMouseMove={(event) => {
                        const svg = event.currentTarget.ownerSVGElement as SVGSVGElement;
                        const rect = svg.getBoundingClientRect();
                        showTooltip({
                          tooltipData: data[bar.index],
                          tooltipLeft: event.clientX - containerBounds.left,
                          tooltipTop: event.clientY - rect.top - 20,
                        });
                      }}
                      onClick={() => onBucketClick?.(data[bar.index], bar.index)}
                    />
                  );
                }),
              )
            }
          </BarStack>
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            tickValues={tickIndices}
            tickFormat={(idx) => {
              const bucket = data[idx as number];
              if (!bucket) return '';
              const d = new Date(bucket.timestamp);
              return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }}
            tickLabelProps={() => ({
              fill: 'var(--color-chart-axis)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.04em',
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
