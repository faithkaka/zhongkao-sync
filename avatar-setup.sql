-- ============================================
-- 头像功能 SQL 脚本
-- 在 Supabase SQL Editor 中运行
-- ============================================

-- 1. 为 users 表添加 avatar_url 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. 创建存储桶用于存储头像
-- 在 Supabase 控制台：Storage → Create new bucket
-- Bucket name: avatars
-- Public: true
-- File size limit: 1MB (可选)

-- 3. 或者使用 SQL 创建存储桶（需要管理员权限）
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. 设置存储桶权限（允许匿名上传）
CREATE POLICY "允许匿名上传头像" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "允许匿名读取头像" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "允许匿名用户删除自己的头像" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars');

-- 5. 验证
-- 检查 users 表是否有 avatar_url 字段
-- \d users

-- ============================================
-- 运行完成后，刷新应用即可使用头像功能
-- ============================================