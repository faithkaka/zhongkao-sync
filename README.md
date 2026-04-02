# 📚 浙江初中刷题打卡 - 云同步版

> 支持**跨设备数据同步**的在线刷题应用！手机、平板、电脑数据实时互通。

## ✨ 核心特性

| 特性 | 状态 |
|------|------|
| 📱 跨设备同步 | ✅ 手机/电脑/平板数据互通 |
| 💾 数据持久化 | ✅ 云端存储，换设备不丢失 |
| 🔐 用户隔离 | ✅ 支持多个独立用户 |
| 📊 学习统计 | ✅ 打卡天数、正确率、进度 |
| 📝 错题本 | ✅ 自动收集，按科目筛选 |
| 🌐 在线部署 | ✅ 可部署到 GitHub Pages |

---

## 🚀 快速开始

### 第一步：创建 Supabase 项目（免费）

1. 访问 [supabase.com](https://supabase.com) 注册账号
2. 点击「New Project」
3. 填写信息：
   - **Name**: `quiz-sync`
   - **Password**: 设置一个强密码
   - **Region**: 选择 `Singapore`（亚洲节点）
4. 等待项目创建完成

### 第二步：创建数据表

1. 进入项目控制台
2. 点击左侧「SQL Editor」
3. 粘贴并运行以下 SQL：

```sql
-- 用户表
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_days INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0
);

-- 练习历史表
CREATE TABLE practice_history (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    grade INTEGER NOT NULL,
    semester TEXT NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    duration INTEGER NOT NULL,
    subject_stats JSONB NOT NULL,
    question_ids JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 错题表
CREATE TABLE wrong_questions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    question_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    answer TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    subject TEXT NOT NULL,
    knowledge_point TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- 练习状态表
CREATE TABLE practice_state (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id),
    grade INTEGER NOT NULL,
    semester TEXT NOT NULL,
    questions JSONB NOT NULL,
    current_index INTEGER NOT NULL,
    user_answers JSONB NOT NULL,
    elapsed_seconds INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_history_user ON practice_history(user_id);
CREATE INDEX idx_wrongs_user ON wrong_questions(user_id);
```

### 第三步：配置 API

1. 在 Supabase 控制台，点击「Settings」→「API」
2. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon/Public Key**: `eyJhb...`（长篇字符串）

3. 在项目目录下创建 `config.js`：

```bash
cd /Users/kuohai/.homiclaw/workspace/quiz-sync-app
cp config.example.js config.js
```

4. 编辑 `config.js`，填入你的配置：

```javascript
const SUPABASE_CONFIG = {
    url: 'https://你的项目.supabase.co',
    key: '你的 anon key'
};
```

### 第四步：本地测试

```bash
# 使用 Python 启动本地服务器
cd /Users/kuohai/.homiclaw/workspace/quiz-sync-app
python3 -m http.server 8080

# 打开浏览器访问
# http://localhost:8080
```

---

## 📦 部署到 GitHub Pages

### 方法：使用 GitHub Pages 部署

```bash
cd /Users/kuohai/.homiclaw/workspace/quiz-sync-app

# 1. 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 2. 关联远程仓库
# 先在 GitHub 创建仓库，然后：
git remote add origin https://github.com/你的用户名/quiz-sync-app.git

# 3. 推送代码
git branch -M main
git push -u origin main

# 4. 在 GitHub 仓库 → Settings → Pages → Source → 选择 main 分支
```

**⚠️ 安全提示**：

- `config.js` 中的 `key` 是 **public/anon key**，可以安全地放在前端代码中
- Supabase 有 **Row Level Security (RLS)** 保护数据（需要手动开启）

---

## 📋 功能说明

### 🎯 刷题流程

1. **选择学期**：上册/下册
2. **开始练习**：生成 30 道随机题目（5 科×6 题）
3. **答题**：选择答案并提交
4. **查看解析**：错题自动加入错题本
5. **查看统计**：学习数据实时同步

### 👤 用户管理

- 支持创建多个用户（适合多孩子使用）
- 每个用户数据完全隔离
- 切换用户后数据自动刷新

### 📝 错题本

- 自动收集答错的题目
- 可按科目筛选查看
- 支持删除单题或清空全部

### 📊 学习统计

- 打卡天数（按天统计）
- 总答题数
- 平均正确率
- 各科表现分析

---

## 💡 故障排查

### 数据无法同步

1. 检查 `config.js` 是否配置正确
2. 打开浏览器开发者工具，查看控制台错误
3. 确认 Supabase 数据表已正确创建
4. 检查网络连接

### 表不存在错误

```
Error: relation "users" does not exist
```

**解决**：重新运行 SQL Editor 中的建表脚本

### 访问被拒绝

```
new row violates row-level security policy
```

**解决**：在 Supabase → Table Editor → users → Policies 中关闭 RLS，或设置允许匿名访问

---

## 📁 项目结构

```
quiz-sync-app/
├── index.html              # 主页面
├── config.js              # Supabase 配置（需要用户填写）
├── config.example.js      # 配置示例
├── SUPABASE-README.md     # Supabase 配置详解
├── README.md              # 本文档
├── css/
│   ├── style.css          # 主样式
│   └── user.css           # 用户界面样式
└── js/
    ├── supabase-client.js # 轻量 Supabase 客户端
    ├── storage-sync.js    # 云同步存储模块
    ├── data.js            # 题库数据
    ├── grade7-lower.js    # 七年级下册题目
    └── app.js             # 应用逻辑
```

---

## 🎨 自定题库

打开 `js/data.js` 或 `js/grade7-lower.js`，按以下格式添加题目：

```javascript
{
    id: 1,
    subject: '语文',      // 科目：语文/数学/英语/科学/社会
    question: '题目内容',
    options: ['选项A', '选项B', '选项C', '选项D'],
    answer: 0,            // 正确答案索引（0=A, 1=B...）
    explanation: '解析内容',
    knowledgePoint: '知识点'  // 可选
}
```

---

## 🔒 数据安全

| 安全措施 | 说明 |
|----------|------|
| Row Level Security | Supabase 的 RLS 防止越权访问 |
| 数据隔离 | 每个用户数据完全独立 |
| 匿名访问 | 无需登录，直接使用 |

**建议生产环境启用 RLS**：

在 Supabase SQL Editor 中运行：

```sql
-- 为 users 表启用 RLS（可选）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许的匿名操作
CREATE POLICY "允许匿名访问 users" ON users
    FOR ALL USING (true) WITH CHECK (true);
```

---

## 📊 Supabase 免费额度

| 资源 | 免费额度 |
|------|----------|
| 数据库存储 | 500 MB |
| API 请求 | 无限 |
| 每日数据量 | 2 GB |

对于个人使用，**完全免费**！

---

## 🤝 贡献

欢迎提交 Issue 和 PR！

---

**祝你学习进步！📚✨**