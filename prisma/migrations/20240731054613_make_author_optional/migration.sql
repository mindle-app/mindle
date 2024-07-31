/*
  Warnings:

  - Added the required column `notes` to the `essay_paragraph` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_essay_paragraph" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "essayId" TEXT NOT NULL,
    CONSTRAINT "essay_paragraph_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "essay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_essay_paragraph" ("content", "essayId", "explanation", "id", "order") SELECT "content", "essayId", "explanation", "id", "order" FROM "essay_paragraph";
DROP TABLE "essay_paragraph";
ALTER TABLE "new_essay_paragraph" RENAME TO "essay_paragraph";
CREATE TABLE "new_study_material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "type" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "study_material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_study_material" ("author", "createdAt", "id", "subjectId", "title", "type", "updatedAt") SELECT "author", "createdAt", "id", "subjectId", "title", "type", "updatedAt" FROM "study_material";
DROP TABLE "study_material";
ALTER TABLE "new_study_material" RENAME TO "study_material";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
