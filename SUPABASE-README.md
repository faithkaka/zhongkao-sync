# Supabase 配置说明

## 1. 创建 Supabase 账户

访问 https://supabase.com 注册免费账户

## 2. 创建新项目

1. 点击「New Project」
2. 填写项目信息：
   - Name: quiz-sync
   - Database Password: 设置一个强密码
   - Region: 选择亚洲最近的节点（如 Singapore）
3. 点击「Create new project」

## 3. 获取项目配置

项目创建完成后：
1. 进入项目控制台
2. 点击左侧 「Settings」→「API」
3. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhb...`（long string）

## 4. 创建数据表

进入 SQL Editor，执行以下 SQL：

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

-- 练习状态表（保存进度）
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

## 5. 复制配置

将你的 Supabase 配置填入 `config.js`：

```javascript
const SUPABASE_CONFIG = {
    url: 'https://你的项目.supabase.co',
    key: '你的 anon key'
};
```

## 6. 测试连接

打开应用，检查控制台是否有错误。