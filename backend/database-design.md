# 数据库表结构设计

## 1. 用户表 (users)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 用户ID |
| `phone` | `VARCHAR(11)` | `UNIQUE NOT NULL` | 手机号码 |
| `password` | `VARCHAR(255)` | `NOT NULL` | 密码哈希 |
| `nickname` | `VARCHAR(50)` | `NOT NULL` | 昵称 |
| `avatar` | `VARCHAR(255)` | | 头像URL |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

## 2. 宠物表 (pets)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 宠物ID |
| `user_id` | `INT` | `FOREIGN KEY REFERENCES users(id)` | 所属用户ID |
| `name` | `VARCHAR(50)` | `NOT NULL` | 宠物名字 |
| `species` | `VARCHAR(20)` | `NOT NULL` | 宠物种类（猫、狗等） |
| `breed` | `VARCHAR(50)` | | 品种 |
| `gender` | `ENUM('male', 'female')` | | 性别 |
| `birthday` | `DATE` | | 出生日期 |
| `sterilized` | `BOOLEAN` | `DEFAULT FALSE` | 是否绝育 |
| `avatar` | `VARCHAR(255)` | | 宠物头像URL |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

## 3. 疫苗接种记录 (vaccinations)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 记录ID |
| `pet_id` | `INT` | `FOREIGN KEY REFERENCES pets(id)` | 宠物ID |
| `vaccine_name` | `VARCHAR(100)` | `NOT NULL` | 疫苗名称 |
| `vaccination_date` | `DATE` | `NOT NULL` | 接种日期 |
| `next_date` | `DATE` | | 下次接种日期 |
| `notes` | `TEXT` | | 备注 |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |

## 4. 驱虫记录 (dewormings)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 记录ID |
| `pet_id` | `INT` | `FOREIGN KEY REFERENCES pets(id)` | 宠物ID |
| `type` | `ENUM('internal', 'external', 'both')` | `NOT NULL` | 驱虫类型 |
| `product_name` | `VARCHAR(100)` | `NOT NULL` | 产品名称 |
| `deworming_date` | `DATE` | `NOT NULL` | 驱虫日期 |
| `next_date` | `DATE` | | 下次驱虫日期 |
| `notes` | `TEXT` | | 备注 |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |

## 5. 体检记录 (checkups)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 记录ID |
| `pet_id` | `INT` | `FOREIGN KEY REFERENCES pets(id)` | 宠物ID |
| `checkup_date` | `DATE` | `NOT NULL` | 体检日期 |
| `hospital` | `VARCHAR(100)` | `NOT NULL` | 医院名称 |
| `doctor` | `VARCHAR(50)` | | 医生姓名 |
| `weight` | `DECIMAL(5,2)` | | 体重(kg) |
| `temperature` | `DECIMAL(3,1)` | | 体温(℃) |
| `diagnosis` | `TEXT` | | 诊断结果 |
| `recommendations` | `TEXT` | | 医生建议 |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |

## 6. 日常护理记录 (care_records)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 记录ID |
| `pet_id` | `INT` | `FOREIGN KEY REFERENCES pets(id)` | 宠物ID |
| `type` | `ENUM('feeding', 'walking', 'grooming', 'play')` | `NOT NULL` | 护理类型 |
| `date` | `DATE` | `NOT NULL` | 记录日期 |
| `time` | `TIME` | | 记录时间 |
| `duration` | `INT` | | 持续时间(分钟) |
| `notes` | `TEXT` | | 备注 |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |

## 7. AI对话记录 (ai_conversations)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 对话ID |
| `user_id` | `INT` | `FOREIGN KEY REFERENCES users(id)` | 用户ID |
| `pet_id` | `INT` | `FOREIGN KEY REFERENCES pets(id)` | 宠物ID |
| `conversation` | `JSON` | `NOT NULL` | 对话内容（包含用户和AI的消息） |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |

## 8. 社区帖子 (community_posts)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 帖子ID |
| `user_id` | `INT` | `FOREIGN KEY REFERENCES users(id)` | 发布用户ID |
| `title` | `VARCHAR(100)` | `NOT NULL` | 帖子标题 |
| `content` | `TEXT` | `NOT NULL` | 帖子内容 |
| `images` | `JSON` | | 图片URL数组 |
| `likes` | `INT` | `DEFAULT 0` | 点赞数 |
| `comments` | `INT` | `DEFAULT 0` | 评论数 |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

## 9. 社区评论 (community_comments)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 评论ID |
| `post_id` | `INT` | `FOREIGN KEY REFERENCES community_posts(id)` | 帖子ID |
| `user_id` | `INT` | `FOREIGN KEY REFERENCES users(id)` | 评论用户ID |
| `content` | `TEXT` | `NOT NULL` | 评论内容 |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |

## 10. 知识百科文章 (articles)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 文章ID |
| `category_id` | `INT` | `FOREIGN KEY REFERENCES categories(id)` | 分类ID |
| `title` | `VARCHAR(100)` | `NOT NULL` | 文章标题 |
| `content` | `TEXT` | `NOT NULL` | 文章内容 |
| `cover_image` | `VARCHAR(255)` | | 封面图片URL |
| `views` | `INT` | `DEFAULT 0` | 浏览量 |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

## 11. 文章分类 (categories)
| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 分类ID |
| `name` | `VARCHAR(50)` | `NOT NULL UNIQUE` | 分类名称 |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
