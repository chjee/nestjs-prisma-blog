-- DropForeignKey
ALTER TABLE `Profile` DROP FOREIGN KEY `Profile_userId_fkey`;

-- AlterTable
ALTER TABLE `Category` MODIFY `name` VARCHAR(60) NOT NULL;

-- AlterTable
ALTER TABLE `Post` MODIFY `title` VARCHAR(60) NOT NULL;

-- AlterTable
ALTER TABLE `Profile` MODIFY `bio` VARCHAR(500) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Category_name_key` ON `Category`(`name`);

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
