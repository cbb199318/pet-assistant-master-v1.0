# 部署方案

## 1. 当前技术栈

- 用户端：`frontend`，Expo 应用，可跑 `Web`、`Expo Go` 和原生调试
- 管理端：`admin-web`，Vite + React
- 后端：`backend`，NestJS + TypeORM
- 默认开发数据库：`sql.js` 文件库，不依赖 MySQL / Redis 才能本地跑通

## 2. 环境要求

- Node.js 18 或更高版本
- npm 9 或更高版本
- 手机真机调试时，电脑和手机需在同一局域网

## 3. 安装依赖

在仓库根目录执行：

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix admin-web
```

## 4. 环境变量

### 4.1 后端 `backend/.env`

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

如果需要真实 AI 能力，再补：

```env
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_TEXT_MODEL=deepseek-chat
QWEN_API_KEY=你的密钥
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen3-vl-flash
QWEN_AUDIO_MODEL=qwen3.5-omni-flash
```

### 4.2 用户端 / 管理端可选覆盖

默认情况下，前端会自动跟随当前访问主机推断后端地址。只有在跨机或特殊网络环境下，才需要手动指定：

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:4317
VITE_API_BASE_URL=http://192.168.1.23:4317
```

## 5. 本地启动

### 5.1 后端

```bash
npm run dev:backend
```

默认地址：`http://127.0.0.1:4317`

### 5.2 用户端

```bash
npm run dev:user
```

- Web 默认地址：`http://127.0.0.1:8934`
- Expo Go：扫描终端二维码即可

### 5.3 管理端

```bash
npm run dev:admin
```

默认地址：`http://127.0.0.1:5617`

### 5.4 一键联调

如果希望一次性拉起三端：

```bash
npm run dev:all
```

如果只想启动开发服务但跳过自动演示种子：

```bash
DEMO_SEED_ENABLED=false npm run dev:backend
```

## 6. 构建验证

建议在交付前执行：

```bash
npm run check:all
```

如果三端已经启动，还可以执行：

```bash
npm run health:check
```

`health:check` 默认检查：

- `http://127.0.0.1:4317/`
- `http://127.0.0.1:4317/health`
- `http://127.0.0.1:4317/api/knowledge/categories`
- `http://127.0.0.1:8934/`
- `http://127.0.0.1:5617/`

## 7. 开发环境演示种子

- `npm run dev:backend` 与 `npm run dev:all` 触发后端 `start:dev` 时，会自动补齐演示数据
- 自动种子默认只在开发启动链路运行，不进入 `npm --prefix backend run start:prod`
- 种子策略是“补齐缺失数据”，不会清空已有本地业务数据
- 若需关闭，可设置 `DEMO_SEED_ENABLED=false`

默认演示普通用户：

```env
DEMO_USER_PHONE=13900009999
DEMO_USER_PASSWORD=demo123456
```

## 8. 管理员角色边界

- `super_admin`
  - 可查看全部后台菜单
  - 可修改系统配置
  - 可删除用户
  - 可删除文章、分类、帖子、评论
- `content_admin`
  - 可审核帖子/评论
  - 可新增、编辑、上下架文章
  - 可新增、编辑分类
  - 可查看审计日志
  - 不显示用户删除和系统配置入口，后端也会拒绝危险操作

## 9. 局域网与真机说明

### 9.1 手机浏览器

- 通过 `http://局域网IP:8934` 访问时，页面可正常请求后端
- 但移动浏览器录音通常需要 `HTTPS` 安全上下文
- 如果要测录音，优先使用 `Expo Go` 真机调试

### 9.2 Expo Go

- 启动 `npm run dev:user`
- 用 Expo Go 扫描终端二维码
- App 会自动从 Expo bundle 地址推断当前开发机 IP，再请求同一台机器的 `4317` 后端

## 10. 生产部署建议

### 10.1 后端

```bash
npm --prefix backend run build
npm --prefix backend run start:prod
```

推荐再配 `pm2` 或 systemd 托管。

### 10.2 前端 Web

用户端与管理端都可以直接构建静态资源后部署到 Nginx：

```bash
npx --prefix frontend expo export --platform web
npm --prefix admin-web run build
```

### 10.3 Nginx 反向代理示例

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

## 11. 验收清单

1. 用户端注册登录正常
2. 宠物头像、用户头像上传正常
3. 疫苗 / 驱虫 / 体检 OCR 与图片上传正常
4. 护理计划可出现在今日待办并可一键完成
5. AI 快捷问题、图片识别、语音问答、语音播报正常
6. 社区帖子、评论、预约链路正常
7. 知识页推荐文章和用品推荐正常
8. 管理端可审核帖子/评论、维护文章推荐、修改系统配置、查看审计日志
9. 管理端概览可展示近 `7 / 30` 天趋势与近 7 天活跃摘要
10. `GET /health` 与 `npm run health:check` 可正常通过
11. 开发环境首次启动后，默认演示账号可直接登录且首页已有待办与演示内容
