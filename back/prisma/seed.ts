import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
if (!SEED_PASSWORD || SEED_PASSWORD.length < 8) {
  console.error("SEED_ADMIN_PASSWORD ausente ou < 8 caracteres. Defina no .env antes de rodar o seed.");
  process.exit(1);
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD as string, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@pingupharma.dev" },
    update: {},
    create: {
      name: "Admin PinguPharma",
      email: "admin@pingupharma.dev",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "gerente@pingupharma.dev" },
    update: {},
    create: {
      name: "Gerente Demo",
      email: "gerente@pingupharma.dev",
      passwordHash,
      role: "MANAGER",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "vendedor@pingupharma.dev" },
    update: {},
    create: {
      name: "Vendedor Demo",
      email: "vendedor@pingupharma.dev",
      passwordHash,
      role: "SELLER",
      status: "ACTIVE",
    },
  });

  const products = [
    { name: "Dipirona 500mg", sku: "DIP-500", price: 6.5, minStockAlert: 20 },
    { name: "Paracetamol 750mg", sku: "PAR-750", price: 8.9, minStockAlert: 15 },
    { name: "Amoxicilina 500mg", sku: "AMX-500", price: 24.9, minStockAlert: 10 },
    { name: "Ibuprofeno 400mg", sku: "IBU-400", price: 12.75, minStockAlert: 12 },
    { name: "Omeprazol 20mg", sku: "OME-20", price: 18.4, minStockAlert: 10 },
    { name: "Losartana 50mg", sku: "LOS-50", price: 14.2, minStockAlert: 15 },
  ];

  for (const p of products) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p },
    });
    const in90 = new Date();
    in90.setDate(in90.getDate() + 90);
    await prisma.batch.create({
      data: {
        productId: prod.id,
        lotNumber: `L${Date.now().toString().slice(-6)}`,
        quantity: 40,
        costPrice: Number(p.price) * 0.6,
        expiresAt: in90,
      },
    });
  }

  console.log(`Seed ready. Admin id: ${admin.id}. Senha lida de SEED_ADMIN_PASSWORD.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
