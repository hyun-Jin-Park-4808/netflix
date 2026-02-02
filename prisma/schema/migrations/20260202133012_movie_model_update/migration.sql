/*
  Warnings:

  - You are about to drop the column `isLiked` on the `MovieUserLike` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Movie` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MovieUserLike" DROP COLUMN "isLiked",
ADD COLUMN     "isLike" BOOLEAN NOT NULL DEFAULT false;
