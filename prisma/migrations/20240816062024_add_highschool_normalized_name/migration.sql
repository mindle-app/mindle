-- AlterTable
ALTER TABLE "highschool" ADD COLUMN "normalizedName" TEXT;

-- Update the normalizedName column
UPDATE "highschool"
SET "normalizedName" = lower(
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    "name",
    'ă', 'a'),
    'î', 'i'),
    'ț', 't'),
    'â', 'a'),
    'ș', 's'),
    'Ă', 'A'),
    'Â', 'A'),
    'Î', 'I'),
    'Ț', 'T'),
    'Ș', 'S')
);
