/*
  Warnings:

  - You are about to drop the column `status` on the `user_subject` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_subject" (
    "userId" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("subjectId", "userId"),
    CONSTRAINT "user_subject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_user_subject" ("createdAt", "subjectId", "updatedAt", "userId") SELECT "createdAt", "subjectId", "updatedAt", "userId" FROM "user_subject";
DROP TABLE "user_subject";
ALTER TABLE "new_user_subject" RENAME TO "user_subject";
CREATE INDEX "user_subject_userId_idx" ON "user_subject"("userId");
CREATE INDEX "user_subject_subjectId_idx" ON "user_subject"("subjectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
