/*
  Warnings:

  - You are about to drop the `Essay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EssayParagraph` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NoteImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "NoteImage_noteId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Essay";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EssayParagraph";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "NoteImage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "note_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "noteId" TEXT NOT NULL,
    CONSTRAINT "note_image_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "essay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "studyMaterialId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "essay_studyMaterialId_fkey" FOREIGN KEY ("studyMaterialId") REFERENCES "study_material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "essay_paragraph" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "essayId" TEXT NOT NULL,
    CONSTRAINT "essay_paragraph_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "essay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lesson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "subchapterId" INTEGER,
    "parentLessonId" INTEGER,
    "essayId" TEXT,
    "essayParagraphId" TEXT,
    "isParent" BOOLEAN NOT NULL DEFAULT false,
    "studySessionId" INTEGER,
    "description" TEXT,
    "noPopup" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER DEFAULT 200,
    "height" INTEGER DEFAULT 200,
    "spacing" REAL DEFAULT 1.5,
    "nonSiblings" REAL DEFAULT 1.5,
    "zoom" REAL DEFAULT 0.5,
    "depth" INTEGER DEFAULT 750,
    "displayId" TEXT,
    "order" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lesson_parentLessonId_fkey" FOREIGN KEY ("parentLessonId") REFERENCES "lesson" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "lesson_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "lesson_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "essay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lesson_essayParagraphId_fkey" FOREIGN KEY ("essayParagraphId") REFERENCES "essay_paragraph" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lesson" ("createdAt", "depth", "description", "displayId", "essayId", "essayParagraphId", "height", "id", "isParent", "name", "noPopup", "nonSiblings", "order", "parentLessonId", "spacing", "studySessionId", "subchapterId", "updatedAt", "width", "zoom") SELECT "createdAt", "depth", "description", "displayId", "essayId", "essayParagraphId", "height", "id", "isParent", "name", "noPopup", "nonSiblings", "order", "parentLessonId", "spacing", "studySessionId", "subchapterId", "updatedAt", "width", "zoom" FROM "lesson";
DROP TABLE "lesson";
ALTER TABLE "new_lesson" RENAME TO "lesson";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "note_image_noteId_idx" ON "note_image"("noteId");
