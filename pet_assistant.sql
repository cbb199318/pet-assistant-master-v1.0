/*
 Navicat Premium Dump SQL

 Source Server         : Text1
 Source Server Type    : MySQL
 Source Server Version : 80034 (8.0.34)
 Source Host           : localhost:3306
 Source Schema         : pet_assistant

 Target Server Type    : MySQL
 Target Server Version : 80034 (8.0.34)
 File Encoding         : 65001

 Date: 20/03/2026 16:48:23
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for ai_conversations
-- ----------------------------
DROP TABLE IF EXISTS `ai_conversations`;
CREATE TABLE `ai_conversations`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `pet_id` int NOT NULL,
  `conversation` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `pet_id`(`pet_id` ASC) USING BTREE,
  CONSTRAINT `ai_conversations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `ai_conversations_ibfk_2` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ai_conversations
-- ----------------------------
INSERT INTO `ai_conversations` VALUES (1, 1, 1, '[{\"role\": \"user\", \"content\": \"我的狗狗最近总是挠耳朵，怎么回事？\"}, {\"role\": \"ai\", \"content\": \"狗狗频繁挠耳朵可能是耳螨、耳部感染或过敏引起的。建议检查耳朵是否有红肿、异味或分泌物，如果有异常，建议带至宠物医院检查。\"}]', '2026-03-18 17:27:16');
INSERT INTO `ai_conversations` VALUES (2, 2, 3, '[{\"role\": \"user\", \"content\": \"我的狗狗最近食欲不好，怎么办？\"}, {\"role\": \"ai\", \"content\": \"狗狗食欲不好可能是天气炎热、消化不良或疾病引起的。建议观察狗狗的精神状态和排便情况，如果持续不好，建议带至宠物医院检查。\"}]', '2026-03-18 17:27:16');
INSERT INTO `ai_conversations` VALUES (3, 1, 1, '[{\"role\": \"user\", \"content\": \"我的狗狗最近总是挠耳朵，怎么回事？\"}, {\"role\": \"ai\", \"content\": \"狗狗频繁挠耳朵可能是耳螨、耳部感染或过敏引起的。建议检查耳朵是否有红肿、异味或分泌物，如果有异常，建议带至宠物医院检查。\"}]', '2026-03-18 17:29:11');
INSERT INTO `ai_conversations` VALUES (4, 2, 3, '[{\"role\": \"user\", \"content\": \"我的狗狗最近食欲不好，怎么办？\"}, {\"role\": \"ai\", \"content\": \"狗狗食欲不好可能是天气炎热、消化不良或疾病引起的。建议观察狗狗的精神状态和排便情况，如果持续不好，建议带至宠物医院检查。\"}]', '2026-03-18 17:29:11');
INSERT INTO `ai_conversations` VALUES (5, 1, 1, '[{\"role\": \"user\", \"content\": \"我的狗狗最近总是挠耳朵，怎么回事？\"}, {\"role\": \"ai\", \"content\": \"狗狗频繁挠耳朵可能是耳螨、耳部感染或过敏引起的。建议检查耳朵是否有红肿、异味或分泌物，如果有异常，建议带至宠物医院检查。\"}]', '2026-03-18 17:29:26');
INSERT INTO `ai_conversations` VALUES (6, 2, 3, '[{\"role\": \"user\", \"content\": \"我的狗狗最近食欲不好，怎么办？\"}, {\"role\": \"ai\", \"content\": \"狗狗食欲不好可能是天气炎热、消化不良或疾病引起的。建议观察狗狗的精神状态和排便情况，如果持续不好，建议带至宠物医院检查。\"}]', '2026-03-18 17:29:26');
INSERT INTO `ai_conversations` VALUES (7, 1, 1, '[{\"role\": \"user\", \"content\": \"我的狗狗最近总是挠耳朵，怎么回事？\"}, {\"role\": \"ai\", \"content\": \"狗狗频繁挠耳朵可能是耳螨、耳部感染或过敏引起的。建议检查耳朵是否有红肿、异味或分泌物，如果有异常，建议带至宠物医院检查。\"}]', '2026-03-18 17:29:33');
INSERT INTO `ai_conversations` VALUES (8, 2, 3, '[{\"role\": \"user\", \"content\": \"我的狗狗最近食欲不好，怎么办？\"}, {\"role\": \"ai\", \"content\": \"狗狗食欲不好可能是天气炎热、消化不良或疾病引起的。建议观察狗狗的精神状态和排便情况，如果持续不好，建议带至宠物医院检查。\"}]', '2026-03-18 17:29:33');

-- ----------------------------
-- Table structure for articles
-- ----------------------------
DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `cover_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `views` int NOT NULL DEFAULT 0,
  `likes` int NOT NULL DEFAULT 0,
  `favorites` int NOT NULL DEFAULT 0,
  `categoryId` int NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_9cf383b5c60045a773ddced7f23`(`categoryId` ASC) USING BTREE,
  CONSTRAINT `FK_9cf383b5c60045a773ddced7f23` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of articles
-- ----------------------------
INSERT INTO `articles` VALUES (1, 'https://example.com/article1.jpg', 1200, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');
INSERT INTO `articles` VALUES (2, 'https://example.com/article2.jpg', 980, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');
INSERT INTO `articles` VALUES (3, 'https://example.com/article3.jpg', 1500, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');
INSERT INTO `articles` VALUES (4, 'https://example.com/article4.jpg', 850, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');
INSERT INTO `articles` VALUES (5, 'https://example.com/article5.jpg', 1100, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');
INSERT INTO `articles` VALUES (6, 'https://example.com/article1.jpg', 1200, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');
INSERT INTO `articles` VALUES (7, 'https://example.com/article2.jpg', 980, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');
INSERT INTO `articles` VALUES (8, 'https://example.com/article3.jpg', 1500, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');
INSERT INTO `articles` VALUES (9, 'https://example.com/article4.jpg', 850, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');
INSERT INTO `articles` VALUES (10, 'https://example.com/article5.jpg', 1100, 0, 0, NULL, '', '', '2026-03-19 14:49:26.716211', '2026-03-19 14:49:26.732454');

-- ----------------------------
-- Table structure for booking
-- ----------------------------
DROP TABLE IF EXISTS `booking`;
CREATE TABLE `booking`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `serviceType` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `serviceName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `serviceAddress` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `bookingDate` datetime NOT NULL,
  `bookingTime` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `notes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userId` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_336b3f4a235460dc93645fbf222`(`userId` ASC) USING BTREE,
  CONSTRAINT `FK_336b3f4a235460dc93645fbf222` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of booking
-- ----------------------------

-- ----------------------------
-- Table structure for care_records
-- ----------------------------
DROP TABLE IF EXISTS `care_records`;
CREATE TABLE `care_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `pet_id` int NOT NULL,
  `type` enum('feeding','walking','grooming','play') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `date` date NOT NULL,
  `time` time NULL DEFAULT NULL,
  `duration` int NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_care_records_pet_id`(`pet_id` ASC) USING BTREE,
  CONSTRAINT `FK_care_records_pet_id` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of care_records
-- ----------------------------
INSERT INTO `care_records` VALUES (1, 1, 'feeding', '2023-12-01', '08:00:00', 10, '早餐，狗粮100g', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (2, 1, 'walking', '2023-12-01', '18:00:00', 30, '傍晚散步', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (3, 2, 'feeding', '2023-12-01', '09:00:00', 5, '猫粮50g', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (4, 2, 'play', '2023-12-01', '15:00:00', 20, '玩逗猫棒', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (5, 3, 'walking', '2023-12-01', '07:00:00', 45, '晨练', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (6, 4, 'grooming', '2023-12-01', '14:00:00', 30, '梳理毛发', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (7, 1, 'feeding', '2023-12-01', '08:00:00', 10, '早餐，狗粮100g', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (8, 1, 'walking', '2023-12-01', '18:00:00', 30, '傍晚散步', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (9, 2, 'feeding', '2023-12-01', '09:00:00', 5, '猫粮50g', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (10, 2, 'play', '2023-12-01', '15:00:00', 20, '玩逗猫棒', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (11, 3, 'walking', '2023-12-01', '07:00:00', 45, '晨练', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (12, 4, 'grooming', '2023-12-01', '14:00:00', 30, '梳理毛发', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (13, 1, 'feeding', '2023-12-01', '08:00:00', 10, '早餐，狗粮100g', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (14, 1, 'walking', '2023-12-01', '18:00:00', 30, '傍晚散步', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (15, 2, 'feeding', '2023-12-01', '09:00:00', 5, '猫粮50g', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (16, 2, 'play', '2023-12-01', '15:00:00', 20, '玩逗猫棒', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (17, 3, 'walking', '2023-12-01', '07:00:00', 45, '晨练', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (18, 4, 'grooming', '2023-12-01', '14:00:00', 30, '梳理毛发', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (19, 1, 'feeding', '2023-12-01', '08:00:00', 10, '早餐，狗粮100g', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (20, 1, 'walking', '2023-12-01', '18:00:00', 30, '傍晚散步', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (21, 2, 'feeding', '2023-12-01', '09:00:00', 5, '猫粮50g', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (22, 2, 'play', '2023-12-01', '15:00:00', 20, '玩逗猫棒', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (23, 3, 'walking', '2023-12-01', '07:00:00', 45, '晨练', '2026-03-20 11:18:27.354798');
INSERT INTO `care_records` VALUES (24, 4, 'grooming', '2023-12-01', '14:00:00', 30, '梳理毛发', '2026-03-20 11:18:27.354798');

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (1, NULL, '', '2026-03-19 14:49:26.620884');
INSERT INTO `categories` VALUES (2, NULL, '', '2026-03-19 14:49:26.620884');
INSERT INTO `categories` VALUES (3, NULL, '', '2026-03-19 14:49:26.620884');
INSERT INTO `categories` VALUES (4, NULL, '', '2026-03-19 14:49:26.620884');

-- ----------------------------
-- Table structure for checkups
-- ----------------------------
DROP TABLE IF EXISTS `checkups`;
CREATE TABLE `checkups`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `pet_id` int NOT NULL,
  `checkup_date` date NOT NULL,
  `hospital` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `doctor` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `weight` decimal(5, 2) NULL DEFAULT NULL,
  `temperature` decimal(3, 1) NULL DEFAULT NULL,
  `diagnosis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `recommendations` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_checkups_pet_id`(`pet_id` ASC) USING BTREE,
  CONSTRAINT `FK_checkups_pet_id` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of checkups
-- ----------------------------
INSERT INTO `checkups` VALUES (1, 1, '2023-06-01', '宠物健康医院', '王医生', 25.50, 38.0, '健康', '定期驱虫，保持运动', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (2, 1, '2023-12-01', '宠物健康医院', '王医生', 26.20, 38.1, '健康', '继续保持良好状态', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (3, 2, '2023-08-01', '爱心宠物医院', '李医生', 4.50, 38.5, '轻微结膜炎', '使用眼药水，注意卫生', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (4, 3, '2023-09-01', '阳光宠物医院', '张医生', 30.00, 38.2, '健康', '控制饮食，避免肥胖', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (5, 4, '2023-10-01', '爱心宠物医院', '李医生', 3.80, 38.3, '健康', '定期接种疫苗', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (6, 1, '2023-06-01', '宠物健康医院', '王医生', 25.50, 38.0, '健康', '定期驱虫，保持运动', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (7, 1, '2023-12-01', '宠物健康医院', '王医生', 26.20, 38.1, '健康', '继续保持良好状态', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (8, 2, '2023-08-01', '爱心宠物医院', '李医生', 4.50, 38.5, '轻微结膜炎', '使用眼药水，注意卫生', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (9, 3, '2023-09-01', '阳光宠物医院', '张医生', 30.00, 38.2, '健康', '控制饮食，避免肥胖', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (10, 4, '2023-10-01', '爱心宠物医院', '李医生', 3.80, 38.3, '健康', '定期接种疫苗', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (11, 1, '2023-06-01', '宠物健康医院', '王医生', 25.50, 38.0, '健康', '定期驱虫，保持运动', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (12, 1, '2023-12-01', '宠物健康医院', '王医生', 26.20, 38.1, '健康', '继续保持良好状态', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (13, 2, '2023-08-01', '爱心宠物医院', '李医生', 4.50, 38.5, '轻微结膜炎', '使用眼药水，注意卫生', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (14, 3, '2023-09-01', '阳光宠物医院', '张医生', 30.00, 38.2, '健康', '控制饮食，避免肥胖', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (15, 4, '2023-10-01', '爱心宠物医院', '李医生', 3.80, 38.3, '健康', '定期接种疫苗', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (16, 1, '2023-06-01', '宠物健康医院', '王医生', 25.50, 38.0, '健康', '定期驱虫，保持运动', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (17, 1, '2023-12-01', '宠物健康医院', '王医生', 26.20, 38.1, '健康', '继续保持良好状态', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (18, 2, '2023-08-01', '爱心宠物医院', '李医生', 4.50, 38.5, '轻微结膜炎', '使用眼药水，注意卫生', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (19, 3, '2023-09-01', '阳光宠物医院', '张医生', 30.00, 38.2, '健康', '控制饮食，避免肥胖', '2026-03-18 17:30:53.212887');
INSERT INTO `checkups` VALUES (20, 4, '2023-10-01', '爱心宠物医院', '李医生', 3.80, 38.3, '健康', '定期接种疫苗', '2026-03-18 17:30:53.212887');

-- ----------------------------
-- Table structure for community_comments
-- ----------------------------
DROP TABLE IF EXISTS `community_comments`;
CREATE TABLE `community_comments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `userId` int NULL DEFAULT NULL,
  `postId` int NULL DEFAULT NULL,
  `content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_40d88998dc1319955950df888ad`(`userId` ASC) USING BTREE,
  INDEX `FK_8cd0b0aabf6e25d0d2f28af6ea4`(`postId` ASC) USING BTREE,
  CONSTRAINT `FK_40d88998dc1319955950df888ad` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_8cd0b0aabf6e25d0d2f28af6ea4` FOREIGN KEY (`postId`) REFERENCES `community_posts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of community_comments
-- ----------------------------
INSERT INTO `community_comments` VALUES (1, 1, 2, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (2, 1, 3, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (3, 2, 1, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (4, 2, 3, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (5, 3, 1, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (6, 3, 2, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (7, 1, 2, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (8, 1, 3, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (9, 2, 1, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (10, 2, 3, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (11, 3, 1, NULL, NULL, '', '2026-03-19 15:19:42.942928');
INSERT INTO `community_comments` VALUES (12, 3, 2, NULL, NULL, '', '2026-03-19 15:19:42.942928');

-- ----------------------------
-- Table structure for community_posts
-- ----------------------------
DROP TABLE IF EXISTS `community_posts`;
CREATE TABLE `community_posts`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `images` json NULL,
  `likes` int NOT NULL DEFAULT 0,
  `comments` int NOT NULL DEFAULT 0,
  `userId` int NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_f9790963910a5c1e3c8684fe790`(`userId` ASC) USING BTREE,
  CONSTRAINT `FK_f9790963910a5c1e3c8684fe790` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of community_posts
-- ----------------------------
INSERT INTO `community_posts` VALUES (1, 1, '[\"https://example.com/post1_1.jpg\", \"https://example.com/post1_2.jpg\"]', 25, 8, NULL, '', '', '2026-03-19 15:19:43.063159', '2026-03-19 15:19:43.084324');
INSERT INTO `community_posts` VALUES (2, 2, '[]', 12, 15, NULL, '', '', '2026-03-19 15:19:43.063159', '2026-03-19 15:19:43.084324');
INSERT INTO `community_posts` VALUES (3, 3, '[\"https://example.com/post3_1.jpg\"]', 30, 10, NULL, '', '', '2026-03-19 15:19:43.063159', '2026-03-19 15:19:43.084324');

-- ----------------------------
-- Table structure for dewormings
-- ----------------------------
DROP TABLE IF EXISTS `dewormings`;
CREATE TABLE `dewormings`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `pet_id` int NOT NULL,
  `type` enum('internal','external','both') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `deworming_date` date NOT NULL,
  `next_date` date NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_dewormings_pet_id`(`pet_id` ASC) USING BTREE,
  CONSTRAINT `FK_dewormings_pet_id` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of dewormings
-- ----------------------------
INSERT INTO `dewormings` VALUES (1, 1, 'both', '拜宠清', '2023-06-15', '2023-09-15', '体内外同驱', '2026-03-18 17:30:53.198921');
INSERT INTO `dewormings` VALUES (2, 1, 'external', '福来恩', '2023-07-15', '2023-10-15', '体外驱虫', '2026-03-18 17:30:53.198921');
INSERT INTO `dewormings` VALUES (3, 2, 'internal', '妙巴', '2023-08-15', '2023-11-15', '体内驱虫', '2026-03-18 17:30:53.198921');
INSERT INTO `dewormings` VALUES (4, 3, 'both', '大宠爱', '2023-09-15', '2023-12-15', '体内外同驱', '2026-03-18 17:30:53.198921');
INSERT INTO `dewormings` VALUES (5, 4, 'external', '爱沃克', '2023-10-15', '2024-01-15', '体外驱虫', '2026-03-18 17:30:53.198921');

-- ----------------------------
-- Table structure for pets
-- ----------------------------
DROP TABLE IF EXISTS `pets`;
CREATE TABLE `pets`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `species` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `breed` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `gender` enum('male','female') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `birthday` date NULL DEFAULT NULL,
  `sterilized` tinyint NOT NULL DEFAULT 0,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `userId` int NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_a9f39dd54113410cdd3a04e80eb`(`userId` ASC) USING BTREE,
  CONSTRAINT `FK_a9f39dd54113410cdd3a04e80eb` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of pets
-- ----------------------------
INSERT INTO `pets` VALUES (1, 1, '小白', '狗', '金毛', 'male', '2023-01-01', 1, 'https://example.com/pet1.jpg', NULL, '2026-03-18 17:30:53.127046', '2026-03-18 17:30:53.150638');
INSERT INTO `pets` VALUES (2, 1, '小黑', '猫', '英短', 'female', '2023-03-15', 0, 'https://example.com/pet2.jpg', NULL, '2026-03-18 17:30:53.127046', '2026-03-18 17:30:53.150638');
INSERT INTO `pets` VALUES (3, 2, '大黄', '狗', '拉布拉多', 'male', '2022-12-01', 1, 'https://example.com/pet3.jpg', NULL, '2026-03-18 17:30:53.127046', '2026-03-18 17:30:53.150638');
INSERT INTO `pets` VALUES (4, 3, '咪咪', '猫', '布偶', 'female', '2023-05-20', 0, 'https://example.com/pet4.jpg', NULL, '2026-03-18 17:30:53.127046', '2026-03-18 17:30:53.150638');
INSERT INTO `pets` VALUES (5, 4, '小橘', '猫', '金毛', 'male', '2004-04-05', 1, NULL, NULL, '2026-03-19 14:39:00.755600', '2026-03-19 14:39:00.755600');
INSERT INTO `pets` VALUES (6, 4, '小伙', '狗', '金毛', 'male', '2025-05-06', 1, NULL, NULL, '2026-03-19 17:37:17.844296', '2026-03-19 17:37:17.844296');
INSERT INTO `pets` VALUES (7, 4, '西克', '猫', '普通', 'male', '2024-05-06', 1, NULL, NULL, '2026-03-19 17:40:39.609644', '2026-03-19 17:40:39.609644');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `IDX_a000cca60bcf04454e72769949`(`phone` ASC) USING BTREE,
  UNIQUE INDEX `IDX_97672ac88f789774dd47f7c8be`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, '13800138000', '$2b$10$cIC56nuCiPq0jVgadF0IuOl40ecdB9kWBER3Fh3PJM6fdR6ZwEpTG', '张三', 'https://example.com/avatar1.jpg', '2026-03-18 17:30:53.027207', '2026-03-20 16:27:17.686834', NULL);
INSERT INTO `users` VALUES (2, '13900139000', '$2b$10$cIC56nuCiPq0jVgadF0IuOl40ecdB9kWBER3Fh3PJM6fdR6ZwEpTG', '李四', 'https://example.com/avatar2.jpg', '2026-03-18 17:30:53.027207', '2026-03-20 16:27:21.233650', NULL);
INSERT INTO `users` VALUES (3, '13700137000', '$2b$10$cIC56nuCiPq0jVgadF0IuOl40ecdB9kWBER3Fh3PJM6fdR6ZwEpTG', '王五', 'https://example.com/avatar3.jpg', '2026-03-18 17:30:53.027207', '2026-03-20 16:26:33.924245', NULL);
INSERT INTO `users` VALUES (4, '18941070556', '$2b$10$cIC56nuCiPq0jVgadF0IuOl40ecdB9kWBER3Fh3PJM6fdR6ZwEpTG', '小王', NULL, '2026-03-19 10:08:41.872483', '2026-03-19 10:08:41.872483', NULL);
INSERT INTO `users` VALUES (5, '13812345678', '$2b$10$NvQvjZuHteXszhTWu8yyvO0Oe2Dc1P02HrrVrMv5RvU.feTc35Bmm', '????', NULL, '2026-03-20 16:22:21.252452', '2026-03-20 16:22:21.252452', NULL);

-- ----------------------------
-- Table structure for vaccinations
-- ----------------------------
DROP TABLE IF EXISTS `vaccinations`;
CREATE TABLE `vaccinations`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `pet_id` int NOT NULL,
  `vaccine_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `vaccination_date` date NOT NULL,
  `next_date` date NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_vaccinations_pet_id`(`pet_id` ASC) USING BTREE,
  CONSTRAINT `FK_vaccinations_pet_id` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of vaccinations
-- ----------------------------
INSERT INTO `vaccinations` VALUES (1, 1, '狂犬疫苗', '2023-06-01', '2024-06-01', '首次接种', '2026-03-18 17:30:53.184662');
INSERT INTO `vaccinations` VALUES (2, 1, '犬瘟热疫苗', '2023-07-01', '2024-07-01', '加强针', '2026-03-18 17:30:53.184662');
INSERT INTO `vaccinations` VALUES (3, 2, '猫三联', '2023-08-01', '2024-08-01', '首次接种', '2026-03-18 17:30:53.184662');
INSERT INTO `vaccinations` VALUES (4, 3, '狂犬疫苗', '2023-09-01', '2024-09-01', '年度接种', '2026-03-18 17:30:53.184662');
INSERT INTO `vaccinations` VALUES (5, 4, '猫三联', '2023-10-01', '2024-10-01', '首次接种', '2026-03-18 17:30:53.184662');
INSERT INTO `vaccinations` VALUES (6, 5, '11', '2026-03-19', NULL, NULL, '2026-03-19 14:40:22.241965');

SET FOREIGN_KEY_CHECKS = 1;
