-- AlterTable
ALTER TABLE "author" ADD COLUMN     "photo" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "poems" ADD COLUMN     "coverImage" TEXT NOT NULL DEFAULT '';
