import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

if (process.env.NODE_ENV === "production") {
  console.error("Seed recusado: NODE_ENV=production.");
  process.exit(1);
}

const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
if (!SEED_PASSWORD || SEED_PASSWORD.length < 8) {
  console.error("SEED_ADMIN_PASSWORD ausente ou < 8 caracteres. Defina no .env antes de rodar o seed.");
  process.exit(1);
}

// Idempotente: registros do seed usam ids com prefixo "seed_" (ou chaves naturais: e-mail, SKU).
// A cada execucao, dados transacionais do seed (lotes, movimentos, dispensacoes, receitas,
// transferencias, logs) sao removidos e recriados. Dados criados manualmente nao sao tocados.

// ─── Utilidades ──────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260930);
const rint = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, rint(0, 59), 0, 0);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function cpfFromBase(base9: string): string {
  const nums = base9.split("").map(Number);
  const dv = (arr: number[]) => {
    const sum = arr.reduce((s, n, i) => s + n * (arr.length + 1 - i), 0);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(nums);
  const d2 = dv([...nums, d1]);
  return `${base9}${d1}${d2}`;
}

function cnsFromPis(pis: string): string {
  let sum = 0;
  for (let i = 0; i < 11; i++) sum += Number(pis[i]) * (15 - i);
  let dv = 11 - (sum % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) {
    sum += 2;
    dv = 11 - (sum % 11);
    if (dv === 11) dv = 0;
    return `${pis}001${dv}`;
  }
  return `${pis}000${dv}`;
}
function isValidCns(cns: string): boolean {
  if (!/^\d{15}$/.test(cns)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) sum += Number(cns[i]) * (15 - i);
  return sum % 11 === 0;
}

function cnpjFromBase(base12: string): string {
  const nums = base12.split("").map(Number);
  const dv = (arr: number[], weights: number[]) => {
    const r = arr.reduce((s, n, i) => s + n * weights[i], 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(nums, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = dv([...nums, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base12}${d1}${d2}`;
}

// ─── Dados ───────────────────────────────────────────────────────────────────

const UNITS = [
  { id: "unit_central", key: "central", slug: "central", name: "Central de Abastecimento Farmacêutico", cnes: "2000001", type: "CENTRAL" },
  { id: "unit_ubs_centro", key: "centro", slug: "centro", name: "UBS Centro", cnes: "2000002", type: "UBS" },
  { id: "unit_ubs_jardim", key: "jardim", slug: "jardim", name: "UBS Jardim das Flores", cnes: "2000003", type: "UBS" },
] as const;
type UnitKey = (typeof UNITS)[number]["key"];

// renameCode = codigo ATC do principio ativo (referencia da RENAME)
interface ProductSeed {
  sku: string;
  name: string;
  activeIngredient: string;
  presentation: string;
  measureUnit: string;
  manufacturer: string;
  renameCode: string;
  price: number;
  min: number;
  controlledClass?: string;
  disp: [number, number];
}

const PRODUCTS: ProductSeed[] = [
  { sku: "RN-PARA500", name: "Paracetamol 500 mg", activeIngredient: "Paracetamol", presentation: "Comprimido 500 mg", measureUnit: "comprimido", manufacturer: "EMS", renameCode: "N02BE01", price: 0.12, min: 400, disp: [12, 40] },
  { sku: "RN-DIPI500", name: "Dipirona sódica 500 mg", activeIngredient: "Dipirona sódica", presentation: "Comprimido 500 mg", measureUnit: "comprimido", manufacturer: "Medley", renameCode: "N02BB02", price: 0.1, min: 400, disp: [10, 30] },
  { sku: "RN-IBUP600", name: "Ibuprofeno 600 mg", activeIngredient: "Ibuprofeno", presentation: "Comprimido revestido 600 mg", measureUnit: "comprimido", manufacturer: "Eurofarma", renameCode: "M01AE01", price: 0.25, min: 250, disp: [10, 30] },
  { sku: "RN-AMOX500", name: "Amoxicilina 500 mg", activeIngredient: "Amoxicilina tri-hidratada", presentation: "Cápsula 500 mg", measureUnit: "cápsula", manufacturer: "Eurofarma", renameCode: "J01CA04", price: 0.45, min: 300, disp: [21, 21] },
  { sku: "RN-AZIT500", name: "Azitromicina 500 mg", activeIngredient: "Azitromicina di-hidratada", presentation: "Comprimido revestido 500 mg", measureUnit: "comprimido", manufacturer: "Neo Química", renameCode: "J01FA10", price: 1.8, min: 90, disp: [3, 5] },
  { sku: "RN-CEFA500", name: "Cefalexina 500 mg", activeIngredient: "Cefalexina", presentation: "Cápsula 500 mg", measureUnit: "cápsula", manufacturer: "Teuto", renameCode: "J01DB01", price: 0.7, min: 200, disp: [28, 28] },
  { sku: "RN-LOSA050", name: "Losartana potássica 50 mg", activeIngredient: "Losartana potássica", presentation: "Comprimido revestido 50 mg", measureUnit: "comprimido", manufacturer: "EMS", renameCode: "C09CA01", price: 0.15, min: 600, disp: [30, 60] },
  { sku: "RN-CAPT025", name: "Captopril 25 mg", activeIngredient: "Captopril", presentation: "Comprimido 25 mg", measureUnit: "comprimido", manufacturer: "Medley", renameCode: "C09AA01", price: 0.09, min: 500, disp: [30, 60] },
  { sku: "RN-ENAL010", name: "Enalapril 10 mg", activeIngredient: "Maleato de enalapril", presentation: "Comprimido 10 mg", measureUnit: "comprimido", manufacturer: "Eurofarma", renameCode: "C09AA02", price: 0.11, min: 500, disp: [30, 60] },
  { sku: "RN-ATEN050", name: "Atenolol 50 mg", activeIngredient: "Atenolol", presentation: "Comprimido 50 mg", measureUnit: "comprimido", manufacturer: "Neo Química", renameCode: "C07AB03", price: 0.14, min: 400, disp: [30, 60] },
  { sku: "RN-HIDR025", name: "Hidroclorotiazida 25 mg", activeIngredient: "Hidroclorotiazida", presentation: "Comprimido 25 mg", measureUnit: "comprimido", manufacturer: "Teuto", renameCode: "C03AA03", price: 0.08, min: 400, disp: [30, 60] },
  { sku: "RN-METF850", name: "Cloridrato de metformina 850 mg", activeIngredient: "Cloridrato de metformina", presentation: "Comprimido revestido 850 mg", measureUnit: "comprimido", manufacturer: "EMS", renameCode: "A10BA02", price: 0.2, min: 600, disp: [60, 90] },
  { sku: "RN-GLIB005", name: "Glibenclamida 5 mg", activeIngredient: "Glibenclamida", presentation: "Comprimido 5 mg", measureUnit: "comprimido", manufacturer: "Medley", renameCode: "A10BB01", price: 0.1, min: 400, disp: [30, 60] },
  { sku: "RN-INSNPH", name: "Insulina humana NPH 100 UI/mL", activeIngredient: "Insulina humana NPH", presentation: "Suspensão injetável 100 UI/mL, frasco 10 mL", measureUnit: "frasco", manufacturer: "Novo Nordisk", renameCode: "A10AC01", price: 24.5, min: 40, disp: [1, 2] },
  { sku: "RN-OMEP020", name: "Omeprazol 20 mg", activeIngredient: "Omeprazol", presentation: "Cápsula 20 mg", measureUnit: "cápsula", manufacturer: "Eurofarma", renameCode: "A02BC01", price: 0.13, min: 500, disp: [28, 30] },
  { sku: "RN-SINV020", name: "Sinvastatina 20 mg", activeIngredient: "Sinvastatina", presentation: "Comprimido revestido 20 mg", measureUnit: "comprimido", manufacturer: "Neo Química", renameCode: "C10AA01", price: 0.18, min: 400, disp: [30, 60] },
  { sku: "RN-FURO040", name: "Furosemida 40 mg", activeIngredient: "Furosemida", presentation: "Comprimido 40 mg", measureUnit: "comprimido", manufacturer: "Teuto", renameCode: "C03CA01", price: 0.07, min: 300, disp: [30, 60] },
  { sku: "RN-SALB100", name: "Sulfato de salbutamol 100 mcg/dose", activeIngredient: "Sulfato de salbutamol", presentation: "Aerossol 100 mcg/dose, frasco 200 doses", measureUnit: "frasco", manufacturer: "Cristália", renameCode: "R03AC02", price: 9.9, min: 40, disp: [1, 1] },
  { sku: "RN-PRED020", name: "Prednisona 20 mg", activeIngredient: "Prednisona", presentation: "Comprimido 20 mg", measureUnit: "comprimido", manufacturer: "Medley", renameCode: "H02AB07", price: 0.22, min: 200, disp: [10, 30] },
  { sku: "RN-ACFO005", name: "Ácido fólico 5 mg", activeIngredient: "Ácido fólico", presentation: "Comprimido 5 mg", measureUnit: "comprimido", manufacturer: "Neo Química", renameCode: "B03BB01", price: 0.05, min: 400, disp: [30, 60] },
  { sku: "RN-SFER040", name: "Sulfato ferroso 40 mg Fe", activeIngredient: "Sulfato ferroso", presentation: "Comprimido revestido 40 mg Fe", measureUnit: "comprimido", manufacturer: "Teuto", renameCode: "B03AA07", price: 0.06, min: 400, disp: [30, 60] },
  { sku: "RN-ALBE400", name: "Albendazol 400 mg", activeIngredient: "Albendazol", presentation: "Comprimido mastigável 400 mg", measureUnit: "comprimido", manufacturer: "Eurofarma", renameCode: "P02CA03", price: 0.9, min: 120, disp: [1, 3] },
  { sku: "RN-CLON002", name: "Clonazepam 2 mg", activeIngredient: "Clonazepam", presentation: "Comprimido 2 mg", measureUnit: "comprimido", manufacturer: "Cristália", renameCode: "N03AE01", price: 0.3, min: 200, controlledClass: "B1", disp: [30, 30] },
  { sku: "RN-DIAZ010", name: "Diazepam 10 mg", activeIngredient: "Diazepam", presentation: "Comprimido 10 mg", measureUnit: "comprimido", manufacturer: "Cristália", renameCode: "N05BA01", price: 0.28, min: 200, controlledClass: "B1", disp: [30, 30] },
  { sku: "RN-FENO100", name: "Fenobarbital 100 mg", activeIngredient: "Fenobarbital", presentation: "Comprimido 100 mg", measureUnit: "comprimido", manufacturer: "Cristália", renameCode: "N03AA02", price: 0.35, min: 200, controlledClass: "B1", disp: [60, 60] },
];

const PATIENTS = [
  { name: "Maria das Graças Oliveira", base: "123456780", pis: "10234567890", birth: "1958-03-14", phone: "(11) 98765-4321", address: "Rua das Acácias, 120 - Centro", email: "maria.gracas@exemplo.com" },
  { name: "João Batista Santos", base: "234567810", pis: "10345678901", birth: "1949-11-02", phone: "(11) 91234-5678", address: "Av. Brasil, 845 - Centro", email: null },
  { name: "Rosana Ferreira Lima", base: "345678920", pis: "20456789012", birth: "1985-07-21", phone: "(11) 99876-5432", address: "Rua das Palmeiras, 33 - Jardim das Flores", email: "rosana.lima@exemplo.com" },
  { name: "Antônio Carlos Costa", base: "456789030", pis: "10567890123", birth: "1962-01-30", phone: "(11) 98765-1234", address: "Rua dos Ipês, 77 - Centro", email: null },
  { name: "Juliana Pereira Alves", base: "567890140", pis: "20678901234", birth: "1991-09-09", phone: "(11) 97654-3210", address: "Rua das Margaridas, 12 - Jardim das Flores", email: "juliana.alves@exemplo.com" },
  { name: "Roberto Lima Mendes", base: "678901250", pis: "10789012345", birth: "1955-05-18", phone: "(11) 96543-2109", address: "Rua Girassol, 401 - Jardim das Flores", email: null },
  { name: "Cláudia Mendes Rocha", base: "789012360", pis: "20890123456", birth: "1978-12-25", phone: "(11) 95432-1098", address: "Av. das Flores, 560 - Jardim das Flores", email: "claudia.rocha@exemplo.com" },
  { name: "Francisco de Assis Nascimento", base: "890123470", pis: "10901234567", birth: "1940-08-08", phone: "(11) 94321-0987", address: "Rua do Comércio, 9 - Centro", email: null },
];

// ─── Main ────────────────────────────────────────────────────────────────────

interface BatchRec {
  id: string;
  unitKey: UnitKey;
  unitId: string;
  productId: string;
  sku: string;
  lotNumber: string;
  initial: number;
  qty: number;
  costPrice: number;
  expiresAt: Date;
  receivedAt: Date;
  supplierId: string | null;
  document: string | null;
  entryType: string;
}
interface MovRec {
  id: string;
  unitId: string;
  productId: string;
  batchId: string;
  type: string;
  quantity: number;
  reason?: string;
  document?: string;
  supplierId?: string | null;
  refType?: string;
  refId?: string;
  userId: string;
  createdAt: Date;
}

async function main() {
  console.log("Iniciando seed (saúde pública)...\n");
  const passwordHash = await bcrypt.hash(SEED_PASSWORD as string, 12);

  // ── Unidades ─────────────────────────────────────────────────────────────
  for (const u of UNITS) {
    await prisma.unit.upsert({
      where: { id: u.id },
      update: { name: u.name, cnes: u.cnes, type: u.type, active: true },
      create: { id: u.id, name: u.name, cnes: u.cnes, type: u.type, active: true },
    });
  }
  const unitId = (k: UnitKey) => UNITS.find((u) => u.key === k)!.id;

  // ── Usuários ─────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@pingupharma.dev" },
    update: { role: "ADMIN", unitId: null },
    create: { name: "Administrador (Secretaria de Saúde)", email: "admin@pingupharma.dev", passwordHash, role: "ADMIN", status: "ACTIVE" },
  });

  const staff: Record<UnitKey, { manager: string; pharmacist: string; dispenser: string }> = {
    central: { manager: "", pharmacist: "", dispenser: "" },
    centro: { manager: "", pharmacist: "", dispenser: "" },
    jardim: { manager: "", pharmacist: "", dispenser: "" },
  };
  const staffNames: Record<UnitKey, [string, string, string]> = {
    central: ["Fernanda Albuquerque", "Dr. Ricardo Tavares", "Paulo Henrique Souza"],
    centro: ["Marcos Vinícius Prado", "Dra. Camila Duarte", "Ana Beatriz Silva"],
    jardim: ["Luciana Barros", "Dr. Eduardo Nogueira", "Carlos Eduardo Ramos"],
  };
  for (const u of UNITS) {
    const defs = [
      { role: "MANAGER", prefix: "gerente", name: staffNames[u.key][0], field: "manager" as const },
      { role: "PHARMACIST", prefix: "farmaceutico", name: staffNames[u.key][1], field: "pharmacist" as const },
      { role: "DISPENSER", prefix: "atendente", name: staffNames[u.key][2], field: "dispenser" as const },
    ];
    for (const d of defs) {
      const email = `${d.prefix}.${u.slug}@pingupharma.dev`;
      const user = await prisma.user.upsert({
        where: { email },
        update: { name: d.name, role: d.role, unitId: u.id },
        create: { name: d.name, email, passwordHash, role: d.role, unitId: u.id, status: "ACTIVE" },
      });
      staff[u.key][d.field] = user.id;
    }
  }

  // ── Fornecedores ─────────────────────────────────────────────────────────
  const supBidding = await prisma.supplier.upsert({
    where: { id: "seed_sup_1" },
    update: {},
    create: { id: "seed_sup_1", name: "Distribuidora Hospitalar Vida Ltda", cnpj: cnpjFromBase("112223330001"), type: "BIDDING", active: true },
  });
  const supDonation = await prisma.supplier.upsert({
    where: { id: "seed_sup_2" },
    update: {},
    create: { id: "seed_sup_2", name: "Programa de Doação de Medicamentos (Ministério da Saúde)", cnpj: null, type: "DONATION", active: true },
  });

  // ── Pacientes ────────────────────────────────────────────────────────────
  const patientIds: string[] = [];
  for (let i = 0; i < PATIENTS.length; i++) {
    const p = PATIENTS[i];
    const cns = cnsFromPis(p.pis);
    if (!isValidCns(cns)) throw new Error(`CNS inválido gerado para ${p.name}`);
    const data = {
      name: p.name,
      cpf: cpfFromBase(p.base),
      cns,
      birthDate: new Date(`${p.birth}T12:00:00.000Z`),
      phone: p.phone,
      email: p.email,
      address: p.address,
      active: true,
    };
    const id = `seed_pat_${i + 1}`;
    await prisma.patient.upsert({ where: { id }, update: data, create: { id, ...data } });
    patientIds.push(id);
  }

  // ── Medicamentos ─────────────────────────────────────────────────────────
  const prodId = new Map<string, string>();
  for (const p of PRODUCTS) {
    const data = {
      name: p.name,
      description: `${p.name} - ${p.presentation}`,
      price: p.price,
      minStockAlert: p.min,
      active: true,
      controlledClass: p.controlledClass ?? "NONE",
      activeIngredient: p.activeIngredient,
      presentation: p.presentation,
      measureUnit: p.measureUnit,
      manufacturer: p.manufacturer,
      renameCode: p.renameCode,
    };
    const row = await prisma.product.upsert({ where: { sku: p.sku }, update: data, create: { sku: p.sku, ...data } });
    prodId.set(p.sku, row.id);
  }

  // ── Limpeza controlada dos dados transacionais do seed ───────────────────
  const seedBatches = await prisma.batch.findMany({ where: { id: { startsWith: "seed_" } }, select: { id: true } });
  const seedBatchIds = seedBatches.map((b) => b.id);
  await prisma.stockMovement.deleteMany({
    where: { OR: [{ id: { startsWith: "seed_" } }, { batchId: { in: seedBatchIds } }] },
  });
  await prisma.dispensation.deleteMany({
    where: { OR: [{ id: { startsWith: "seed_" } }, { items: { some: { batchId: { in: seedBatchIds } } } }] },
  });
  await prisma.transfer.deleteMany({ where: { id: { startsWith: "seed_" } } });
  await prisma.prescription.deleteMany({ where: { id: { startsWith: "seed_" } } });
  await prisma.batch.deleteMany({ where: { id: { startsWith: "seed_" } } });
  await prisma.activityLog.deleteMany({ where: { id: { startsWith: "seed_" } } });

  // ── Lotes (simulação em memória; gravação ao final) ──────────────────────
  const batches: BatchRec[] = [];
  const movements: MovRec[] = [];
  let mvSeq = 0;
  const mv = (m: Omit<MovRec, "id">) => movements.push({ id: `seed_mv_${String(++mvSeq).padStart(4, "0")}`, ...m });

  const stockFactor: Record<UnitKey, number> = { central: 5, centro: 3, jardim: 2.5 };
  const controlledFactor: Record<UnitKey, number> = { central: 3, centro: 2, jardim: 1.5 };
  const supplierFor = (i: number) => (i % 5 === 0 ? supDonation : supBidding);
  let lotSeq = 100;
  let batchSeq = 0;

  function addBatch(opts: {
    unitKey: UnitKey;
    sku: string;
    qty: number;
    expiresAt: Date;
    receivedDaysAgo: number;
    entryType?: string;
    supplierId?: string | null;
    document?: string;
    lotNumber?: string;
    emitEntry?: boolean;
  }): BatchRec {
    const p = PRODUCTS.find((x) => x.sku === opts.sku)!;
    const entryType = opts.entryType ?? (opts.supplierId === supDonation.id ? "ENTRY_DONATION" : "ENTRY_PURCHASE");
    const supplierId = opts.entryType === "ENTRY_TRANSFER" ? null : (opts.supplierId ?? supBidding.id);
    const document =
      opts.document ??
      (entryType === "ENTRY_DONATION" ? `Termo de doação ${2026}/${rint(10, 99)}` : `NF ${rint(10000, 99999)} / Empenho 2026/${rint(100, 999)}`);
    const b: BatchRec = {
      id: `seed_b_${String(++batchSeq).padStart(3, "0")}`,
      unitKey: opts.unitKey,
      unitId: unitId(opts.unitKey),
      productId: prodId.get(opts.sku)!,
      sku: opts.sku,
      lotNumber: opts.lotNumber ?? `L${++lotSeq}${String.fromCharCode(65 + (lotSeq % 6))}`,
      initial: opts.qty,
      qty: opts.qty,
      costPrice: Number((p.price * 0.85).toFixed(2)),
      expiresAt: opts.expiresAt,
      receivedAt: daysAgo(opts.receivedDaysAgo, 9),
      supplierId,
      document,
      entryType,
    };
    batches.push(b);
    if (opts.emitEntry !== false) {
      mv({
        unitId: b.unitId,
        productId: b.productId,
        batchId: b.id,
        type: entryType,
        quantity: b.initial,
        reason: entryType === "ENTRY_DONATION" ? "Recebimento de doação" : "Recebimento de compra (licitação)",
        document,
        supplierId,
        refType: "Batch",
        refId: b.id,
        userId: staff[opts.unitKey].manager,
        createdAt: b.receivedAt,
      });
    }
    return b;
  }

  // casos especiais por unidade
  const SKIP = new Set(["jardim:RN-INSNPH"]); // ruptura
  const TRANSFERRED = new Set(["centro:RN-PARA500"]); // entra via transferência recebida
  const LOW: Record<string, number> = { "jardim:RN-LOSA050": 120, "centro:RN-DIPI500": 150 }; // estoque baixo (< mínimo)
  const EXTRA_EXPIRING: Record<string, { days: number; qty: number }> = {
    "centro:RN-AMOX500": { days: 20, qty: 120 },
    "jardim:RN-IBUP600": { days: 12, qty: 90 },
    "central:RN-CAPT025": { days: 25, qty: 400 },
  };
  const EXPIRED: Record<string, { daysAgo: number; qty: number }> = {
    "centro:RN-ACFO005": { daysAgo: 8, qty: 60 },
    "jardim:RN-SFER040": { daysAgo: 30, qty: 45 },
    "central:RN-ALBE400": { daysAgo: 3, qty: 120 },
  };

  let idx = 0;
  for (const u of UNITS) {
    for (const p of PRODUCTS) {
      idx++;
      const key = `${u.key}:${p.sku}`;
      if (SKIP.has(key) || TRANSFERRED.has(key)) {
        // sem lote regular
      } else {
        const controlled = !!p.controlledClass;
        const factor = controlled ? controlledFactor[u.key] : stockFactor[u.key];
        let qty = LOW[key] ?? Math.round(p.min * factor);
        if (controlled && u.key === "jardim" && p.sku === "RN-DIAZ010") {
          // jardim: diazepam só com lote próximo do vencimento
          addBatch({ unitKey: u.key, sku: p.sku, qty: 60, expiresAt: daysFromNow(40), receivedDaysAgo: 80, supplierId: supplierFor(idx).id });
          continue;
        }
        addBatch({
          unitKey: u.key,
          sku: p.sku,
          qty,
          expiresAt: daysFromNow(rint(200, 600)),
          receivedDaysAgo: rint(40, 90),
          supplierId: supplierFor(idx).id,
        });
      }
      const ex = EXTRA_EXPIRING[key];
      if (ex) addBatch({ unitKey: u.key, sku: p.sku, qty: ex.qty, expiresAt: daysFromNow(ex.days), receivedDaysAgo: 120, supplierId: supBidding.id });
      const exp = EXPIRED[key];
      if (exp) addBatch({ unitKey: u.key, sku: p.sku, qty: exp.qty, expiresAt: daysFromNow(-exp.daysAgo), receivedDaysAgo: 200, supplierId: supBidding.id });
    }
  }

  const fefo = (unitKey: UnitKey, sku: string, at: Date) =>
    batches
      .filter((b) => b.unitKey === unitKey && b.sku === sku && b.qty > 0 && b.expiresAt > at && b.receivedAt <= at)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime() || a.receivedAt.getTime() - b.receivedAt.getTime());

  // ── Transferências ───────────────────────────────────────────────────────
  interface TrItem { sku: string; quantity: number; batch?: BatchRec }
  interface TrRec {
    id: string;
    from: UnitKey;
    to: UnitKey;
    status: string;
    requestedBy: string;
    sentBy?: string;
    receivedBy?: string;
    notes?: string;
    createdAt: Date;
    sentAt?: Date;
    receivedAt?: Date;
    items: TrItem[];
  }
  const transfers: TrRec[] = [];

  function sendFrom(tr: TrRec) {
    const at = tr.sentAt!;
    for (const it of tr.items) {
      const src = fefo(tr.from, it.sku, at)[0];
      if (!src || src.qty < it.quantity) throw new Error(`Seed: estoque insuficiente para transferência ${tr.id}`);
      src.qty -= it.quantity;
      it.batch = src;
      mv({
        unitId: unitId(tr.from),
        productId: src.productId,
        batchId: src.id,
        type: "TRANSFER_OUT",
        quantity: -it.quantity,
        reason: `Transferência para ${UNITS.find((x) => x.key === tr.to)!.name}`,
        document: `Transferência ${tr.id}`,
        refType: "Transfer",
        refId: tr.id,
        userId: tr.sentBy!,
        createdAt: at,
      });
    }
  }

  // 1) RECEBIDA: central -> UBS Centro (paracetamol), há 40 dias
  const tr1: TrRec = {
    id: "seed_tr_1", from: "central", to: "centro", status: "RECEIVED",
    requestedBy: staff.centro.manager, sentBy: staff.central.pharmacist, receivedBy: staff.centro.pharmacist,
    createdAt: daysAgo(42), sentAt: daysAgo(41), receivedAt: daysAgo(40),
    items: [{ sku: "RN-PARA500", quantity: 1200 }],
  };
  sendFrom(tr1);
  for (const it of tr1.items) {
    const nb = addBatch({
      unitKey: "centro", sku: it.sku, qty: it.quantity, expiresAt: it.batch!.expiresAt, receivedDaysAgo: 40,
      entryType: "ENTRY_TRANSFER", lotNumber: it.batch!.lotNumber, document: `Transferência ${tr1.id}`, emitEntry: false,
    });
    mv({
      unitId: nb.unitId, productId: nb.productId, batchId: nb.id, type: "ENTRY_TRANSFER", quantity: it.quantity,
      reason: "Transferência de Central de Abastecimento Farmacêutico", document: `Transferência ${tr1.id}`,
      refType: "Transfer", refId: tr1.id, userId: tr1.receivedBy!, createdAt: tr1.receivedAt!,
    });
  }
  transfers.push(tr1);

  // 2) ENVIADA, aguardando recebimento: central -> UBS Jardim (losartana)
  const tr2: TrRec = {
    id: "seed_tr_2", from: "central", to: "jardim", status: "SENT",
    requestedBy: staff.jardim.manager, sentBy: staff.central.pharmacist,
    createdAt: daysAgo(3), sentAt: daysAgo(1),
    items: [{ sku: "RN-LOSA050", quantity: 800 }],
  };
  sendFrom(tr2);
  transfers.push(tr2);

  // 3) SOLICITADA: UBS Jardim pede à central (amoxicilina e insulina)
  transfers.push({
    id: "seed_tr_3", from: "central", to: "jardim", status: "REQUESTED",
    requestedBy: staff.jardim.manager, notes: "Reposição urgente: ruptura de insulina NPH.",
    createdAt: daysAgo(0, 8),
    items: [{ sku: "RN-INSNPH", quantity: 60 }, { sku: "RN-AMOX500", quantity: 300 }],
  });

  // ── Receitas ─────────────────────────────────────────────────────────────
  interface RxRec {
    id: string; patient: number; unit: UnitKey; prescriberName: string; council: string; councilNumber: string;
    number: string; issuedDaysAgo: number; validDays: number; retained: boolean; notes?: string;
  }
  const prescriptions: RxRec[] = [
    { id: "seed_rx_1", patient: 0, unit: "centro", prescriberName: "Dra. Helena Marques", council: "CRM", councilNumber: "123456/SP", number: "B-0001", issuedDaysAgo: 10, validDays: 30, retained: true, notes: "Ansiedade. Receita B1 retida." },
    { id: "seed_rx_2", patient: 1, unit: "jardim", prescriberName: "Dr. Paulo Menezes", council: "CRM", councilNumber: "98765/SP", number: "B-0002", issuedDaysAgo: 6, validDays: 30, retained: true },
    { id: "seed_rx_3", patient: 2, unit: "centro", prescriberName: "Dr. Gustavo Andrade", council: "CRM", councilNumber: "45678/SP", number: "B-0003", issuedDaysAgo: 22, validDays: 30, retained: true, notes: "Epilepsia - uso contínuo." },
    { id: "seed_rx_4", patient: 3, unit: "centro", prescriberName: "Dra. Helena Marques", council: "CRM", councilNumber: "123456/SP", number: "R-1001", issuedDaysAgo: 15, validDays: 180, retained: false },
    { id: "seed_rx_5", patient: 4, unit: "jardim", prescriberName: "Dr. Gustavo Andrade", council: "CRM", councilNumber: "45678/SP", number: "R-1002", issuedDaysAgo: 90, validDays: 30, retained: false, notes: "Receita vencida (exemplo)." },
    { id: "seed_rx_6", patient: 5, unit: "jardim", prescriberName: "Dr. Paulo Menezes", council: "CRM", councilNumber: "98765/SP", number: "R-1003", issuedDaysAgo: 12, validDays: 180, retained: false },
  ];

  // ── Dispensações ─────────────────────────────────────────────────────────
  interface DispItem { id: string; productId: string; batchId: string; quantity: number; unitPrice: number; subtotal: number }
  interface DispRec {
    id: string; unitKey: UnitKey; userId: string; patientId: string | null; pharmacistId: string | null;
    prescriptionId: string | null; createdAt: Date; status: string; cancelReason?: string; canceledAt?: Date;
    items: DispItem[]; total: number;
  }
  const dispensations: DispRec[] = [];
  let dispSeq = 0;
  let itemSeq = 0;

  function dispense(opts: {
    unitKey: UnitKey; userId: string; pharmacistId?: string; patientIdx: number | null; rx?: string;
    skus: { sku: string; quantity?: number }[]; at: Date; cancelReason?: string; cancelBy?: string;
  }) {
    const d: DispRec = {
      id: `seed_disp_${String(++dispSeq).padStart(3, "0")}`,
      unitKey: opts.unitKey, userId: opts.userId,
      patientId: opts.patientIdx === null ? null : patientIds[opts.patientIdx],
      pharmacistId: opts.pharmacistId ?? null, prescriptionId: opts.rx ?? null,
      createdAt: opts.at, status: "COMPLETED", items: [], total: 0,
    };
    for (const s of opts.skus) {
      const p = PRODUCTS.find((x) => x.sku === s.sku)!;
      let remaining = s.quantity ?? rint(p.disp[0], p.disp[1]);
      for (const b of fefo(opts.unitKey, s.sku, opts.at)) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, b.qty);
        b.qty -= take;
        remaining -= take;
        const subtotal = Number((take * p.price).toFixed(2));
        d.items.push({ id: `seed_di_${String(++itemSeq).padStart(4, "0")}`, productId: b.productId, batchId: b.id, quantity: take, unitPrice: p.price, subtotal });
        d.total += subtotal;
        mv({
          unitId: b.unitId, productId: b.productId, batchId: b.id, type: "DISPENSATION", quantity: -take,
          refType: "Dispensation", refId: d.id, userId: opts.userId, createdAt: opts.at,
        });
      }
    }
    if (d.items.length === 0) {
      dispSeq--;
      return;
    }
    d.total = Number(d.total.toFixed(2));
    if (opts.cancelReason) {
      const cancelAt = new Date(opts.at.getTime() + 60 * 60 * 1000);
      d.status = "CANCELED";
      d.cancelReason = opts.cancelReason;
      d.canceledAt = cancelAt;
      for (const it of d.items) {
        const b = batches.find((x) => x.id === it.batchId)!;
        b.qty += it.quantity;
        mv({
          unitId: b.unitId, productId: b.productId, batchId: b.id, type: "DISPENSATION_CANCEL", quantity: it.quantity,
          reason: opts.cancelReason, refType: "Dispensation", refId: d.id, userId: opts.cancelBy ?? staff[opts.unitKey].manager, createdAt: cancelAt,
        });
      }
    }
    dispensations.push(d);
  }

  // controlados (com receita e farmacêutico)
  dispense({ unitKey: "centro", userId: staff.centro.pharmacist, pharmacistId: staff.centro.pharmacist, patientIdx: 0, rx: "seed_rx_1", skus: [{ sku: "RN-CLON002", quantity: 30 }], at: daysAgo(9) });
  dispense({ unitKey: "jardim", userId: staff.jardim.pharmacist, pharmacistId: staff.jardim.pharmacist, patientIdx: 1, rx: "seed_rx_2", skus: [{ sku: "RN-DIAZ010", quantity: 30 }], at: daysAgo(5) });
  dispense({ unitKey: "centro", userId: staff.centro.pharmacist, pharmacistId: staff.centro.pharmacist, patientIdx: 2, rx: "seed_rx_3", skus: [{ sku: "RN-FENO100", quantity: 60 }], at: daysAgo(20) });
  dispense({ unitKey: "centro", userId: staff.centro.pharmacist, pharmacistId: staff.centro.pharmacist, patientIdx: 2, rx: "seed_rx_3", skus: [{ sku: "RN-FENO100", quantity: 60 }], at: daysAgo(2) });
  // com receita comum
  dispense({ unitKey: "centro", userId: staff.centro.dispenser, patientIdx: 3, rx: "seed_rx_4", skus: [{ sku: "RN-LOSA050", quantity: 60 }, { sku: "RN-HIDR025", quantity: 30 }], at: daysAgo(14) });
  dispense({ unitKey: "centro", userId: staff.centro.dispenser, patientIdx: 3, rx: "seed_rx_4", skus: [{ sku: "RN-LOSA050", quantity: 60 }, { sku: "RN-HIDR025", quantity: 30 }], at: daysAgo(0, 9) });
  dispense({ unitKey: "jardim", userId: staff.jardim.dispenser, patientIdx: 5, rx: "seed_rx_6", skus: [{ sku: "RN-METF850", quantity: 90 }, { sku: "RN-GLIB005", quantity: 60 }], at: daysAgo(11) });

  // dispensações comuns distribuídas nos últimos 30 dias
  const common = PRODUCTS.filter((p) => !p.controlledClass).map((p) => p.sku);
  const unitMix: UnitKey[] = ["centro", "centro", "centro", "jardim", "jardim", "jardim", "central"];
  for (let i = 0; i < 26; i++) {
    const unitKey = pick(unitMix);
    const n = rint(1, 3);
    const skus = Array.from(new Set(Array.from({ length: n }, () => pick(common)))).map((sku) => ({ sku }));
    dispense({
      unitKey,
      userId: staff[unitKey].dispenser,
      patientIdx: rnd() > 0.15 ? rint(0, PATIENTS.length - 1) : null,
      skus,
      at: daysAgo(i < 4 ? 0 : rint(1, 29), rint(8, 17)),
      ...(i === 7 ? { cancelReason: "Paciente desistiu da retirada", cancelBy: staff[unitKey].manager } : {}),
      ...(i === 15 ? { cancelReason: "Erro de lançamento do medicamento", cancelBy: staff[unitKey].pharmacist } : {}),
    });
  }

  // perdas / ajustes
  const damageTarget = batches.find((b) => b.unitKey === "centro" && b.sku === "RN-OMEP020")!;
  damageTarget.qty -= 24;
  mv({ unitId: damageTarget.unitId, productId: damageTarget.productId, batchId: damageTarget.id, type: "LOSS_DAMAGE", quantity: -24, reason: "Embalagens danificadas por umidade", userId: staff.centro.pharmacist, createdAt: daysAgo(6) });
  const lossTarget = batches.find((b) => b.unitKey === "jardim" && b.sku === "RN-SFER040" && b.expiresAt < new Date())!;
  lossTarget.qty -= 10;
  mv({ unitId: lossTarget.unitId, productId: lossTarget.productId, batchId: lossTarget.id, type: "LOSS_EXPIRED", quantity: -10, reason: "Descarte parcial de lote vencido", document: "Termo de descarte 2026/07", userId: staff.jardim.manager, createdAt: daysAgo(4) });
  const adjTarget = batches.find((b) => b.unitKey === "central" && b.sku === "RN-DIPI500")!;
  adjTarget.qty += 12;
  mv({ unitId: adjTarget.unitId, productId: adjTarget.productId, batchId: adjTarget.id, type: "ADJUSTMENT", quantity: 12, reason: "Ajuste após inventário (sobra)", userId: staff.central.manager, createdAt: daysAgo(15) });

  // consistência: saldo do lote == soma dos movimentos
  const sums = new Map<string, number>();
  for (const m of movements) sums.set(m.batchId, (sums.get(m.batchId) ?? 0) + m.quantity);
  for (const b of batches) {
    if ((sums.get(b.id) ?? 0) !== b.qty) throw new Error(`Seed incoerente no lote ${b.id}: ${b.qty} != ${sums.get(b.id)}`);
  }

  // ── Gravação ─────────────────────────────────────────────────────────────
  await prisma.batch.createMany({
    data: batches.map((b) => ({
      id: b.id, unitId: b.unitId, productId: b.productId, supplierId: b.supplierId, lotNumber: b.lotNumber,
      quantity: b.qty, costPrice: b.costPrice, expiresAt: b.expiresAt, document: b.document,
      entryType: b.entryType, receivedAt: b.receivedAt, createdAt: b.receivedAt,
    })),
  });

  for (const r of prescriptions) {
    const issuedAt = daysAgo(r.issuedDaysAgo, 9);
    const validUntil = new Date(issuedAt.getTime() + r.validDays * 86400000);
    await prisma.prescription.create({
      data: {
        id: r.id, patientId: patientIds[r.patient], unitId: unitId(r.unit), prescriberName: r.prescriberName,
        prescriberCouncil: r.council, prescriberCouncilNumber: r.councilNumber, number: r.number,
        issuedAt, validUntil, retained: r.retained, notes: r.notes ?? null,
        createdBy: staff[r.unit].pharmacist, createdAt: issuedAt,
      },
    });
  }

  for (const d of dispensations) {
    await prisma.dispensation.create({
      data: {
        id: d.id, unitId: unitId(d.unitKey), userId: d.userId, patientId: d.patientId,
        pharmacistId: d.pharmacistId, prescriptionId: d.prescriptionId, totalValue: d.total,
        status: d.status, cancelReason: d.cancelReason ?? null, canceledAt: d.canceledAt ?? null,
        createdAt: d.createdAt, updatedAt: d.canceledAt ?? d.createdAt,
        items: { create: d.items },
      },
    });
  }

  await prisma.stockMovement.createMany({
    data: movements.map((m) => ({
      id: m.id, unitId: m.unitId, productId: m.productId, batchId: m.batchId, type: m.type,
      quantity: m.quantity, reason: m.reason ?? null, document: m.document ?? null,
      supplierId: m.supplierId ?? null, refType: m.refType ?? null, refId: m.refId ?? null,
      userId: m.userId, createdAt: m.createdAt,
    })),
  });

  for (const t of transfers) {
    await prisma.transfer.create({
      data: {
        id: t.id, fromUnitId: unitId(t.from), toUnitId: unitId(t.to), status: t.status,
        requestedBy: t.requestedBy, sentBy: t.sentBy ?? null, receivedBy: t.receivedBy ?? null,
        notes: t.notes ?? null, createdAt: t.createdAt, sentAt: t.sentAt ?? null, receivedAt: t.receivedAt ?? null,
        items: {
          create: t.items.map((it) => ({
            productId: prodId.get(it.sku)!, quantity: it.quantity,
            batchId: it.batch?.id ?? null, lotNumber: it.batch?.lotNumber ?? null,
            expiresAt: it.batch?.expiresAt ?? null, costPrice: it.batch?.costPrice ?? null,
          })),
        },
      },
    });
  }

  // ── Logs de atividade ────────────────────────────────────────────────────
  const logs = [
    { userId: admin.id, action: "UNIT_CREATED", entity: "Unit", entityId: unitId("centro"), metadata: { name: "UBS Centro" }, createdAt: daysAgo(100) },
    { userId: admin.id, action: "UNIT_CREATED", entity: "Unit", entityId: unitId("jardim"), metadata: { name: "UBS Jardim das Flores" }, createdAt: daysAgo(100) },
    { userId: staff.centro.manager, action: "STOCK_ENTRY", entity: "Batch", metadata: { origem: "seed" }, createdAt: daysAgo(60) },
    { userId: staff.centro.pharmacist, action: "PRESCRIPTION_CREATED", entity: "Prescription", entityId: "seed_rx_1", createdAt: daysAgo(10) },
    { userId: staff.centro.pharmacist, action: "DISPENSATION_CREATED", entity: "Dispensation", entityId: "seed_disp_001", createdAt: daysAgo(9) },
    { userId: staff.centro.pharmacist, action: "STOCK_LOSS", entity: "Batch", metadata: { motivo: "Embalagens danificadas por umidade" }, createdAt: daysAgo(6) },
    { userId: staff.jardim.manager, action: "TRANSFER_REQUESTED", entity: "Transfer", entityId: "seed_tr_3", createdAt: daysAgo(0, 8) },
    { userId: staff.central.pharmacist, action: "TRANSFER_SENT", entity: "Transfer", entityId: "seed_tr_2", createdAt: daysAgo(1) },
  ];
  for (let i = 0; i < logs.length; i++) {
    const l = logs[i];
    await prisma.activityLog.create({
      data: {
        id: `seed_log_${i + 1}`, userId: l.userId, action: l.action, entity: l.entity,
        entityId: l.entityId ?? null, metadata: l.metadata ? JSON.stringify(l.metadata) : null, createdAt: l.createdAt,
      },
    });
  }

  const active = dispensations.filter((d) => d.status === "COMPLETED").length;
  console.log(`
Seed concluído.

Unidades:       ${UNITS.length}
Usuários:       admin@pingupharma.dev (ADMIN) + gerente/farmaceutico/atendente.{central,centro,jardim}@pingupharma.dev
                (senha de todos: valor de SEED_ADMIN_PASSWORD)
Medicamentos:   ${PRODUCTS.length} (${PRODUCTS.filter((p) => p.controlledClass).length} controlados)
Fornecedores:   2
Pacientes:      ${PATIENTS.length}
Lotes:          ${batches.length}
Movimentos:     ${movements.length}
Receitas:       ${prescriptions.length}
Dispensações:   ${dispensations.length} (${active} concluídas, ${dispensations.length - active} canceladas)
Transferências: ${transfers.length}
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
