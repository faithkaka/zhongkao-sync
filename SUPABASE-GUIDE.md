# Supabase 详细配置指南（图文版）

## 📱 手机也能看！按步骤操作即可

---

## 步骤 1：注册账号

1. 打开浏览器访问：https://supabase.com
2. 右上角点击 **"Start your project"**
3. 用 GitHub 账号或邮箱注册

💡 **提示**：用 GitHub 注册最方便

---

## 步骤 2：创建新项目

点击 **"New Project"** 按钮

填写信息：
- **Organization**: 默认即可（或选你的组织）
- **Project name**: `quiz-sync-app`（项目名）
- **Database Password**: 输入强密码！
  - 格式：包含大小写字母+数字+符号
  - 示例：`MyQuizApp2024!@`
  - ⚠️ 务必保存好这个密码！
- **Region**: **Singapore**（离中国最近）

点击 **"Create new project"**

⏱️ 等待 1-2 分钟项目初始化...

---

## 步骤 3：获取配置信息

项目创建完成后，在左侧面板：

### 3.1 点击 Settings → API

你会看到：

```
Project URL: https://xxxxxxxxxx.supabase.co
  └─ 复制这行 URL

Project API keys
  ├─ anon / public（这是长字符串）
  └─ 点击 "Copy" 按钮复制
```

### 3.2 保存这两个值：

```
URL:  https://xxxxx.supabase.co
KEY:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 步骤 4：创建数据表（关键！）

1. 点击左侧菜单 **"SQL Editor"**
2. 点击 **"New query"**
3. 粘贴以下 SQL 代码：

```sql
-- ============================================
-- 刷题应用数据表创建脚本
-- 复制此代码，粘贴到 SQL Editor 中运行
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_days INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0
);

-- 2. 练习历史表
CREATE TABLE IF NOT EXISTS practice_history (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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

-- 3. 错题表
CREATE TABLE IF NOT EXISTS wrong_questions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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

-- 4. 练习状态表（保存进度）
CREATE TABLE IF NOT EXISTS practice_state (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    grade INTEGER NOT NULL,
    semester TEXT NOT NULL,
    questions JSONB NOT NULL,
    current_index INTEGER NOT NULL,
    user_answers JSONB NOT NULL,
    elapsed_seconds INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引（提高查询速度）
CREATE INDEX IF NOT EXISTS idx_history_user ON practice_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON practice_history(created_at);
CREATE INDEX IF NOT EXISTS idx_wrongs_user ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_wrongs_subject ON wrong_questions(subject);

-- 关闭行级安全策略（允许匿名访问，如需保护数据可开启）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE practice_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE wrong_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE practice_state DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 创建完成！你会看到 "Success" 提示
-- ============================================
```

4. 点击 **"Run"** 按钮
5. 等待显示 **"Success. No rows returned"**

✅ **数据表创建成功！**

---

## 步骤 5：配置项目文件

现在回到本地项目：

### 5.1 编辑 config.js

```bash
# 在项目目录下
cd /Users/kuohai/.homiclaw/workspace/quiz-sync-app

# 打开 config.js 编辑
```

填写你的配置：

```javascript
const SUPABASE_CONFIG = {
    // 从 Supabase Settings → API 复制
    url: 'https://你的项目标识.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...你的anon key'
};
```

### 5.2 示例

如果你的配置是：
```
URL: https://abc123xyz.supabase.co
KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY...
```

那么 config.js 应该是：

```javascript
const SUPABASE_CONFIG = {
    url: 'https://abc123xyz.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY...'
};
```

---

## 步骤 6：测试连接

### 6.1 刷新页面

回到浏览器，刷新 http://localhost:8080

### 6.2 观察控制台

按 F12 打开开发者工具，查看 Console：

- ✅ 看到 `✅ Supabase 客户端已初始化` → 连接成功
- ✅ 看到 `✅ 云同步模式已启用` → 可以使用了

---

## 步骤 7：验证同步功能

### 7.1 创建用户
1. 点击右上角用户头像
2. 输入用户名（如"测试用户"）
3. 点击添加

### 7.2 检查数据
回到 Supabase 控制台：
1. 点击 **Table Editor**
2. 查看 **users** 表
3. 你应该能看到刚创建的用户记录！

✨ **这就是跨设备同步的秘密！**

---

## 🔧 常见问题

### Q1: 显示 "数据服务未配置"
- 检查 config.js 是否保存
- 刷新页面
- 检查 URL 和 KEY 是否正确

### Q2: 控制台报错 "relation does not exist"
- 回到 SQL Editor
- 重新运行建表脚本

### Q3: 数据无法保存
- 检查是否禁用了 Row Level Security（已在脚本中自动禁用）
- 检查网络连接

### Q4: 手机和电脑能同步吗？
- ✅ 只要使用同一个 config.js 配置
- ✅ 数据存储在 Supabase 云端
- ✅ 任何设备访问都同步！

---

## 📱 手机使用

配置完成后，手机也能用：

1. 将项目部署到 GitHub Pages
2. 手机访问生成的网址
3. 数据自动同步！

---

**配置完成后，你的刷题应用就拥有：**
- ✅ 云端数据存储
- ✅ 跨设备同步
- ✅ 永久数据保存
- ✅ 多用户管理

🎉 开始刷题吧！