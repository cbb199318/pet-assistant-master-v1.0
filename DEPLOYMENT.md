# 宠物助手部署说明

## 1. 当前技术基线

- 用户端：Expo Web + Expo Go
- 管理端：React + Vite
- 后端：NestJS + TypeORM
- 默认数据库：`sql.js`

本地开发与答辩演示默认不依赖 MySQL、Redis、OSS。
如果需要，也可以切换到 `MySQL`。

## 2. 环境要求

- Node.js 20 或更高
- npm 10 或更高

## 3. 安装依赖

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix admin-web
```

## 4. 关键环境变量

### 4.1 后端

最小可运行配置：

```env
PORT=4317
JWT_SECRET=pet_assistant_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
CONTENT_ADMIN_USERNAME=editor
CONTENT_ADMIN_PASSWORD=editor123456
DB_TYPE=sqljs
DB_AUTO_LOAD=true
DEMO_SEED_ENABLED=true
```

MySQL 配置示例：

```env
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_NAME=pet_assistant
DB_CHARSET=utf8mb4
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

也可以直接参考：

- [backend/.env.mysql.example](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env.mysql.example)

AI 配置：

```env
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_TEXT_MODEL=deepseek-chat
QWEN_API_KEY=你的密钥
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen3-vl-flash
QWEN_AUDIO_MODEL=qwen3.5-omni-flash
```

### 4.2 前端可选覆盖

一般不需要手动写死 API 地址，只有跨机或特殊网络环境才需要：

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:4317
VITE_API_BASE_URL=http://192.168.1.23:4317
```

## 5. 本地运行

分别启动：

```bash
npm run dev:backend
npm run dev:user
npm run dev:admin
```

或一键联调：

```bash
npm run dev:all
```

原生真机：

```bash
npm run dev:user:native
```

## 6. 构建检查

```bash
npm run check:all
```

健康检查：

```bash
npm run health:check
```

## 7. 演示数据说明

开发启动时默认自动补齐演示数据：

- 演示用户
- 演示宠物
- 健康记录
- 护理计划
- 社区内容
- 知识内容

关闭：

```bash
DEMO_SEED_ENABLED=false npm run dev:backend
```

默认演示普通用户：

```env
DEMO_USER_PHONE=13900009999
DEMO_USER_PASSWORD=demo123456
```

## 8. 生产化建议

### 8.1 后端

```bash
npm --prefix backend run build
npm --prefix backend run start:prod
```

建议配合：

- `pm2`
- `systemd`
- 反向代理

### 8.2 用户端 Web

```bash
npx --prefix frontend expo export --platform web
```

### 8.3 管理端

```bash
npm --prefix admin-web run build
```

### 8.4 反向代理示例

```nginx
server {
    listen 80;
    server_name pet-assistant.local;

    location /api/ {
        proxy_pass http://127.0.0.1:4317;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 9. 已知边界

- 手机浏览器录音一般需要 HTTPS
- 当前默认数据库是 `sql.js`，适合本地和演示，不适合作为正式生产长期方案
- 更复杂的 RBAC、深度运营报表和前端自动化测试暂未纳入本版交付
