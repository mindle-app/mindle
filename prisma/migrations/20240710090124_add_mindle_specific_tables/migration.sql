-- CreateTable
CREATE TABLE "subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "chapter" (
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
    CONSTRAINT "chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "subchapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nextSubchapterId" TEXT,
    "chapterId" TEXT,
    "image" TEXT,
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

-- CreateTable
CREATE TABLE "lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subchapterId" TEXT NOT NULL,
    "parentLessonId" TEXT,
    "isParent" BOOLEAN NOT NULL DEFAULT false,
    "studySessionId" INTEGER,
    "description" TEXT,
    "image" TEXT,
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
    "lessonId" TEXT,
    CONSTRAINT "lesson_parentLessonId_fkey" FOREIGN KEY ("parentLessonId") REFERENCES "lesson" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "lesson_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subchapterId" TEXT NOT NULL,
    "order" INTEGER,
    CONSTRAINT "Test_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "test_question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "order" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "test_question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "isCorrect" BOOLEAN DEFAULT false,
    "questionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "test_question" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "user_subject" (
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("subjectId", "userId"),
    CONSTRAINT "user_subject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "user_chapter" (
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("chapterId", "userId"),
    CONSTRAINT "user_chapter_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapter" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_chapter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "user_subchapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subchapterId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',
    "chapterId" TEXT NOT NULL,
    "score" REAL,
    "userChapterChapterId" TEXT,
    "userChapterUserId" TEXT,
    CONSTRAINT "user_subchapter_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_subchapter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_subchapter_userChapterChapterId_userChapterUserId_fkey" FOREIGN KEY ("userChapterChapterId", "userChapterUserId") REFERENCES "user_chapter" ("chapterId", "userId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_lesson" (
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',

    PRIMARY KEY ("lessonId", "userId"),
    CONSTRAINT "user_lesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_lesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "user_test" (
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "score" REAL,

    PRIMARY KEY ("userId", "testId"),
    CONSTRAINT "user_test_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_test_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "userId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "answerId"),
    CONSTRAINT "UserAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "chapter_nextChapterId_key" ON "chapter"("nextChapterId");

-- CreateIndex
CREATE UNIQUE INDEX "subchapter_nextSubchapterId_key" ON "subchapter"("nextSubchapterId");

-- CreateIndex
CREATE INDEX "user_subject_userId_idx" ON "user_subject"("userId");

-- CreateIndex
CREATE INDEX "user_subject_subjectId_idx" ON "user_subject"("subjectId");

-- CreateIndex
CREATE INDEX "user_chapter_userId_idx" ON "user_chapter"("userId");

-- CreateIndex
CREATE INDEX "user_chapter_chapterId_idx" ON "user_chapter"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subchapter_subchapterId_userId_key" ON "user_subchapter"("subchapterId", "userId");

-- CreateIndex
CREATE INDEX "user_lesson_userId_idx" ON "user_lesson"("userId");

-- CreateIndex
CREATE INDEX "user_lesson_lessonId_idx" ON "user_lesson"("lessonId");

-- CreateIndex
CREATE INDEX "user_test_userId_idx" ON "user_test"("userId");

-- CreateIndex
CREATE INDEX "user_test_testId_idx" ON "user_test"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "user_test_userId_testId_key" ON "user_test"("userId", "testId");

-- CreateIndex
CREATE INDEX "UserAnswer_answerId_idx" ON "UserAnswer"("answerId");

-- CreateIndex
CREATE INDEX "UserAnswer_userId_idx" ON "UserAnswer"("userId");
