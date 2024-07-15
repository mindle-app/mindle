-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_quiz" (
    "userId" TEXT NOT NULL,
    "quizId" INTEGER NOT NULL,
    "score" REAL,
    "state" TEXT NOT NULL DEFAULT 'LOCKED',

    PRIMARY KEY ("userId", "quizId"),
    CONSTRAINT "user_quiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quiz" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "user_quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_user_quiz" ("quizId", "score", "userId") SELECT "quizId", "score", "userId" FROM "user_quiz";
DROP TABLE "user_quiz";
ALTER TABLE "new_user_quiz" RENAME TO "user_quiz";
CREATE INDEX "user_quiz_userId_idx" ON "user_quiz"("userId");
CREATE INDEX "user_quiz_quizId_idx" ON "user_quiz"("quizId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
