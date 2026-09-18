-- CreateTable
CREATE TABLE "Resposta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoHash" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "regiao" TEXT NOT NULL,
    "funcao" TEXT,
    "tempoCasa" TEXT,
    "faixaEtaria" TEXT,
    "itens" TEXT NOT NULL,
    "escores" TEXT NOT NULL,
    "alertaUrgente" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Resposta_codigoHash_key" ON "Resposta"("codigoHash");

-- CreateIndex
CREATE INDEX "Resposta_criadoEm_idx" ON "Resposta"("criadoEm");

-- CreateIndex
CREATE INDEX "Resposta_regiao_idx" ON "Resposta"("regiao");
