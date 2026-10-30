export function MiniCalendar() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = today
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <div>
      <p className="text-xs font-semibold text-ink mb-2">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-ink-subtle font-medium py-1">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const isToday = d === today.getDate();
          return (
            <div
              key={i}
              className={`text-[11px] py-1 rounded ${d === null ? "text-transparent" : isToday ? "bg-brand-500 text-white font-semibold" : "text-ink-muted hover:bg-surface-alt cursor-pointer"}`}
            >
              {d ?? 0}
            </div>
          );
        })}
      </div>
    </div>
  );
}
