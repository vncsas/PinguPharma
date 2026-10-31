import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

export const dateBR = (d: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export const dayShort = (d: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d));

export const dayBR = (d: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function formatCpf(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatCns(v: string) {
  const d = onlyDigits(v).slice(0, 15);
  return d.replace(/^(\d{3})(\d)/, "$1 $2").replace(/^(\d{3}) (\d{4})(\d)/, "$1 $2 $3").replace(/^(\d{3}) (\d{4}) (\d{4})(\d)/, "$1 $2 $3 $4");
}

export function isValidCpf(input: string) {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(cpf[len])) return false;
  }
  return true;
}

export function isValidCns(input: string) {
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

export function errMsg(err: unknown, fallback = "Não foi possível concluir a operação") {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
