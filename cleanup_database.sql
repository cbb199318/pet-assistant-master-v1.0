-- 删除冗余表
DROP TABLE IF EXISTS `article`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `booking`;
DROP TABLE IF EXISTS `care`;
DROP TABLE IF EXISTS `comment`;
DROP TABLE IF EXISTS `post`;

-- 删除冗余字段
-- care_records 表
ALTER TABLE `care_records` DROP COLUMN `petId`;

-- checkups 表
ALTER TABLE `checkups` DROP COLUMN `petId`;

-- community_comments 表
ALTER TABLE `community_comments` DROP COLUMN `userId`;
ALTER TABLE `community_comments` DROP COLUMN `postId`;

-- community_posts 表
ALTER TABLE `community_posts` DROP COLUMN `userId`;

-- dewormings 表
ALTER TABLE `dewormings` DROP COLUMN `petId`;

-- pets 表
ALTER TABLE `pets` DROP COLUMN `userId`;

-- vaccinations 表
ALTER TABLE `vaccinations` DROP COLUMN `petId`;
