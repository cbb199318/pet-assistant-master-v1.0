# 宠物助手 Windows 启动使用说明

本文档面向第一次接手项目的同学，目标是在 Windows 上直接把三端跑起来并完成基础演示。

## 项目结构

当前仓库有三端：

- 用户端：`frontend`
- 管理端：`admin-web`
- 后端：`backend`

默认端口：

- 后端：`4317`
- 用户端 Web：`8934`
- 管理端 Web：`5617`

## 1. 环境要求

建议环境：

- Windows 10 或 Windows 11
- Node.js 22 LTS
- npm 10 及以上
- Git

先确认环境：

```powershell
node -v
npm -v
git --version
```

## 2. 获取代码

如果你拿到的是压缩包，直接解压即可。  
如果你是从 Git 拉代码：

```powershell
git clone <你的仓库地址>
cd pet-assistant-master-v1.0
```

## 3. 安装依赖

在仓库根目录执行：

```powershell
npm install --prefix backend
npm install --prefix frontend
npm install --prefix admin-web
```

## 4. 启动三端

建议开 3 个 PowerShell 窗口，都切到项目根目录执行。

### 窗口 1：启动后端

```powershell
npm run dev:backend
```

启动成功后，后端地址：

```text
http://127.0.0.1:4317
```

### 窗口 2：启动用户端

```powershell
npm run dev:user
```

Web 访问地址：

```text
http://127.0.0.1:8934
```

同时终端会输出 Expo 的二维码，手机真机可直接扫码打开。

### 窗口 3：启动管理端

```powershell
npm run dev:admin
```

管理端地址：

```text
http://127.0.0.1:5617
```

## 5. 默认账号

### 管理端账号

默认管理员账号来自 [backend/.env](/Users/caobingbing/workspace/pet-assistant-master-v1.0/backend/.env)：

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
```

如果 `.env` 没改，直接用上面账号密码登录后台。

### 用户端账号

普通用户没有默认账号，直接在用户端注册即可。

## 6. AI 配置

如果要让 AI 返回真实回答或真实图片/语音识别，需要在 `backend/.env` 里增加或修改：

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
- 未配置时，AI 页面不会崩，但会返回“服务未配置”的提示文本

## 7. 局域网访问

### 用户端 Web 和管理端 Web

先在 Windows 上查看本机局域网 IP：

```powershell
ipconfig
```

找到类似：

```text
IPv4 Address. . . . . . . . . . . : 192.168.1.23
```

然后手机或其他电脑访问：

- 用户端 Web：`http://192.168.1.23:8934`
- 管理端 Web：`http://192.168.1.23:5617`

前端会自动把 API 指到同一台机器的 `4317`，正常情况下不需要改代码。

### 用户端手机真机

用户端原生真机建议直接扫 `npm run dev:user` 输出的 Expo 二维码。项目已加上按 Expo bundle 地址自动识别宿主机 IP 的逻辑，常规局域网环境下不需要手改后端地址。

如果你确实需要手动指定后端，可以这样启动：

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.23:4317"
npm run dev:user
```

管理端也可以同样覆盖：

```powershell
$env:VITE_API_BASE_URL="http://192.168.1.23:4317"
npm run dev:admin
```

## 8. 推荐测试顺序

### 用户端

1. 注册新用户并登录
2. 修改昵称或绑定邮箱
3. 新增一只宠物
4. 分别新增疫苗、驱虫、体检、护理记录
5. 进入 AI 助手，先选择一只宠物，再发送一个问题验证宠物档案联动
6. 从相册选图或直接拍照，验证图片识别和继续追问
7. 录一段语音，先试听一次，再发送验证语音转写问答和历史会话写入
8. 查看 AI 会话历史，切换旧会话或删除一段测试会话
9. 进入社区发帖并在详情页评论
10. 切到“我的帖子 / 我的评论”验证编辑和删除
11. 进入知识百科搜索文章并打开详情

### 管理端

1. 用管理员账号登录
2. 查看概览统计
3. 打开用户管理，搜索并查看用户详情
4. 打开帖子、评论、分类、文章列表
5. 新增或编辑一个知识分类
6. 新增或编辑一篇知识文章

## 9. 当前未完成的模块

以下内容还不属于“已完成”：

- 系统配置后台
- 复杂角色权限管理
- 趋势分析、活跃分析等深度报表
- AI 与宠物上下文联动

## 10. 常见问题

### 登录时报 `network error`

先检查三件事：

1. 后端是否真的启动在 `4317`
2. 手机和电脑是否在同一局域网
3. Windows 防火墙是否拦截了 Node.js

### 手机打开页面了，但接口还是不通

先优先用 Web 方式验证：

- `http://你的IP:8934`
- `http://你的IP:5617`

如果 Web 能通、Expo 真机不通，优先改用环境变量显式指定：

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://你的IP:4317"
npm run dev:user
```

### AI 图片或语音一直提示未配置

确认 `backend/.env` 中至少配置了：

```env
DEEPSEEK_API_KEY=你的文本问答密钥
QWEN_API_KEY=你的 Qwen 密钥
```

其中：

- 没有 `DEEPSEEK_API_KEY` 时，文本问答会走降级提示
- 没有 `QWEN_API_KEY` 时，图片识别和语音转写都会走降级提示

### 管理端登录失败

确认：

- 访问的是 `5617`
- 后端已启动
- `backend/.env` 中管理员账号密码是否被改过
