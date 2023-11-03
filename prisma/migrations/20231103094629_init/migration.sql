/*
  Warnings:

  - You are about to drop the column `authorId` on the `post` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `post` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `post` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `post` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - Added the required column `content` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_authorId_fkey`;

-- AlterTable
ALTER TABLE `post` DROP COLUMN `authorId`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `content` VARCHAR(191) NOT NULL,
    ADD COLUMN `userId` INTEGER NOT NULL,
    ALTER COLUMN `published` DROP DEFAULT,
    MODIFY `title` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
