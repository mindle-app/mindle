/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `subject` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "subject_slug_key" ON "subject"("slug");

-- CreateIndex
CREATE INDEX "subject_slug_idx" ON "subject"("slug");
