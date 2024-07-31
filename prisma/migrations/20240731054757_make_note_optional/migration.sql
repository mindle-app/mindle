/*
  Warnings:

  - You are about to drop the column `notes` on the `essay_paragraph` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_essay_paragraph" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "note" TEXT,
    "order" INTEGER NOT NULL,
    "essayId" TEXT NOT NULL,
    CONSTRAINT "essay_paragraph_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "essay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_essay_paragraph" ("content", "essayId", "explanation", "id", "order") SELECT "content", "essayId", "explanation", "id", "order" FROM "essay_paragraph";
DROP TABLE "essay_paragraph";
ALTER TABLE "new_essay_paragraph" RENAME TO "essay_paragraph";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
