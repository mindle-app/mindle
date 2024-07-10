/*
  Warnings:

  - You are about to drop the `ChapterImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Connection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Password` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubChapterImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubjectImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Verification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `image` on the `lesson` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `lesson` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ChapterImage_chapterId_idx";

-- DropIndex
DROP INDEX "ChapterImage_chapterId_key";

-- DropIndex
DROP INDEX "Connection_providerName_providerId_key";

-- DropIndex
DROP INDEX "Note_ownerId_updatedAt_idx";

-- DropIndex
DROP INDEX "Note_ownerId_idx";

-- DropIndex
DROP INDEX "Password_userId_key";

-- DropIndex
DROP INDEX "Permission_action_entity_access_key";

-- DropIndex
DROP INDEX "Role_name_key";

-- DropIndex
DROP INDEX "Session_userId_idx";

-- DropIndex
DROP INDEX "SubChapterImage_subChapterId_idx";

-- DropIndex
DROP INDEX "SubChapterImage_subChapterId_key";

-- DropIndex
DROP INDEX "SubjectImage_subjectId_idx";

-- DropIndex
DROP INDEX "SubjectImage_subjectId_key";

-- DropIndex
DROP INDEX "User_username_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "UserImage_userId_key";

-- DropIndex
DROP INDEX "Verification_target_type_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ChapterImage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Connection";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Note";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Password";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Permission";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Role";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Session";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SubChapterImage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SubjectImage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserImage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Verification";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "note_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "user_image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "password" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expirationDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "access" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "digits" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "charSet" TEXT NOT NULL,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerName" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subject_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "subject_image_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chapter_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "chapterId" TEXT NOT NULL,
    CONSTRAINT "chapter_image_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subchapter_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subChapterId" TEXT NOT NULL,
    CONSTRAINT "subchapter_image_subChapterId_fkey" FOREIGN KEY ("subChapterId") REFERENCES "subchapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lesson_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lessonId" TEXT NOT NULL,
    CONSTRAINT "lesson_image_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NoteImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "noteId" TEXT NOT NULL,
    CONSTRAINT "NoteImage_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NoteImage" ("altText", "blob", "contentType", "createdAt", "id", "noteId", "updatedAt") SELECT "altText", "blob", "contentType", "createdAt", "id", "noteId", "updatedAt" FROM "NoteImage";
DROP TABLE "NoteImage";
ALTER TABLE "new_NoteImage" RENAME TO "NoteImage";
CREATE INDEX "NoteImage_noteId_idx" ON "NoteImage"("noteId");
CREATE TABLE "new__PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__PermissionToRole" ("A", "B") SELECT "A", "B" FROM "_PermissionToRole";
DROP TABLE "_PermissionToRole";
ALTER TABLE "new__PermissionToRole" RENAME TO "_PermissionToRole";
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");
CREATE TABLE "new__RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__RoleToUser" ("A", "B") SELECT "A", "B" FROM "_RoleToUser";
DROP TABLE "_RoleToUser";
ALTER TABLE "new__RoleToUser" RENAME TO "_RoleToUser";
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");
CREATE TABLE "new_lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subchapterId" TEXT NOT NULL,
    "parentLessonId" TEXT,
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
CREATE TABLE "new_user_chapter" (
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
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
    "lessonId" TEXT NOT NULL,
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
CREATE TABLE "new_user_quiz" (
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
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
    "answerId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "answerId"),
    CONSTRAINT "user_quiz_answer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "quiz_answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_quiz_answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_quiz_answer" ("answerId", "userId") SELECT "answerId", "userId" FROM "user_quiz_answer";
DROP TABLE "user_quiz_answer";
ALTER TABLE "new_user_quiz_answer" RENAME TO "user_quiz_answer";
CREATE INDEX "user_quiz_answer_answerId_idx" ON "user_quiz_answer"("answerId");
CREATE INDEX "user_quiz_answer_userId_idx" ON "user_quiz_answer"("userId");
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
    CONSTRAINT "user_subchapter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_subchapter_userChapterChapterId_userChapterUserId_fkey" FOREIGN KEY ("userChapterChapterId", "userChapterUserId") REFERENCES "user_chapter" ("chapterId", "userId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_user_subchapter" ("chapterId", "score", "state", "subchapterId", "userChapterChapterId", "userChapterUserId", "userId") SELECT "chapterId", "score", "state", "subchapterId", "userChapterChapterId", "userChapterUserId", "userId" FROM "user_subchapter";
DROP TABLE "user_subchapter";
ALTER TABLE "new_user_subchapter" RENAME TO "user_subchapter";
CREATE UNIQUE INDEX "user_subchapter_subchapterId_userId_key" ON "user_subchapter"("subchapterId", "userId");
CREATE TABLE "new_user_subject" (
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "note_ownerId_idx" ON "note"("ownerId");

-- CreateIndex
CREATE INDEX "note_ownerId_updatedAt_idx" ON "note"("ownerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_image_userId_key" ON "user_image"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_userId_key" ON "password"("userId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "permission_action_entity_access_key" ON "permission"("action", "entity", "access");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "verification_target_type_key" ON "verification"("target", "type");

-- CreateIndex
CREATE UNIQUE INDEX "connection_providerName_providerId_key" ON "connection"("providerName", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_image_subjectId_key" ON "subject_image"("subjectId");

-- CreateIndex
CREATE INDEX "subject_image_subjectId_idx" ON "subject_image"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_image_chapterId_key" ON "chapter_image"("chapterId");

-- CreateIndex
CREATE INDEX "chapter_image_chapterId_idx" ON "chapter_image"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "subchapter_image_subChapterId_key" ON "subchapter_image"("subChapterId");

-- CreateIndex
CREATE INDEX "subchapter_image_subChapterId_idx" ON "subchapter_image"("subChapterId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_image_lessonId_key" ON "lesson_image"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_image_lessonId_idx" ON "lesson_image"("lessonId");
