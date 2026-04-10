ALTER TABLE `Post`
  ADD COLUMN `content` TEXT NULL;

CREATE INDEX `Post_userId_idx` ON `Post`(`userId`);
CREATE INDEX `Post_published_createdAt_idx` ON `Post`(`published`, `createdAt`);
