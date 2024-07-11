/*
  Warnings:

  - The primary key for the `quiz` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `quiz` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `quiz_answer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `quiz_answer` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `questionId` on the `quiz_answer` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `quiz_question` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `quiz_question` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `testId` on the `quiz_question` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `user_quiz` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `quizId` on the `user_quiz` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `user_quiz_answer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `answerId` on the `user_quiz_answer` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_quiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "subchapterId" INTEGER NOT NULL,
    "order" INTEGER,
    CONSTRAINT "quiz_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_quiz" ("id", "name", "order", "subchapterId") SELECT "id", "name", "order", "subchapterId" FROM "quiz";
DROP TABLE "quiz";
ALTER TABLE "new_quiz" RENAME TO "quiz";
CREATE TABLE "new_quiz_answer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "isCorrect" BOOLEAN DEFAULT false,
    "questionId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quiz_answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "quiz_question" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_quiz_answer" ("createdAt", "id", "isCorrect", "questionId", "title", "updatedAt") SELECT "createdAt", "id", "isCorrect", "questionId", "title", "updatedAt" FROM "quiz_answer";
DROP TABLE "quiz_answer";
ALTER TABLE "new_quiz_answer" RENAME TO "quiz_answer";
CREATE TABLE "new_quiz_question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "testId" INTEGER NOT NULL,
    "order" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quiz_question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "quiz" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_quiz_question" ("createdAt", "id", "name", "order", "testId", "updatedAt") SELECT "createdAt", "id", "name", "order", "testId", "updatedAt" FROM "quiz_question";
DROP TABLE "quiz_question";
ALTER TABLE "new_quiz_question" RENAME TO "quiz_question";
CREATE TABLE "new_user_quiz" (
    "userId" TEXT NOT NULL,
    "quizId" INTEGER NOT NULL,
    "score" REAL,

    PRIMARY KEY ("userId", "quizId"),
    CONSTRAINT "user_quiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quiz" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_user_quiz" ("quizId", "score", "userId") SELECT "quizId", "score", "userId" FROM "user_quiz";
DROP TABLE "user_quiz";
ALTER TABLE "new_user_quiz" RENAME TO "user_quiz";
CREATE INDEX "user_quiz_userId_idx" ON "user_quiz"("userId");
CREATE INDEX "user_quiz_quizId_idx" ON "user_quiz"("quizId");
CREATE TABLE "new_user_quiz_answer" (
    "userId" TEXT NOT NULL,
    "answerId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "answerId"),
    CONSTRAINT "user_quiz_answer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "quiz_answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_quiz_answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_quiz_answer" ("answerId", "userId") SELECT "answerId", "userId" FROM "user_quiz_answer";
DROP TABLE "user_quiz_answer";
ALTER TABLE "new_user_quiz_answer" RENAME TO "user_quiz_answer";
CREATE INDEX "user_quiz_answer_answerId_idx" ON "user_quiz_answer"("answerId");
CREATE INDEX "user_quiz_answer_userId_idx" ON "user_quiz_answer"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
