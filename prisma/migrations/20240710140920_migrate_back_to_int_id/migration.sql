/*
  Warnings:

  - The primary key for the `chapter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `chapter` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `subjectId` on the `chapter` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `chapterId` on the `chapter_image` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `lesson` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `lesson` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `parentLessonId` on the `lesson` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `subchapterId` on the `lesson` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `lessonId` on the `lesson_image` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `subchapterId` on the `quiz` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `subchapter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `chapterId` on the `subchapter` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `subchapter` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `subChapterId` on the `subchapter_image` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `subject` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `subject` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `subjectId` on the `subject_image` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `user_chapter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `chapterId` on the `user_chapter` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `user_lesson` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `lessonId` on the `user_lesson` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `user_subchapter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userChapterChapterId` on the `user_subchapter` table. All the data in the column will be lost.
  - You are about to drop the column `userChapterUserId` on the `user_subchapter` table. All the data in the column will be lost.
  - You are about to alter the column `chapterId` on the `user_subchapter` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `subchapterId` on the `user_subchapter` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `user_subject` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `subjectId` on the `user_subject` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chapter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nextChapterId" INTEGER,
    "imageDone" TEXT,
    "imageLocked" TEXT,
    "imageInProgress" TEXT,
    "subjectId" INTEGER NOT NULL,
    "chapterOrder" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_chapter" ("chapterOrder", "createdAt", "id", "imageDone", "imageInProgress", "imageLocked", "name", "nextChapterId", "subjectId", "updatedAt") SELECT "chapterOrder", "createdAt", "id", "imageDone", "imageInProgress", "imageLocked", "name", "nextChapterId", "subjectId", "updatedAt" FROM "chapter";
DROP TABLE "chapter";
ALTER TABLE "new_chapter" RENAME TO "chapter";
CREATE UNIQUE INDEX "chapter_nextChapterId_key" ON "chapter"("nextChapterId");
CREATE TABLE "new_chapter_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "chapterId" INTEGER NOT NULL,
    CONSTRAINT "chapter_image_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_chapter_image" ("altText", "blob", "chapterId", "contentType", "createdAt", "id", "updatedAt") SELECT "altText", "blob", "chapterId", "contentType", "createdAt", "id", "updatedAt" FROM "chapter_image";
DROP TABLE "chapter_image";
ALTER TABLE "new_chapter_image" RENAME TO "chapter_image";
CREATE UNIQUE INDEX "chapter_image_chapterId_key" ON "chapter_image"("chapterId");
CREATE INDEX "chapter_image_chapterId_idx" ON "chapter_image"("chapterId");
CREATE TABLE "new_lesson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "subchapterId" INTEGER NOT NULL,
    "parentLessonId" INTEGER,
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
    CONSTRAINT "lesson_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_lesson" ("createdAt", "depth", "description", "displayId", "height", "id", "isParent", "name", "noPopup", "nonSiblings", "order", "parentLessonId", "spacing", "studySessionId", "subchapterId", "updatedAt", "width", "zoom") SELECT "createdAt", "depth", "description", "displayId", "height", "id", "isParent", "name", "noPopup", "nonSiblings", "order", "parentLessonId", "spacing", "studySessionId", "subchapterId", "updatedAt", "width", "zoom" FROM "lesson";
DROP TABLE "lesson";
ALTER TABLE "new_lesson" RENAME TO "lesson";
CREATE TABLE "new_lesson_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lessonId" INTEGER NOT NULL,
    CONSTRAINT "lesson_image_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lesson_image" ("altText", "blob", "contentType", "createdAt", "id", "lessonId", "updatedAt") SELECT "altText", "blob", "contentType", "createdAt", "id", "lessonId", "updatedAt" FROM "lesson_image";
DROP TABLE "lesson_image";
ALTER TABLE "new_lesson_image" RENAME TO "lesson_image";
CREATE UNIQUE INDEX "lesson_image_lessonId_key" ON "lesson_image"("lessonId");
CREATE INDEX "lesson_image_lessonId_idx" ON "lesson_image"("lessonId");
CREATE TABLE "new_quiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subchapterId" INTEGER NOT NULL,
    "order" INTEGER,
    CONSTRAINT "quiz_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_quiz" ("id", "name", "order", "subchapterId") SELECT "id", "name", "order", "subchapterId" FROM "quiz";
DROP TABLE "quiz";
ALTER TABLE "new_quiz" RENAME TO "quiz";
CREATE TABLE "new_subchapter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nextSubchapterId" TEXT,
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
CREATE TABLE "new_subchapter_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subChapterId" INTEGER NOT NULL,
    CONSTRAINT "subchapter_image_subChapterId_fkey" FOREIGN KEY ("subChapterId") REFERENCES "subchapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_subchapter_image" ("altText", "blob", "contentType", "createdAt", "id", "subChapterId", "updatedAt") SELECT "altText", "blob", "contentType", "createdAt", "id", "subChapterId", "updatedAt" FROM "subchapter_image";
DROP TABLE "subchapter_image";
ALTER TABLE "new_subchapter_image" RENAME TO "subchapter_image";
CREATE UNIQUE INDEX "subchapter_image_subChapterId_key" ON "subchapter_image"("subChapterId");
CREATE INDEX "subchapter_image_subChapterId_idx" ON "subchapter_image"("subChapterId");
CREATE TABLE "new_subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_subject" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "subject";
DROP TABLE "subject";
ALTER TABLE "new_subject" RENAME TO "subject";
CREATE TABLE "new_subject_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subjectId" INTEGER NOT NULL,
    CONSTRAINT "subject_image_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_subject_image" ("altText", "blob", "contentType", "createdAt", "id", "subjectId", "updatedAt") SELECT "altText", "blob", "contentType", "createdAt", "id", "subjectId", "updatedAt" FROM "subject_image";
DROP TABLE "subject_image";
ALTER TABLE "new_subject_image" RENAME TO "subject_image";
CREATE UNIQUE INDEX "subject_image_subjectId_key" ON "subject_image"("subjectId");
CREATE INDEX "subject_image_subjectId_idx" ON "subject_image"("subjectId");
CREATE TABLE "new_user_chapter" (
    "userId" TEXT NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("chapterId", "userId"),
    CONSTRAINT "user_chapter_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapter" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_chapter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_user_chapter" ("chapterId", "createdAt", "state", "updatedAt", "userId") SELECT "chapterId", "createdAt", "state", "updatedAt", "userId" FROM "user_chapter";
DROP TABLE "user_chapter";
ALTER TABLE "new_user_chapter" RENAME TO "user_chapter";
CREATE INDEX "user_chapter_userId_idx" ON "user_chapter"("userId");
CREATE INDEX "user_chapter_chapterId_idx" ON "user_chapter"("chapterId");
CREATE TABLE "new_user_lesson" (
    "lessonId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',

    PRIMARY KEY ("lessonId", "userId"),
    CONSTRAINT "user_lesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_lesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_user_lesson" ("lessonId", "state", "userId") SELECT "lessonId", "state", "userId" FROM "user_lesson";
DROP TABLE "user_lesson";
ALTER TABLE "new_user_lesson" RENAME TO "user_lesson";
CREATE INDEX "user_lesson_userId_idx" ON "user_lesson"("userId");
CREATE INDEX "user_lesson_lessonId_idx" ON "user_lesson"("lessonId");
CREATE TABLE "new_user_subchapter" (
    "userId" TEXT NOT NULL,
    "subchapterId" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',
    "chapterId" INTEGER,
    "score" REAL,

    PRIMARY KEY ("userId", "subchapterId"),
    CONSTRAINT "user_subchapter_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_subchapter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_user_subchapter" ("chapterId", "score", "state", "subchapterId", "userId") SELECT "chapterId", "score", "state", "subchapterId", "userId" FROM "user_subchapter";
DROP TABLE "user_subchapter";
ALTER TABLE "new_user_subchapter" RENAME TO "user_subchapter";
CREATE UNIQUE INDEX "user_subchapter_subchapterId_userId_key" ON "user_subchapter"("subchapterId", "userId");
CREATE TABLE "new_user_subject" (
    "userId" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("subjectId", "userId"),
    CONSTRAINT "user_subject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_user_subject" ("createdAt", "status", "subjectId", "updatedAt", "userId") SELECT "createdAt", "status", "subjectId", "updatedAt", "userId" FROM "user_subject";
DROP TABLE "user_subject";
ALTER TABLE "new_user_subject" RENAME TO "user_subject";
CREATE INDEX "user_subject_userId_idx" ON "user_subject"("userId");
CREATE INDEX "user_subject_subjectId_idx" ON "user_subject"("subjectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
