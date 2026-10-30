/** Data local `YYYY-MM-DD` deslocada em `offsetDays` dias a partir de hoje. */
export function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
