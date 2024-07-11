/*
  Warnings:

  - You are about to alter the column `nextSubchapterId` on the `subchapter` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_subchapter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nextSubchapterId" INTEGER,
    "chapterId" INTEGER,
    "width" INTEGER NOT NULL DEFAULT 200,
    "height" INTEGER NOT NULL DEFAULT 200,
    "spacing" REAL NOT NULL DEFAULT 1.5,
    "nonSiblings" REAL NOT NULL DEFAULT 1.5,
    "zoom" REAL NOT NULL DEFAULT 0.5,
    "depth" INTEGER NOT NULL DEFAULT 750,
    "displayId" TEXT,
    "order" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subchapter_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapter" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_subchapter" ("chapterId", "createdAt", "depth", "displayId", "height", "id", "name", "nextSubchapterId", "nonSiblings", "order", "spacing", "updatedAt", "width", "zoom") SELECT "chapterId", "createdAt", "depth", "displayId", "height", "id", "name", "nextSubchapterId", "nonSiblings", "order", "spacing", "updatedAt", "width", "zoom" FROM "subchapter";
DROP TABLE "subchapter";
ALTER TABLE "new_subchapter" RENAME TO "subchapter";
CREATE UNIQUE INDEX "subchapter_nextSubchapterId_key" ON "subchapter"("nextSubchapterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
