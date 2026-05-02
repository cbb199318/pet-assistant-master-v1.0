-- 测试数据SQL文件

-- 1. 用户表测试数据
INSERT INTO users (phone, password, nickname, avatar) VALUES
('13800138001', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '张三', 'https://example.com/avatar1.jpg'),
('13800138002', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '李四', 'https://example.com/avatar2.jpg'),
('13800138003', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '王五', 'https://example.com/avatar3.jpg');

-- 2. 宠物表测试数据
INSERT INTO pets (user_id, name, species, breed, gender, birthday, sterilized, avatar) VALUES
(1, '小白', '狗', '拉布拉多', 'male', '2020-01-01', true, 'https://example.com/pet1.jpg'),
(1, '小花', '猫', '布偶猫', 'female', '2021-03-15', true, 'https://example.com/pet2.jpg'),
(2, '小黑', '狗', '金毛', 'male', '2019-11-10', false, 'https://example.com/pet3.jpg'),
(3, '小米', '猫', '英短', 'female', '2022-05-20', true, 'https://example.com/pet4.jpg');

-- 3. 疫苗接种记录测试数据
INSERT INTO vaccinations (pet_id, vaccine_name, vaccination_date, next_date, notes) VALUES
(1, '狂犬疫苗', '2023-01-15', '2024-01-15', '年度狂犬疫苗'),
(1, '犬瘟热疫苗', '2023-03-20', '2024-03-20', '三联疫苗'),
(2, '猫三联疫苗', '2023-04-10', '2024-04-10', '猫瘟、猫鼻支、猫杯状病毒'),
(3, '狂犬疫苗', '2023-02-01', '2024-02-01', '年度狂犬疫苗'),
(4, '猫三联疫苗', '2023-06-01', '2024-06-01', '猫瘟、猫鼻支、猫杯状病毒');

-- 4. 驱虫记录测试数据
INSERT INTO dewormings (pet_id, type, product_name, deworming_date, next_date, notes) VALUES
(1, 'both', '拜宠清', '2023-02-10', '2023-05-10', '体内外驱虫'),
(1, 'external', '福来恩', '2023-03-15', '2023-04-15', '体外驱虫'),
(2, 'internal', '海乐妙', '2023-03-20', '2023-06-20', '体内驱虫'),
(3, 'both', '拜宠清', '2023-01-20', '2023-04-20', '体内外驱虫'),
(4, 'external', '福来恩', '2023-05-10', '2023-06-10', '体外驱虫');

-- 5. 体检记录测试数据
INSERT INTO checkups (pet_id, checkup_date, hospital, doctor, weight, temperature, diagnosis, recommendations) VALUES
(1, '2023-01-01', '宠物医院A', '王医生', 25.5, 38.5, '健康', '继续保持良好的饮食和运动习惯'),
(1, '2023-07-01', '宠物医院A', '王医生', 26.0, 38.3, '健康', '建议增加运动量'),
(2, '2023-02-15', '宠物医院B', '李医生', 4.5, 38.7, '轻微牙龈炎', '建议刷牙，使用牙粉'),
(3, '2023-03-01', '宠物医院C', '张医生', 30.0, 38.4, '健康', '继续保持良好的饮食和运动习惯'),
(4, '2023-04-10', '宠物医院B', '李医生', 3.8, 38.6, '健康', '建议增加饮水量');

-- 6. 日常护理记录测试数据
INSERT INTO care_records (pet_id, type, date, time, duration, notes) VALUES
(1, 'feeding', '2023-07-01', '08:00', 10, '早餐：狗粮'),
(1, 'walking', '2023-07-01', '18:00', 30, '傍晚散步'),
(1, 'feeding', '2023-07-02', '08:00', 10, '早餐：狗粮'),
(2, 'feeding', '2023-07-01', '09:00', 5, '早餐：猫粮'),
(2, 'grooming', '2023-07-01', '15:00', 20, '梳毛'),
(3, 'feeding', '2023-07-01', '08:30', 15, '早餐：狗粮'),
(3, 'walking', '2023-07-01', '19:00', 40, '晚上散步'),
(4, 'feeding', '2023-07-01', '08:00', 5, '早餐：猫粮'),
(4, 'play', '2023-07-01', '14:00', 15, '玩逗猫棒');

