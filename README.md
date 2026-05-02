# 宠物助手

当前仓库已经收口为三端联调版本：

- 用户端：`frontend`，Expo 应用，支持 `Web` 和 `局域网手机真机`
- 管理端：`admin-web`，React + Vite 独立后台
- 后端：`backend`，NestJS + `sql.js`

默认开发环境还会自动补齐一套演示种子数据，方便直接做答辩演示。

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

也可以直接一键联调启动：

```bash
npm run dev:all
```

如果你只想启动开发服务但不自动灌入演示数据，可以临时关闭：

```bash
DEMO_SEED_ENABLED=false npm run dev:backend
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
- 健康记录支持拍照上传凭证、OCR 回填、医院/医生快捷选择与手动修正
- 日常护理支持 `record / plan` 双模式、今日待办、一键完成和执行留痕
- AI 问答页面接后端 `/api/ai/chat`
- AI 会话历史：历史列表、继续对话、删除会话、新建对话
- AI 图片理解：支持相册上传和拍照上传，识别结果写入同一会话并支持继续追问
- AI 语音问答：录音上传、发送前本地预听、语音转写、结果写入同一会话并支持继续追问
- AI 宠物档案联动：可为当前会话绑定宠物，后端自动注入宠物基础档案与近期记录作为问答上下文
- AI 快捷问题模板、语音播报和未配置 Key 时的可读降级提示
- 社区：帖子列表、发帖、点赞、帖子详情、评论
- 社区我的内容管理：我的帖子、编辑帖子、删除帖子、我的评论、删除自己的评论
- 社区预约：创建预约、查看预约状态、取消预约、删除预约记录
- 知识百科：分类、推荐、搜索、文章详情、点赞、收藏
- 知识页用品推荐改为后台推荐内容驱动，不再写死在前端
- 开发环境自动补齐演示账号、宠物、健康记录、护理计划、社区内容和知识内容

### 管理端

- 管理员独立登录
- 概览统计：用户、宠物、健康记录、护理记录、帖子、评论、预约、文章、分类
- 最小趋势分析：近 `7 / 30` 天用户、宠物、帖子、预约、文章新增趋势，外加近 7 天活跃摘要
- 用户管理：列表、搜索、详情、删除
- 内容管理：
  - 帖子：列表、搜索、详情、审核状态更新、删除
  - 评论：列表、搜索、详情、审核状态更新、删除
  - 分类：列表、搜索、详情、新增、编辑、删除
  - 文章：列表、搜索、详情、新增、编辑、删除
- 文章支持 `status / kind / is_recommended / sort_order / recommendation_reason`
- 系统配置：基础展示与开关项维护
- 审计日志：管理员操作留痕，支持按管理员、动作、资源类型筛选
- 两级角色增强：
  - `super_admin`：全部菜单与危险操作
  - `content_admin`：内容审核、文章/分类维护、审计日志只读，不显示用户删除和系统配置入口

### 后端

- 普通用户 JWT 与管理员 JWT 分离
- 管理端接口仅允许管理员 token 访问
- 危险后台操作统一收口到 `super_admin`，权限失败返回明确 `403`
- 宠物、健康、护理按当前登录用户校验归属
- 社区帖子、评论、预约链路按 JWT 中 `userId` 归属
- 提供 `GET /health` 健康检查接口
- 提供 `GET /api/admin/dashboard/trends` 最小分析接口
- AI 文本问答未配置 `DEEPSEEK_API_KEY` 时返回可识别降级提示
- AI 图片理解未配置 `QWEN_API_KEY` 时返回可识别降级提示
- AI 语音转写未配置 `QWEN_API_KEY` 时返回可识别降级提示

## 当前未完成

- 更细粒度的 RBAC 权限点与角色权限映射
- 留存、cohort、多维筛选等复杂运营报表
- 前端自动化测试与更完整的端到端测试体系
- 配置变更的实时广播与更完整的系统配置后台
- 更丰富的演示素材与更接近真实运营的数据规模

## 默认管理员账号

管理员账号来自 [backend/.env](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env)；如果未配置，后端也会回退到默认值：

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
CONTENT_ADMIN_USERNAME=editor
CONTENT_ADMIN_PASSWORD=editor123456
```

角色差异：

- `super_admin`：可修改系统配置、删除用户、删除文章/分类、强制删除帖子和评论
- `content_admin`：可审核帖子/评论，可新增编辑文章和分类，可查看审计日志，但不能执行上述危险操作

## 默认演示账号

开发环境通过 `npm run dev:backend` 或 `npm run dev:all` 启动时，后端会自动补齐一套演示数据，默认普通用户账号为：

```env
DEMO_USER_PHONE=13900009999
DEMO_USER_PASSWORD=demo123456
```

演示数据特性：

- 只在开发启动链路自动执行，不进入 `start:prod`
- 采用“补齐缺失数据”策略，不会清空已有本地库
- 重复启动不会无限追加同一批演示数据
- 演示素材统一走本地 `/uploads/demo/*`，不再依赖 `example.com`

环境变量说明：

```env
DEMO_SEED_ENABLED=true
```

- 未显式配置时，`start:dev` 默认开启
- 设为 `false`、`0`、`off`、`no` 时关闭自动演示种子

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
3. 也可以直接使用默认演示账号登录，检查首页今日待办、健康记录和社区内容是否已自动补齐
4. 在健康页体验拍照识别，确认表单自动回填并可手动修正
5. 创建一个护理计划，回到首页或护理页完成今日待办
6. 进入 AI 助手发送快捷问题，再测试图片识别和语音问答
7. 发一篇社区帖子并创建一条预约
8. 打开知识百科做搜索并查看推荐用品内容
9. 用管理员账号登录后台，查看概览、审核帖子/评论、维护文章推荐和系统配置

## 交付校验

构建与类型检查：

```bash
npm run check:all
```

运行中健康检查：

```bash
npm run health:check
```

其中会检查：

- 后端根路由 `/`
- 后端健康接口 `/health`
- 知识分类接口 `/api/knowledge/categories`
- 用户端 Web `8934`
- 管理端 Web `5617`
