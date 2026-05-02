-- 删除所有表中的petId字段并修改外键约束

-- 修改care_records表
ALTER TABLE `care_records` DROP FOREIGN KEY `FK_a17f06c56d34e93dd3a62df9bca`;
ALTER TABLE `care_records` DROP INDEX `FK_a17f06c56d34e93dd3a62df9bca`;
ALTER TABLE `care_records` DROP COLUMN `petId`;
ALTER TABLE `care_records` ADD CONSTRAINT `FK_care_records_pet_id` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- 修改checkups表
ALTER TABLE `checkups` DROP FOREIGN KEY `FK_b568bd6761eb7937156e90ee07b`;
ALTER TABLE `checkups` DROP INDEX `FK_b568bd6761eb7937156e90ee07b`;
ALTER TABLE `checkups` DROP COLUMN `petId`;
ALTER TABLE `checkups` ADD CONSTRAINT `FK_checkups_pet_id` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- 修改dewormings表
ALTER TABLE `dewormings` DROP FOREIGN KEY `FK_ad58539bdfa16d29a53b57c8381`;
ALTER TABLE `dewormings` DROP INDEX `FK_ad58539bdfa16d29a53b57c8381`;
ALTER TABLE `dewormings` DROP COLUMN `petId`;
ALTER TABLE `dewormings` ADD CONSTRAINT `FK_dewormings_pet_id` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- 修改vaccinations表
ALTER TABLE `vaccinations` DROP FOREIGN KEY `FK_f4595ce99f215adb46f88dbaadf`;
ALTER TABLE `vaccinations` DROP INDEX `FK_f4595ce99f215adb46f88dbaadf`;
ALTER TABLE `vaccinations` DROP COLUMN `petId`;
ALTER TABLE `vaccinations` ADD CONSTRAINT `FK_vaccinations_pet_id` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- 验证修改结果
SHOW CREATE TABLE `care_records`;
SHOW CREATE TABLE `checkups`;
SHOW CREATE TABLE `dewormings`;
SHOW CREATE TABLE `vaccinations`;