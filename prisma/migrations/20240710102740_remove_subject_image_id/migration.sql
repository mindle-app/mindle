/*
  Warnings:

  - You are about to drop the column `subjectImageId` on the `subject` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_subject" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "subject";
DROP TABLE "subject";
ALTER TABLE "new_subject" RENAME TO "subject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
