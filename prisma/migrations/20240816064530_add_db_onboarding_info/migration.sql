-- CreateTable
CREATE TABLE "user_exam_subject" (
    "subjectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("subjectId", "userId"),
    CONSTRAINT "user_exam_subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_exam_subject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "motivation" TEXT,
    "highschoolId" TEXT,
    "bestLearningTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_highschoolId_fkey" FOREIGN KEY ("highschoolId") REFERENCES "highschool" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_user" ("createdAt", "email", "id", "name", "updatedAt", "username") SELECT "createdAt", "email", "id", "name", "updatedAt", "username" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "user_exam_subject_subjectId_idx" ON "user_exam_subject"("subjectId");

-- CreateIndex
CREATE INDEX "user_exam_subject_userId_idx" ON "user_exam_subject"("userId");
