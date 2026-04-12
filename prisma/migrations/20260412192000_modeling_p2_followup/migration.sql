-- Alter Category timestamps
ALTER TABLE `Category`
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NULL;

UPDATE `Category`
SET `updatedAt` = `createdAt`
WHERE `updatedAt` IS NULL;

ALTER TABLE `Category`
  MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- Alter Profile timestamps
ALTER TABLE `Profile`
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NULL;

UPDATE `Profile`
SET `updatedAt` = `createdAt`
WHERE `updatedAt` IS NULL;

ALTER TABLE `Profile`
  MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- Alter User timestamps and password storage length
ALTER TABLE `User`
  ADD COLUMN `updatedAt` DATETIME(3) NULL,
  MODIFY `password` VARCHAR(255) NOT NULL;

UPDATE `User`
SET `updatedAt` = `createdAt`
WHERE `updatedAt` IS NULL;

ALTER TABLE `User`
  MODIFY `updatedAt` DATETIME(3) NOT NULL;
