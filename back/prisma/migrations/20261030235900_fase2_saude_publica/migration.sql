-- Fase 2: saúde pública (unidades, pacientes, dispensações, movimentações, transferências)

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnes" TEXT,
    "type" TEXT NOT NULL DEFAULT 'UBS',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Unidade padrão para dados existentes (id fixo)
INSERT INTO "units" ("id","name","type","active","createdAt","updatedAt")
VALUES ('unit_central','Unidade Central','CENTRAL',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BIDDING',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cns" TEXT,
    "cpf" TEXT,
    "birthDate" DATETIME,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "prescriberName" TEXT NOT NULL,
    "prescriberCouncil" TEXT NOT NULL DEFAULT 'CRM',
    "prescriberCouncilNumber" TEXT NOT NULL,
    "number" TEXT,
    "issuedAt" DATETIME NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "retained" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "prescriptions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "prescriptions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dispensations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT,
    "pharmacistId" TEXT,
    "prescriptionId" TEXT,
    "totalValue" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "cancelReason" TEXT,
    "canceledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dispensations_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dispensations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dispensations_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "dispensations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "dispensations_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dispensation_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dispensationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "dispensation_items_dispensationId_fkey" FOREIGN KEY ("dispensationId") REFERENCES "dispensations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dispensation_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dispensation_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Migração de dados: customers -> patients (document vira cpf apenas dígitos)
INSERT INTO "patients" ("id","name","cpf","phone","email","active","createdAt","updatedAt")
SELECT "id","name",
  NULLIF(REPLACE(REPLACE(REPLACE(REPLACE("document",'.',''),'-',''),' ',''),'/',''),''),
  "phone","email",true,"createdAt","updatedAt"
FROM "customers";

-- sales -> dispensations (todas na unidade padrão; paymentMethod/clientName descartados)
INSERT INTO "dispensations" ("id","unitId","userId","patientId","totalValue","status","cancelReason","canceledAt","createdAt","updatedAt")
SELECT "id",'unit_central',"userId","customerId","totalAmount","status",
  CASE WHEN "status"='CANCELED' THEN 'Cancelada antes da migração (motivo não registrado)' ELSE NULL END,
  CASE WHEN "status"='CANCELED' THEN "updatedAt" ELSE NULL END,
  "createdAt","updatedAt"
FROM "sales";

INSERT INTO "dispensation_items" ("id","dispensationId","productId","batchId","quantity","unitPrice","subtotal")
SELECT "id","saleId","productId","batchId","quantity","unitPrice","subtotal" FROM "sale_items";

DROP TABLE "sale_items";
DROP TABLE "sales";
DROP TABLE "customers";

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "document" TEXT,
    "supplierId" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromUnitId" TEXT NOT NULL,
    "toUnitId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "requestedBy" TEXT NOT NULL,
    "sentBy" TEXT,
    "receivedBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "receivedAt" DATETIME,
    CONSTRAINT "transfers_fromUnitId_fkey" FOREIGN KEY ("fromUnitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transfers_toUnitId_fkey" FOREIGN KEY ("toUnitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transfer_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "batchId" TEXT,
    "lotNumber" TEXT,
    "expiresAt" DATETIME,
    "costPrice" REAL,
    CONSTRAINT "transfer_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "transfers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transfer_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "lotNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costPrice" REAL NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "document" TEXT,
    "entryType" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "batches_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "batches_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_batches" ("costPrice", "createdAt", "expiresAt", "id", "lotNumber", "productId", "quantity", "receivedAt", "updatedAt", "unitId") SELECT "costPrice", "createdAt", "expiresAt", "id", "lotNumber", "productId", "quantity", "receivedAt", "updatedAt", 'unit_central' FROM "batches";
DROP TABLE "batches";
ALTER TABLE "new_batches" RENAME TO "batches";
CREATE INDEX "batches_productId_idx" ON "batches"("productId");
CREATE INDEX "batches_expiresAt_idx" ON "batches"("expiresAt");
CREATE INDEX "batches_unitId_idx" ON "batches"("unitId");
CREATE INDEX "batches_unitId_productId_idx" ON "batches"("unitId", "productId");
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "minStockAlert" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "controlledClass" TEXT NOT NULL DEFAULT 'NONE',
    "activeIngredient" TEXT,
    "presentation" TEXT,
    "measureUnit" TEXT,
    "manufacturer" TEXT,
    "renameCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_products" ("active", "createdAt", "description", "id", "minStockAlert", "name", "price", "sku", "updatedAt") SELECT "active", "createdAt", "description", "id", "minStockAlert", "name", "price", "sku", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_name_idx" ON "products"("name");
CREATE INDEX "products_controlledClass_idx" ON "products"("controlledClass");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DISPENSER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "unitId" TEXT,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "email", "id", "lastLoginAt", "name", "passwordHash", "role", "status", "tokenVersion", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "unitId") SELECT "createdAt", "email", "id", "lastLoginAt", "name", "passwordHash", CASE WHEN "role"='SELLER' THEN 'DISPENSER' ELSE "role" END, "status", "tokenVersion", "twoFactorEnabled", "twoFactorSecret", "updatedAt", CASE WHEN "role"='ADMIN' THEN NULL ELSE 'unit_central' END FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_unitId_idx" ON "users"("unitId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "units_active_idx" ON "units"("active");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_key" ON "suppliers"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cns_key" ON "patients"("cns");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");

-- CreateIndex
CREATE INDEX "patients_name_idx" ON "patients"("name");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_idx" ON "prescriptions"("patientId");

-- CreateIndex
CREATE INDEX "prescriptions_unitId_idx" ON "prescriptions"("unitId");

-- CreateIndex
CREATE INDEX "dispensations_userId_idx" ON "dispensations"("userId");

-- CreateIndex
CREATE INDEX "dispensations_status_idx" ON "dispensations"("status");

-- CreateIndex
CREATE INDEX "dispensations_createdAt_idx" ON "dispensations"("createdAt");

-- CreateIndex
CREATE INDEX "dispensations_unitId_createdAt_idx" ON "dispensations"("unitId", "createdAt");

-- CreateIndex
CREATE INDEX "dispensations_patientId_idx" ON "dispensations"("patientId");

-- CreateIndex
CREATE INDEX "dispensations_prescriptionId_idx" ON "dispensations"("prescriptionId");

-- CreateIndex
CREATE INDEX "dispensation_items_dispensationId_idx" ON "dispensation_items"("dispensationId");

-- CreateIndex
CREATE INDEX "dispensation_items_productId_idx" ON "dispensation_items"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_unitId_createdAt_idx" ON "stock_movements"("unitId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_unitId_productId_idx" ON "stock_movements"("unitId", "productId");

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_batchId_idx" ON "stock_movements"("batchId");

-- CreateIndex
CREATE INDEX "stock_movements_type_createdAt_idx" ON "stock_movements"("type", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_refType_refId_idx" ON "stock_movements"("refType", "refId");

-- CreateIndex
CREATE INDEX "transfers_fromUnitId_status_idx" ON "transfers"("fromUnitId", "status");

-- CreateIndex
CREATE INDEX "transfers_toUnitId_status_idx" ON "transfers"("toUnitId", "status");

-- CreateIndex
CREATE INDEX "transfers_createdAt_idx" ON "transfers"("createdAt");

-- CreateIndex
CREATE INDEX "transfer_items_transferId_idx" ON "transfer_items"("transferId");


-- Saldo inicial: um movimento de ajuste por lote com saldo, para o livro/saldo corrente fechar
INSERT INTO "stock_movements" ("id","unitId","productId","batchId","type","quantity","reason","refType","userId","createdAt")
SELECT 'mig_' || "id","unitId","productId","id",'ADJUSTMENT',"quantity",
  'Saldo inicial (migração para estoque por unidade)','Migration',
  COALESCE((SELECT "id" FROM "users" WHERE "role"='ADMIN' ORDER BY "createdAt" LIMIT 1),(SELECT "id" FROM "users" ORDER BY "createdAt" LIMIT 1)),
  CURRENT_TIMESTAMP
FROM "batches"
WHERE "quantity" > 0 AND EXISTS (SELECT 1 FROM "users");
