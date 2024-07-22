/*
  Warnings:

  - You are about to drop the column `chapterOrder` on the `chapter` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chapter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nextChapterId" INTEGER,
    "subjectId" INTEGER NOT NULL,
    "order" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_chapter" ("createdAt", "id", "name", "nextChapterId", "subjectId", "updatedAt", "order") SELECT "createdAt", "id", "name", "nextChapterId", "subjectId", "updatedAt", "chapterOrder" FROM "chapter";
DROP TABLE "chapter";
ALTER TABLE "new_chapter" RENAME TO "chapter";
CREATE UNIQUE INDEX "chapter_nextChapterId_key" ON "chapter"("nextChapterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
