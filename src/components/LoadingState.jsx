// Central loading surface for the storefront. Pages render this instead of
// blank content while their data is in flight, so the customer always gets
// feedback that something is happening.
function LoadingState({ label = "Loading...", variant = "spinner", size = "", count = 3, compact = false }) {
  if (variant === "skeleton") {
    return (
      <div className="skeleton-grid" aria-busy="true" aria-live="polite" aria-label={label} role="status">
        {Array.from({ length: count }).map((_, index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton skeleton-block" />
            <div className="skeleton skeleton-line skeleton-line--title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-line--short" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "rows") {
    return (
      <div className="skeleton-rows" aria-busy="true" aria-live="polite" aria-label={label} role="status">
        {Array.from({ length: count }).map((_, index) => (
          <div className="skeleton-row" key={index}>
            <div className="skeleton skeleton-avatar" />
            <div>
              <div className="skeleton skeleton-line skeleton-line--title" />
              <div className="skeleton skeleton-line skeleton-line--short" />
            </div>
            <div className="skeleton skeleton-line" style={{ width: 56 }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div className="loading-state" aria-busy="true" aria-live="polite" role="status">
        <span className={`spinner${size ? ` spinner--${size}` : ""}`} />
        <span>{label}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <span className="pending-hint" aria-busy="true" role="status">
        <span className="mini-spinner" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div className="loading-state" aria-busy="true" aria-live="polite" role="status">
      <span className={`spinner${size ? ` spinner--${size}` : ""}`} />
      <span>{label}</span>
    </div>
  );
}

export { LoadingState };
