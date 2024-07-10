/*
  Warnings:

  - The primary key for the `user_subchapter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `user_subchapter` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_subchapter" (
    "userId" TEXT NOT NULL,
    "subchapterId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',
    "chapterId" TEXT NOT NULL,
    "score" REAL,
    "userChapterChapterId" TEXT,
    "userChapterUserId" TEXT,

    PRIMARY KEY ("userId", "subchapterId"),
    CONSTRAINT "user_subchapter_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_subchapter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_subchapter_userChapterChapterId_userChapterUserId_fkey" FOREIGN KEY ("userChapterChapterId", "userChapterUserId") REFERENCES "user_chapter" ("chapterId", "userId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_user_subchapter" ("chapterId", "score", "state", "subchapterId", "userChapterChapterId", "userChapterUserId", "userId") SELECT "chapterId", "score", "state", "subchapterId", "userChapterChapterId", "userChapterUserId", "userId" FROM "user_subchapter";
DROP TABLE "user_subchapter";
ALTER TABLE "new_user_subchapter" RENAME TO "user_subchapter";
CREATE UNIQUE INDEX "user_subchapter_subchapterId_userId_key" ON "user_subchapter"("subchapterId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