-- 7. 社区帖子测试数据
INSERT INTO community_posts (user_id, title, content, images, likes, comments) VALUES
(1, '我家小白的日常', '小白是一只非常活泼的拉布拉多，喜欢玩球和游泳。', '["https://example.com/post1-1.jpg", "https://example.com/post1-2.jpg"]', 10, 5),
(2, '求助：我家小黑最近不爱吃饭', '小黑最近食欲下降，不知道是什么原因，有经验的朋友可以分享一下吗？', '["https://example.com/post2-1.jpg"]', 8, 12),
(3, '小花的新发型', '带小花去做了新发型，大家觉得怎么样？', '["https://example.com/post3-1.jpg"]', 15, 8),
(1, '分享一些养猫小技巧', '作为一名资深猫奴，我想分享一些养猫的小技巧，希望对大家有帮助。', '[]', 20, 15),
(2, '带小黑去爬山', '周末带小黑去爬山，它玩得非常开心！', '["https://example.com/post5-1.jpg", "https://example.com/post5-2.jpg"]', 12, 6);

-- 8. 社区评论测试数据
INSERT INTO community_comments (post_id, user_id, content) VALUES
(1, 2, '小白好可爱！'),
(1, 3, '拉布拉多确实很活泼，我家也有一只。'),
(2, 1, '可能是天气太热了，试试给它喂点凉的食物。'),
(2, 3, '我家猫也有过类似的情况，后来带去医院检查是消化不良。'),
(3, 1, '小花的新发型真好看！'),
(3, 2, '在哪里做的？看起来很不错。'),
(4, 2, '非常实用的技巧，谢谢分享！'),
(4, 3, '学到了很多，感谢！'),
(5, 1, '小黑看起来很开心！'),
(5, 3, '下次可以一起去爬山。');

-- 9. 文章分类测试数据
INSERT INTO categories (name) VALUES
('宠物饲养'),
('宠物健康'),
('宠物训练'),
('宠物美容'),
('宠物用品');

-- 10. 知识百科文章测试数据
INSERT INTO articles (category_id, title, content, cover_image, views) VALUES
(1, '如何正确给狗狗喂食', '狗狗的饮食需要注意营养均衡，不同年龄段的狗狗需要不同的饮食方案...', 'https://example.com/article1.jpg', 1000),
(1, '猫咪的饮食禁忌', '猫咪有一些食物是不能吃的，比如巧克力、洋葱、大蒜等...', 'https://example.com/article2.jpg', 800),
(2, '狗狗常见疾病及预防', '狗狗常见的疾病有感冒、皮肤病、寄生虫等，需要定期预防...', 'https://example.com/article3.jpg', 1200),
(2, '猫咪的日常护理', '猫咪的日常护理包括梳毛、修剪指甲、清洁耳朵等...', 'https://example.com/article4.jpg', 900),
(3, '狗狗基本训练技巧', '狗狗的基本训练包括坐下、握手、趴下等，需要耐心和正确的方法...', 'https://example.com/article5.jpg', 1500),
(3, '猫咪行为训练', '猫咪的行为训练包括使用猫砂盆、不抓家具等...', 'https://example.com/article6.jpg', 700),
(4, '狗狗美容指南', '狗狗的美容包括洗澡、修剪毛发、清洁牙齿等...', 'https://example.com/article7.jpg', 600),
(4, '猫咪的毛发护理', '猫咪的毛发需要定期梳理，不同品种的猫咪需要不同的护理方法...', 'https://example.com/article8.jpg', 500),
(5, '宠物用品选购指南', '选择宠物用品时需要考虑质量、安全性、适用性等因素...', 'https://example.com/article9.jpg', 800),
(5, '如何选择适合的宠物玩具', '宠物玩具需要根据宠物的年龄、体型、性格等因素来选择...', 'https://example.com/article10.jpg', 700);
