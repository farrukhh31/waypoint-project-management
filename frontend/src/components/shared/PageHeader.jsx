export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{action}</div>}
    </div>
  );
}
