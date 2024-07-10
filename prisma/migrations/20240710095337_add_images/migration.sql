/*
  Warnings:

  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_test` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `image` on the `subchapter` table. All the data in the column will be lost.
  - Added the required column `subjectImageId` to the `subject` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserAnswer_userId_idx";

-- DropIndex
DROP INDEX "UserAnswer_answerId_idx";

-- DropIndex
DROP INDEX "user_test_userId_testId_key";

-- DropIndex
DROP INDEX "user_test_testId_idx";

-- DropIndex
DROP INDEX "user_test_userId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Test";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserAnswer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "answer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "test_question";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "user_test";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SubjectImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "SubjectImage_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChapterImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "chapterId" TEXT NOT NULL,
    CONSTRAINT "ChapterImage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubChapterImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subChapterId" TEXT NOT NULL,
    CONSTRAINT "SubChapterImage_subChapterId_fkey" FOREIGN KEY ("subChapterId") REFERENCES "subchapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subchapterId" TEXT NOT NULL,
    "order" INTEGER,
    CONSTRAINT "quiz_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "quiz_question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "order" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quiz_question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "quiz" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "quiz_answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "isCorrect" BOOLEAN DEFAULT false,
    "questionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quiz_answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "quiz_question" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "user_quiz" (
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" REAL,

    PRIMARY KEY ("userId", "quizId"),
    CONSTRAINT "user_quiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quiz" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "user_quiz_answer" (
    "userId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "answerId"),
    CONSTRAINT "user_quiz_answer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "quiz_answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_quiz_answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nextChapterId" INTEGER,
    "imageDone" TEXT,
    "imageLocked" TEXT,
    "imageInProgress" TEXT,
    "subjectId" TEXT NOT NULL,
    "chapterOrder" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_chapter" ("chapterOrder", "createdAt", "id", "imageDone", "imageInProgress", "imageLocked", "name", "nextChapterId", "subjectId", "updatedAt") SELECT "chapterOrder", "createdAt", "id", "imageDone", "imageInProgress", "imageLocked", "name", "nextChapterId", "subjectId", "updatedAt" FROM "chapter";
DROP TABLE "chapter";
ALTER TABLE "new_chapter" RENAME TO "chapter";
CREATE UNIQUE INDEX "chapter_nextChapterId_key" ON "chapter"("nextChapterId");
CREATE TABLE "new_subchapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nextSubchapterId" TEXT,
    "chapterId" TEXT,
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
CREATE TABLE "new_subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subjectImageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_subject" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "subject";
DROP TABLE "subject";
ALTER TABLE "new_subject" RENAME TO "subject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SubjectImage_subjectId_key" ON "SubjectImage"("subjectId");

-- CreateIndex
CREATE INDEX "SubjectImage_subjectId_idx" ON "SubjectImage"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterImage_chapterId_key" ON "ChapterImage"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterImage_chapterId_idx" ON "ChapterImage"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "SubChapterImage_subChapterId_key" ON "SubChapterImage"("subChapterId");

-- CreateIndex
CREATE INDEX "SubChapterImage_subChapterId_idx" ON "SubChapterImage"("subChapterId");

-- CreateIndex
CREATE INDEX "user_quiz_userId_idx" ON "user_quiz"("userId");

-- CreateIndex
CREATE INDEX "user_quiz_quizId_idx" ON "user_quiz"("quizId");

-- CreateIndex
CREATE INDEX "user_quiz_answer_answerId_idx" ON "user_quiz_answer"("answerId");

-- CreateIndex
CREATE INDEX "user_quiz_answer_userId_idx" ON "user_quiz_answer"("userId");
