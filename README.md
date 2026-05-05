# 宠物助手

宠物助手当前是一个三端联调项目：

- 用户端：`frontend`
- 管理端：`admin-web`
- 后端：`backend`

项目默认以“本地开发可直接演示”为目标，开发环境启动后会自动补齐演示数据，不依赖额外数据库服务。

相关文档：

- 产品设计文档：[产品设计文档.md](/Users/caobingbing/workspace/pet-assistant-master-v1.0/产品设计文档.md)
- Windows 启动说明：[WINDOWS-启动使用说明.md](/Users/caobingbing/workspace/pet-assistant-master-v1.0/WINDOWS-启动使用说明.md)
- 部署说明：[DEPLOYMENT.md](/Users/caobingbing/workspace/pet-assistant-master-v1.0/DEPLOYMENT.md)

## 当前结构

- `frontend`
  - Expo 用户端，支持 Web、Expo Go 真机调试
- `admin-web`
  - React + Vite 管理后台
- `backend`
  - NestJS + TypeORM + `sql.js`
- `scripts`
  - 三端联调、构建检查、健康检查、原生真机启动辅助脚本

## 快速开始

先安装依赖：

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix admin-web
```

再启动项目：

```bash
npm run dev:backend
npm run dev:user
npm run dev:admin
```

也可以直接一键联调：

```bash
npm run dev:all
```

默认地址：

- 后端：`http://127.0.0.1:4317`
- 用户端 Web：`http://127.0.0.1:8934`
- 管理端 Web：`http://127.0.0.1:5617`

## 常用脚本

```bash
npm run dev:backend
npm run dev:user
npm run dev:user:native
npm run dev:admin
npm run dev:all
npm run check:all
npm run health:check
```

说明：

- `dev:user`
  - 启动用户端 Web，适合本机和局域网浏览器测试
- `dev:user:native`
  - 启动 Expo 原生调试，适合 Expo Go 真机扫码
- `check:all`
  - 依次检查 `backend build + frontend tsc + admin-web build`
- `health:check`
  - 检查后端、用户端 Web、管理端 Web 是否可访问

## 默认账号

管理员账号默认来自 [backend/.env](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env)，未修改时一般是：

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
CONTENT_ADMIN_USERNAME=editor
CONTENT_ADMIN_PASSWORD=editor123456
```

开发环境演示普通用户默认是：

```env
DEMO_USER_PHONE=13900009999
DEMO_USER_PASSWORD=demo123456
```

## 演示数据

开发环境通过 `npm run dev:backend` 或 `npm run dev:all` 启动时，后端会自动补齐演示数据：

- 演示用户
- 演示宠物
- 健康记录
- 护理计划
- 社区帖子与评论
- 知识文章与推荐内容

关闭方式：

```bash
DEMO_SEED_ENABLED=false npm run dev:backend
```

特性：

- 只在开发启动链路执行
- 重复启动不会无限重复插入
- 不会主动清空你已有的本地数据

## 数据库说明

当前项目默认使用：

- `TypeORM`
- 本地 `sql.js`

也支持切换到 `MySQL`。

如果你想改成 MySQL，先准备一个数据库，例如：

```sql
CREATE DATABASE pet_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后把 [backend/.env](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env) 改成类似下面这样：

