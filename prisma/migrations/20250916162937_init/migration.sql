/*
  Warnings:

  - You are about to drop the column `addresse` on the `Project` table. All the data in the column will be lost.
  - Added the required column `adresse` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Project" ("createdAt", "id", "reference", "statut") SELECT "createdAt", "id", "reference", "statut" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_reference_key" ON "Project"("reference");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
