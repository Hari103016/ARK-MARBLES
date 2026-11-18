export default function EmptyState({
  title = "Nothing here yet",
  description = "There is no data to display right now.",
  actionLabel,
  onAction,
  icon,
}) {
  return (
    <section className="empty-state" role="status">
      {icon && (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}

      <h2>{title}</h2>

      {description && <p>{description}</p>}

      {actionLabel && onAction && (
        <button
          type="button"
          className="app-button app-button-primary"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}