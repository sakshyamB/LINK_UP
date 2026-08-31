/*
  Warnings:

  - A unique constraint covering the columns `[likedById,postId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dateofBirth` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GenderChoice" AS ENUM ('Male', 'Female', 'Others');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateofBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "gender" "GenderChoice" NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Like_likedById_postId_key" ON "Like"("likedById", "postId");
