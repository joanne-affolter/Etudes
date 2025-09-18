/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `ImageUpload` table. All the data in the column will be lost.
  - Added the required column `fileUrls` to the `ImageUpload` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImageUpload" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "parking_idx" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "fileUrls" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ImageUpload" ("description", "id", "parking_idx", "projectId", "section", "title", "uploadedAt") SELECT "description", "id", "parking_idx", "projectId", "section", "title", "uploadedAt" FROM "ImageUpload";
DROP TABLE "ImageUpload";
ALTER TABLE "new_ImageUpload" RENAME TO "ImageUpload";
CREATE UNIQUE INDEX "ImageUpload_projectId_section_title_parking_idx_key" ON "ImageUpload"("projectId", "section", "title", "parking_idx");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
