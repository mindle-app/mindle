/*
  Warnings:

  - Made the column `slug` on table `subject` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `subject` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_subject" ("createdAt", "id", "name", "slug", "type", "updatedAt") SELECT "createdAt", "id", "name", "slug", "type", "updatedAt" FROM "subject";
DROP TABLE "subject";
ALTER TABLE "new_subject" RENAME TO "subject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
