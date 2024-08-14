/*
  Warnings:

  - You are about to drop the `Highschool` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Highschool";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "highschool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "promotionRate" INTEGER,
    "baccalaureateAverage2024" INTEGER NOT NULL,
    "admissionAverage2024" INTEGER NOT NULL,
    "baccalaureateStudents2024" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "highschool_name_idx" ON "highschool"("name");
