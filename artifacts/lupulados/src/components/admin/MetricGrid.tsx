export function MetricGrid({ metrics }: { metrics: [string, number][] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map(([label, value]) => (
        <div key={label} className="bg-card border border-white/10 rounded-lg p-5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-primary">{value}</p>
        </div>
      ))}
    </div>
  );
}
