/*
  Warnings:

  - You are about to drop the column `author` on the `study_material` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "author_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "author_image_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "author" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_essay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "studyMaterialId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT,
    CONSTRAINT "essay_studyMaterialId_fkey" FOREIGN KEY ("studyMaterialId") REFERENCES "study_material" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "essay_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_essay" ("createdAt", "id", "studyMaterialId", "title", "updatedAt") SELECT "createdAt", "id", "studyMaterialId", "title", "updatedAt" FROM "essay";
DROP TABLE "essay";
ALTER TABLE "new_essay" RENAME TO "essay";
CREATE TABLE "new_study_material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT,
    CONSTRAINT "study_material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "study_material_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_study_material" ("createdAt", "id", "subjectId", "title", "type", "updatedAt") SELECT "createdAt", "id", "subjectId", "title", "type", "updatedAt" FROM "study_material";
DROP TABLE "study_material";
ALTER TABLE "new_study_material" RENAME TO "study_material";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "author_image_authorId_key" ON "author_image"("authorId");
