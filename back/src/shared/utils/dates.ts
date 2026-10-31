const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseFilterDate(input: string, endOfDay = false): Date {
  const m = DATE_ONLY.exec(input);
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const date = endOfDay ? new Date(y, mo - 1, d, 23, 59, 59, 999) : new Date(y, mo - 1, d, 0, 0, 0, 0);
    if (date.getMonth() !== mo - 1 || date.getDate() !== d) return new Date(NaN);
    return date;
  }
  return new Date(input);
}

export function isValidFilterDate(input: string): boolean {
  return !Number.isNaN(parseFilterDate(input).getTime());
}
