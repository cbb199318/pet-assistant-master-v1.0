# 宠物助手

当前仓库已经收口为三端联调版本：

- 用户端：`frontend`，Expo 应用，支持 `Web` 和 `局域网手机真机`
- 管理端：`admin-web`，React + Vite 独立后台
- 后端：`backend`，NestJS + `sql.js`

补充文档：

- Windows 启动说明：[WINDOWS-启动使用说明.md](/Users/caobingbing/workspace/pet-assistant-master-v1.0/WINDOWS-启动使用说明.md)
- 产品设计文档：[产品设计文档.md](/Users/caobingbing/workspace/pet-assistant-master-v1.0/产品设计文档.md)

## 启动方式

先安装依赖：

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix admin-web
```

再从仓库根目录分别启动三端：

```bash
npm run dev:backend
npm run dev:user
npm run dev:admin
```

默认端口：

- 后端：`http://127.0.0.1:4317`
- 用户端 Web：`http://127.0.0.1:8934`
- 管理端 Web：`http://127.0.0.1:5617`

## 局域网访问

### 用户端 Web / 管理端 Web

前端会优先按当前访问页面的主机名自动推断后端地址：

- 电脑本机访问 `http://localhost:8934` 时，会请求 `http://localhost:4317`
- 手机访问 `http://192.168.x.x:8934` 时，会请求 `http://192.168.x.x:4317`
- 管理端同理，`5617 -> 4317`

### 手机真机 Expo

用户端原生真机现在会优先从 Expo 的 bundle 地址自动提取当前开发机 IP，再请求同一台机器上的 `4317` 后端。正常情况下：

- 换一台电脑启动项目，不需要改代码
- 只要手机扫的是该电脑 Expo 输出的二维码，API 会自动跟随到那台电脑

如果你需要手动覆盖后端地址，可以在启动前设置环境变量：

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:4317 npm run dev:user
VITE_API_BASE_URL=http://192.168.1.23:4317 npm run dev:admin
```

## 当前已交付

### 用户端

- 注册、登录、获取个人资料
- 修改昵称头像、修改密码、绑定邮箱
- 宠物档案新增、列表、编辑、删除
- 健康管理：疫苗、驱虫、体检记录增删改查
- 日常护理记录增删改查
- AI 问答页面接后端 `/api/ai/chat`
- AI 会话历史：历史列表、继续对话、删除会话、新建对话
- AI 图片理解：支持相册上传和拍照上传，识别结果写入同一会话并支持继续追问
- AI 语音问答：录音上传、发送前本地预听、语音转写、结果写入同一会话并支持继续追问
- AI 宠物档案联动：可为当前会话绑定宠物，后端自动注入宠物基础档案与近期记录作为问答上下文
- 社区：帖子列表、发帖、点赞、帖子详情、评论
- 社区我的内容管理：我的帖子、编辑帖子、删除帖子、我的评论、删除自己的评论
- 知识百科：分类、推荐、搜索、文章详情、点赞、收藏

### 管理端

- 管理员独立登录
- 概览统计：用户、宠物、健康记录、护理记录、帖子、评论、文章、分类
- 用户管理：列表、搜索、详情、删除
- 内容管理：
  - 帖子：列表、搜索、详情、删除
  - 评论：列表、搜索、详情、删除
  - 分类：列表、搜索、详情、新增、编辑、删除
  - 文章：列表、搜索、详情、新增、编辑、删除

### 后端

- 普通用户 JWT 与管理员 JWT 分离
- 管理端接口仅允许管理员 token 访问
- 宠物、健康、护理按当前登录用户校验归属
- 社区帖子、评论、预约链路按 JWT 中 `userId` 归属
- AI 文本问答未配置 `DEEPSEEK_API_KEY` 时返回可识别降级提示
- AI 图片理解未配置 `QWEN_API_KEY` 时返回可识别降级提示
- AI 语音转写未配置 `QWEN_API_KEY` 时返回可识别降级提示

## 当前未完成

- 用户端知识百科后台化推荐策略、发布流程
- 社区预约功能未纳入主流程验收
- AI 快捷问题模板
- 管理端系统配置
- 管理端复杂权限体系和 RBAC UI
- 管理端趋势分析、活跃分析、运营报表

## 默认管理员账号

管理员账号来自 [backend/.env](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env)；如果未配置，后端也会回退到默认值：

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
```

## AI 配置

如果希望 AI 返回真实能力，需要在后端环境变量里设置：

```env
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_TEXT_MODEL=deepseek-chat
QWEN_API_KEY=你的密钥
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen3-vl-flash
QWEN_AUDIO_MODEL=qwen3.5-omni-flash
```

- `DEEPSEEK_API_KEY` 用于文本问答
- `DEEPSEEK_BASE_URL` 和 `DEEPSEEK_TEXT_MODEL` 用于 DeepSeek 文本模型配置
- `QWEN_API_KEY` 用于图片理解和语音转写
- `QWEN_VISION_MODEL` 用于图片理解模型，默认按 `qwen3-vl-flash`
- `QWEN_AUDIO_MODEL` 用于语音转写模型
- 未配置时，前端仍可正常请求，但会收到明确的降级提示文本

当前 AI 架构固定为：

- `POST /api/ai/chat` 走 `DeepSeek`
- `POST /api/ai/image/analyze` 走 `Qwen Vision`
- `POST /api/ai/audio/chat` 走 `Qwen Audio + DeepSeek`

## 建议验证顺序

1. 用户端注册新用户并登录
2. 新增宠物，补一条疫苗、一条驱虫、一条体检、一条护理
3. 进入 AI 助手发送问题
4. 从相册选择一张图片做识别，并继续追问一句
5. 录一段语音发送，确认能写入 AI 会话历史
6. 发一篇社区帖子并进入详情评论
7. 打开知识百科做搜索并进入文章详情
8. 用管理员账号登录后台，查看概览、用户、帖子、评论、分类、文章
