-- CreateTable
CREATE TABLE "study_material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "study_material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Essay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "studyMaterialId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Essay_studyMaterialId_fkey" FOREIGN KEY ("studyMaterialId") REFERENCES "study_material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EssayParagraph" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "essayId" TEXT NOT NULL,
    CONSTRAINT "EssayParagraph_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "Essay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lesson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "subchapterId" INTEGER,
    "parentLessonId" INTEGER,
    "essayId" TEXT,
    "essayParagraphId" TEXT,
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
    CONSTRAINT "lesson_subchapterId_fkey" FOREIGN KEY ("subchapterId") REFERENCES "subchapter" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "lesson_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "Essay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lesson_essayParagraphId_fkey" FOREIGN KEY ("essayParagraphId") REFERENCES "EssayParagraph" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lesson" ("createdAt", "depth", "description", "displayId", "height", "id", "isParent", "name", "noPopup", "nonSiblings", "order", "parentLessonId", "spacing", "studySessionId", "subchapterId", "updatedAt", "width", "zoom") SELECT "createdAt", "depth", "description", "displayId", "height", "id", "isParent", "name", "noPopup", "nonSiblings", "order", "parentLessonId", "spacing", "studySessionId", "subchapterId", "updatedAt", "width", "zoom" FROM "lesson";
DROP TABLE "lesson";
ALTER TABLE "new_lesson" RENAME TO "lesson";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