```env
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=你的MySQL密码
DB_NAME=pet_assistant
DB_CHARSET=utf8mb4
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

仓库里也提供了示例文件：

- [backend/.env.mysql.example](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env.mysql.example)

说明：

- `DB_SYNCHRONIZE=true`
  - 开发环境自动建表，方便联调
- `DB_LOGGING=false`
  - 关闭 SQL 日志；排查问题时可以改成 `true`

切换后重新启动后端即可：

```bash
npm run dev:backend
```

## 用户端当前功能

### 导航结构

底部导航当前为：

- 首页
- 知识
- AI 助手
- 交流
- 我的

首页是“当前主宠物”视图：

- 支持切换主宠物
- 展示主宠物基础信息
- 展示今日护理和健康摘要
- 从首页进入宠物档案、健康管理、日常护理

### 已完成模块

- 用户注册、登录、资料读取
- 修改昵称、头像、密码、邮箱
- 宠物档案新增、编辑、删除
- 宠物生日、健康记录日期、护理计划日期统一使用日期选择器
- 健康管理
  - 疫苗记录
  - 驱虫记录
  - 体检记录
  - 上传凭证图片
  - OCR 识别回填
  - 医院 / 医生信息录入
- 日常护理
  - `record / plan` 双模式
  - 今日待办
  - 一键完成
  - 执行留痕
- AI 助手
  - 文本问答
  - 图片理解
  - 语音问答
  - 历史对话
  - 新建对话
  - 对话可绑定宠物，也可不绑定
- 社区
  - 帖子、评论、我的内容
  - 预约创建、取消、删除
- 知识
  - 分类、推荐、搜索、详情
  - 后台推荐内容驱动

## 管理端当前功能

- 独立管理员登录
- 数据分析工作台
  - 概览统计
  - 近 `7 / 30` 天趋势
  - 近 7 天活跃摘要
- 权限管理
  - 管理员列表
  - 新增管理员
  - 改角色
  - 启停用
  - 重置密码
- 用户管理
- 内容管理
  - 帖子
  - 评论
  - 分类
  - 文章
- 系统配置
- 审计日志

### 当前管理员角色

- `super_admin`
  - 全部权限
- `content_admin`
  - 内容审核与内容维护
- `viewer_admin`
  - 只读查看

权限控制已经是“角色 + 权限点”模式，前后端都会做校验。

## AI 配置

如果要启用真实 AI 能力，需要在 [backend/.env](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env) 中配置：

```env
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_TEXT_MODEL=deepseek-chat
QWEN_API_KEY=你的密钥
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen3.5-omni-plus
QWEN_AUDIO_MODEL=qwen3.5-omni-plus
QWEN_AUDIO_VOICE=Tina
```

说明：

- `DeepSeek`
  - 文本问答
- `Qwen Vision`
  - 图片理解
- `Qwen Audio`
  - 语音转写
  - 语音播报默认使用 `Tina` 音色，如需自定义请确保该模型支持对应 voice
- 如果你的 Key 是在阿里云国内地域创建的，请使用 `dashscope.aliyuncs.com`；北京和新加坡地域的 Key 不通用

未配置时，前端仍可正常请求，但会收到清晰的降级提示。

## 局域网与真机测试

### 局域网浏览器

用户端和管理端会根据当前访问主机自动推断后端地址：

- `8934 -> 4317`
- `5617 -> 4317`

例如手机访问：

- `http://192.168.1.23:8934`
- `http://192.168.1.23:5617`

前端会自动请求：

- `http://192.168.1.23:4317`

### 录音说明

手机浏览器录音通常要求 `HTTPS` 安全上下文。  
如果通过局域网 `HTTP` 页面访问，浏览器可能直接拦截麦克风。

建议：

- 浏览器录音测试：使用 HTTPS
- 真机录音测试：优先使用 Expo Go

### Expo Go

推荐命令：

```bash
npm run dev:user:native
```

这个脚本会尽量自动推断当前开发机局域网 IP，减少手动配 API 地址的成本。

## 推荐测试顺序

1. 登录演示账号或注册新用户
2. 进入首页，确认主宠物信息与切换逻辑正常
3. 进入宠物档案、健康管理、日常护理
4. 新建一条疫苗 / 驱虫 / 体检记录，验证日期选择器
5. 上传健康凭证图片，验证 OCR 回填
6. 创建一条护理计划，验证今日待办和一键完成
7. 进入 AI 助手，测试文本、图片、语音和历史对话
8. 进入社区发帖、评论、预约
9. 进入知识页搜索文章和查看推荐内容
10. 登录管理端，查看数据分析、内容管理、权限管理

## 构建与健康检查

构建检查：

```bash
npm run check:all
```

运行中检查：

```bash
npm run health:check
```

默认会检查：

- `http://127.0.0.1:4317/`
- `http://127.0.0.1:4317/health`
- `http://127.0.0.1:4317/api/knowledge/categories`
- `http://127.0.0.1:8934/`
- `http://127.0.0.1:5617/`

## 当前不包含

以下内容目前不属于已完成交付：

- 更复杂的 RBAC 配置台
- 留存 / cohort / 多维筛选报表
- 前端自动化测试体系
- 生产级多实例部署编排
