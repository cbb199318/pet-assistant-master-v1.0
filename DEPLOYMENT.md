# 部署方案

## 1. 环境要求

### 后端环境
- Node.js 16.x 或更高版本
- MySQL 5.7 或更高版本
- Redis 6.0 或更高版本（用于缓存和消息队列）
- npm 或 yarn 包管理器

### 前端环境
- Node.js 16.x 或更高版本
- npm 或 yarn 包管理器
- Expo CLI（用于构建和部署 React Native 应用）

## 2. 后端部署

### 2.1 安装依赖

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install
```

### 2.2 配置环境变量

创建 `.env` 文件，配置以下环境变量：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=123456
DB_NAME=pet_assistant

# JWT 配置
JWT_SECRET=your_jwt_secret_key

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# AI API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 2.3 数据库设置

1. 创建数据库：

```sql
CREATE DATABASE pet_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 运行测试数据（可选）：

```bash
mysql -u root -p pet_assistant < test-data.sql
```

### 2.4 启动服务

```bash
# 开发环境
npm run start:dev

# 生产环境
npm run build
npm run start:prod
```

## 3. 前端部署

### 3.1 安装依赖

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install
```

### 3.2 配置环境变量

创建 `.env` 文件，配置以下环境变量：

```env
# API 配置
API_URL=http://localhost:3000/api
```

### 3.3 构建和部署

#### 3.3.1 构建 Web 版本

```bash
# 安装 Web 依赖
npx expo install react-native-web react-dom @expo/metro-runtime

# 构建 Web 版本
npx expo export --platform web
```

构建产物将生成在 `dist` 目录中，可以部署到任何静态网站托管服务。

#### 3.3.2 构建 iOS 版本

```bash
# 构建 iOS 版本
eas build --platform ios
```

#### 3.3.3 构建 Android 版本

```bash
# 构建 Android 版本
eas build --platform android
```

## 4. 服务器配置

### 4.1 Nginx 配置

创建 Nginx 配置文件 `/etc/nginx/sites-available/pet-assistant`：

```nginx
server {
    listen 80;
    server_name example.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 启动服务

使用 PM2 管理后端服务：

```bash
# 安装 PM2
npm install -g pm2

# 启动后端服务
cd backend
npm run build
npm run start:prod

# 或者使用 PM2 启动
npm run build
pm2 start dist/main.js
```

## 5. 监控和维护

### 5.1 日志管理

后端日志位于 `backend/logs` 目录，前端日志位于 `frontend/logs` 目录。

### 5.2 数据库备份

定期备份数据库：

```bash
# 备份数据库
mysqldump -u root -p pet_assistant > pet_assistant_backup.sql
```

### 5.3 性能优化

- 使用 Redis 缓存热点数据
- 配置 MySQL 索引优化查询性能
- 启用 Nginx 缓存静态文件
- 定期清理日志和临时文件

## 6. 常见问题

### 6.1 端口占用

如果端口 3000 被占用，可以修改 `backend/src/main.ts` 中的端口配置。

### 6.2 数据库连接失败

检查数据库配置是否正确，确保 MySQL 服务正在运行。

### 6.3 前端无法访问后端 API

检查 CORS 配置，确保后端允许前端域名的跨域请求。

### 6.4 AI 助手无法正常工作

检查 DeepSeek API Key 是否正确配置，确保网络连接正常。

## 7. 部署验证

部署完成后，可以通过以下步骤验证系统是否正常运行：

1. 访问前端页面，尝试注册和登录
2. 添加宠物信息，测试宠物档案功能
3. 测试健康管理、日常护理等功能
4. 测试 AI 助手功能
5. 测试社区和知识百科功能
6. 访问管理后台，测试管理功能
