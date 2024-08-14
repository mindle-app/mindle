/*
  Warnings:

  - You are about to alter the column `admissionAverage2024` on the `highschool` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `baccalaureateAverage2024` on the `highschool` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `baccalaureateStudents2024` on the `highschool` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `promotionRate` on the `highschool` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_highschool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "promotionRate" REAL,
    "baccalaureateAverage2024" REAL NOT NULL,
    "admissionAverage2024" REAL NOT NULL,
    "baccalaureateStudents2024" REAL NOT NULL
);
INSERT INTO "new_highschool" ("admissionAverage2024", "baccalaureateAverage2024", "baccalaureateStudents2024", "id", "name", "promotionRate") SELECT "admissionAverage2024", "baccalaureateAverage2024", "baccalaureateStudents2024", "id", "name", "promotionRate" FROM "highschool";
DROP TABLE "highschool";
ALTER TABLE "new_highschool" RENAME TO "highschool";
CREATE INDEX "highschool_name_idx" ON "highschool"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
