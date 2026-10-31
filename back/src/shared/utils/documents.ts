export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(input: string): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const dv = ((sum * 10) % 11) % 10;
    if (dv !== Number(cpf[len])) return false;
  }
  return true;
}

export function isValidCns(input: string): boolean {
  const cns = onlyDigits(input);
  if (cns.length !== 15) return false;
  const first = cns[0];
  if (first === "1" || first === "2") {
    const pis = cns.slice(0, 11);
    let sum = 0;
    for (let i = 0; i < 11; i++) sum += Number(pis[i]) * (15 - i);
    let dv = 11 - (sum % 11);
    if (dv === 11) dv = 0;
    let expected: string;
    if (dv === 10) {
      sum += 2;
      dv = 11 - (sum % 11);
      expected = `${pis}001${dv}`;
    } else {
      expected = `${pis}000${dv}`;
    }
    return expected === cns;
  }
  if (first === "7" || first === "8" || first === "9") {
    let sum = 0;
    for (let i = 0; i < 15; i++) sum += Number(cns[i]) * (15 - i);
    return sum % 11 === 0;
  }
  return false;
}

export function maskCpf(cpf: string | null): string | null {
  if (!cpf) return null;
  const d = onlyDigits(cpf);
  if (d.length !== 11) return "***";
  return `***.${d.slice(3, 6)}.***-${d.slice(9)}`;
}

export function maskCns(cns: string | null): string | null {
  if (!cns) return null;
  const d = onlyDigits(cns);
  if (d.length < 4) return "***";
  return `***********${d.slice(-4)}`;
}
