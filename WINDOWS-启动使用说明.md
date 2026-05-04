# 宠物助手 Windows 启动使用说明

本文档面向第一次在 Windows 上接手项目的同学，目标是尽快把三端跑起来并完成基础测试。

当前仓库默认按 `MySQL` 本地联调配置交付，后端启动后会自动补齐演示数据。

## 1. 环境要求

建议环境：

- Windows 10 / 11
- Node.js 20 或更高
- npm 10 或更高
- Git
- MySQL 8.x

先确认：

```powershell
node -v
npm -v
git --version
```

## 2. 获取项目

如果是压缩包，直接解压。  
如果从 Git 获取：

```powershell
git clone <你的仓库地址>
cd pet-assistant-master-v1.0
```

## 3. 安装依赖

在项目根目录执行：

```powershell
npm install --prefix backend
npm install --prefix frontend
npm install --prefix admin-web
```

## 4. 准备 MySQL

当前项目默认读取 [backend/.env](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env) 里的 MySQL 配置。

先确认 MySQL 服务已启动，然后创建数据库：

```sql
CREATE DATABASE pet_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

如果你要手动调整账号密码，可以参考：

- [backend/.env.mysql.example](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env.mysql.example)

最小需要确认这些字段：

```env
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=你的MySQL账号
DB_PASSWORD=你的MySQL密码
DB_NAME=pet_assistant
DB_CHARSET=utf8mb4
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

`DB_SYNCHRONIZE=true` 代表开发环境会自动建表，适合本地联调。

## 5. 启动方式

### 方式 A：分别启动

建议开 3 个 PowerShell 窗口。

窗口 1：

```powershell
npm run dev:backend
```

窗口 2：

```powershell
npm run dev:user
```

窗口 3：

```powershell
npm run dev:admin
```

### 方式 B：一键联调

```powershell
npm run dev:all
```

建议先启动后端，再启动用户端和管理端。

## 6. 默认地址

- 后端：`http://127.0.0.1:4317`
- 用户端 Web：`http://127.0.0.1:8934`
- 管理端 Web：`http://127.0.0.1:5617`

## 7. 默认账号

### 管理员账号

默认管理员通常来自 [backend/.env](pet-assistant-master-v1.0/backend/.env)：

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
CONTENT_ADMIN_USERNAME=editor
CONTENT_ADMIN_PASSWORD=editor123456
```

### 演示普通用户账号

开发环境默认会自动灌入演示数据：

```env
DEMO_USER_PHONE=13900009999
DEMO_USER_PASSWORD=demo123456
```

## 8. 启动后的自动初始化

当你使用下面任一命令启动后端时：

- `npm run dev:backend`
- `npm run dev:all`

后端会自动补齐演示数据，包括：

- 演示用户
- 2 只演示宠物
- 健康记录
- 护理计划
- 社区帖子与评论
- 知识文章与推荐内容

这个过程是幂等的：

- 不会每次重复插入无限多数据
- 不会主动清空你已有的本地业务数据

如果你想关闭自动种子：

```powershell
$env:DEMO_SEED_ENABLED="false"
npm run dev:backend
```

## 9. Expo Go 真机调试

如果你要测试手机录音、拍照、语音等能力，推荐直接用 Expo Go。

启动命令：

```powershell
npm run dev:user:native
```

然后：

1. 手机安装 Expo Go
2. 电脑和手机连接同一局域网
3. 用 Expo Go 扫终端二维码

这个脚本会尽量自动推断电脑局域网 IP，并把用户端 API 指向这台电脑的 `4317`。

## 10. 局域网访问

先查看本机局域网 IP：

```powershell
ipconfig
```

找到类似：

```text
IPv4 Address. . . . . . . . . . . : 192.168.1.23
```

然后可以在手机浏览器或其他电脑访问：

- 用户端：`http://192.168.1.23:8934`
- 管理端：`http://192.168.1.23:5617`

前端会自动把请求转到同一台机器的后端：

- `http://192.168.1.23:4317`

## 11. 录音测试说明

手机浏览器录音一般要求 `HTTPS` 安全上下文。  
如果你是通过局域网 `HTTP` 页面访问，浏览器可能直接拦截麦克风。

建议：

- 页面录音测试：优先 HTTPS
- 真机录音测试：优先 Expo Go

## 12. 手动覆盖后端地址

如果自动推断失败，可以手动指定。

### 用户端 Web

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.23:4317"
npm run dev:user
```

### 用户端 Expo Go

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.23:4317"
npm run dev:user:native
```

### 管理端

```powershell
$env:VITE_API_BASE_URL="http://192.168.1.23:4317"
npm run dev:admin
```

## 13. AI 配置

如果需要真实 AI 效果，需要在 [backend/.env](pet-assistant-master-v1.0/backend/.env) 中配置：

```env
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_TEXT_MODEL=deepseek-chat
QWEN_API_KEY=你的密钥
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen3-vl-flash
QWEN_AUDIO_MODEL=qwen3.5-omni-flash
```

未配置时：

- 文本问答会提示未配置
- 图片理解会提示未配置
- 语音转写会提示未配置

但页面本身仍能正常使用。

## 14. 数据库说明

当前项目默认就是 `MySQL`。

如果你看到后端健康检查返回：

```json
{"status":"ok","databaseType":"mysql"}
```

说明后端已经成功连到 MySQL。

如果你希望临时改回 `sql.js` 轻量模式，可以把 [backend/.env](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env) 改成：

```env
DB_TYPE=sqljs
SQLJS_LOCATION=pet-assistant.sqlite
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

改完后重新启动后端即可。

## 15. 推荐测试步骤

### 用户端

1. 登录演示账号
2. 查看首页当前主宠物和切换逻辑
3. 进入宠物档案
4. 新增或编辑一条健康记录，验证日期选择器
5. 上传健康凭证图片，验证 OCR 回填
6. 创建护理计划，验证今日待办和一键完成
7. 进入 AI 助手，测试文本、图片、语音和历史对话
8. 进入交流页发帖、评论、预约
9. 进入知识页查看推荐和详情

### 管理端

1. 用管理员账号登录
2. 查看数据分析
3. 进入权限管理查看管理员列表
4. 进入内容管理审核帖子和评论
5. 新增或编辑分类、文章
6. 查看系统配置和审计日志

## 16. 构建与健康检查

```powershell
npm run check:all
npm run health:check
```

`npm run health:check` 正常时，会检查：

- 后端根路由
- `GET /health`
- 知识分类接口
- 用户端 Web
- 管理端 Web

## 17. 常见问题

### `Network error`

优先检查：

1. 后端是否真的启动在 `4317`
2. MySQL 是否已启动，并且 [backend/.env](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env) 里的账号密码正确
3. 当前访问地址和后端是否在同一台机器
4. Windows 防火墙是否拦截 Node.js

### 页面能打开但录音没反应

大概率是当前页面不是安全上下文：

- 局域网 `HTTP` 页面通常不能直接调起麦克风
- 改用 HTTPS 或 Expo Go

### 管理端登录失败

确认：

- 访问的是 `5617`
- 后端已启动
- [backend/.env](pet-assistant-master-v1.0/backend/.env) 中管理员账号密码是否被改过
