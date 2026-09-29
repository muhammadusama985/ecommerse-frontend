// Admin loading surfaces. The dashboard uses skeletons so a reload does not
// collapse the layout, and forms use the compact spinner variant.
function AdminLoading({ label = "Loading...", variant = "spinner", count = 5, size = "" }) {
  if (variant === "table") {
    return (
      <div className="admin-skeleton-rows" aria-busy="true" aria-live="polite" role="status" aria-label={label}>
        {Array.from({ length: count }).map((_, index) => (
          <div className="admin-skeleton-row" key={index}>
            <div className="admin-skeleton" />
            <div className="admin-skeleton" />
            <div className="admin-skeleton" />
            <div className="admin-skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "stats") {
    return (
      <div className="admin-skeleton-stats" aria-busy="true" aria-live="polite" role="status" aria-label={label}>
        {Array.from({ length: count }).map((_, index) => (
          <div className="admin-skeleton admin-skeleton-stat" key={index} />
        ))}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="admin-skeleton-cards" aria-busy="true" aria-live="polite" role="status" aria-label={label}>
        {Array.from({ length: count }).map((_, index) => (
          <div className="admin-skeleton admin-skeleton-card" key={index} />
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span className="admin-pending" aria-busy="true" role="status">
        <span className="admin-spinner admin-spinner--sm" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div className="admin-loading" aria-busy="true" aria-live="polite" role="status">
      <span className={`admin-spinner${size ? ` admin-spinner--${size}` : ""}`} />
      <span>{label}</span>
    </div>
  );
}

export { AdminLoading };
