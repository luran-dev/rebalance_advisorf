export function MetricTile({
  label,
  value,
  tone = "neutral",
}: {
  readonly label: string;
  readonly value: string;
  readonly tone?: "neutral" | "gain" | "loss" | "warning";
}) {
  return (
    <section className={`metric metric-${tone}`} aria-label={label}>
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
