/**
 * Skeleton states for the chart and table. Match the real layout so swap-in
 * doesn't cause layout shift. Shimmer animation is purely CSS.
 */

const ROW_COUNT = 10;

export function ChartSkeleton() {
  return (
    <section className="chart-card chart-skeleton" aria-busy="true" aria-label="Loading chart">
      <header className="chart-header">
        <div className="chart-hero">
          <span className="chart-eyebrow">API Requests</span>
          <span className="chart-hero-value skeleton-shimmer skeleton-block" style={{ width: 220, height: 56 }} />
          <span className="chart-hero-delta skeleton-shimmer skeleton-block" style={{ width: 140, height: 14 }} />
        </div>
        <div className="chart-stats">
          {(['Success', 'Error'] as const).map((label) => (
            <span className="stat" key={label}>
              <span className="stat-label">{label}</span>
              <span className="stat-value skeleton-shimmer skeleton-block" style={{ width: 80, height: 22 }} />
              <span className="stat-delta skeleton-shimmer skeleton-block" style={{ width: 30, height: 12 }} />
            </span>
          ))}
        </div>
      </header>
      <div className="chart-body chart-skeleton-body">
        <div className="skeleton-bars">
          {Array.from({ length: 60 }).map((_, i) => {
            const h = 30 + ((i * 37) % 60); // deterministic varied heights
            return <span key={i} className="skeleton-bar skeleton-shimmer" style={{ height: `${h}%` }} />;
          })}
        </div>
      </div>
    </section>
  );
}

export function TableSkeleton() {
  return (
    <section className="logs-table-card" aria-busy="true" aria-label="Loading logs">
      <div className="logs-table-scroll">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Requested</th>
              <th>Account</th>
              <th>Source</th>
              <th>Request</th>
              <th>Duration</th>
              <th>Status</th>
              <th aria-hidden="true" />
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROW_COUNT }).map((_, i) => (
              <tr key={i}>
                <td><span className="skeleton-shimmer skeleton-block" style={{ width: 160, height: 12 }} /></td>
                <td><span className="skeleton-row-cell"><span className="skeleton-shimmer skeleton-avatar" /><span className="skeleton-shimmer skeleton-block" style={{ width: 140, height: 12 }} /></span></td>
                <td><span className="skeleton-shimmer skeleton-block" style={{ width: 120, height: 12 }} /></td>
                <td><span className="skeleton-shimmer skeleton-block" style={{ width: 280, height: 12 }} /></td>
                <td><span className="skeleton-shimmer skeleton-block" style={{ width: 60, height: 12 }} /></td>
                <td><span className="skeleton-shimmer skeleton-block" style={{ width: 36, height: 18, borderRadius: 'var(--radius-sm)' }} /></td>
                <td><span className="skeleton-shimmer skeleton-block" style={{ width: 16, height: 16, borderRadius: 'var(--radius-sm)' }} /></td>
                <td><span className="skeleton-shimmer skeleton-block" style={{ width: 12, height: 12, borderRadius: 'var(--radius-sm)' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
