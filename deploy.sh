#!/bin/bash
# 部署脚本 - quiz-sync-app

echo "🚀 浙江初中刷题打卡 - 云同步版部署"
echo "======================================"
echo ""

# 检查 config.js
if [ ! -f "config.js" ]; then
    echo "⚠️  config.js 不存在，从示例文件创建..."
    cp config.example.js config.js
    echo "👆 请编辑 config.js，填写 Supabase 配置后继续"
    echo ""
    exit 1
fi

# 检查 Git
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
fi

echo "📍 当前 Git 远程仓库："
git remote -v 2>/dev/null || echo "（未配置）"

echo ""
read -p "🌐 请输入 GitHub 仓库地址 (留空则跳过): " REPO_URL

if [ -n "$REPO_URL" ]; then
    git remote remove origin 2>/dev/null
    git remote add origin "$REPO_URL"
    echo "✅ 远程仓库已配置"
fi

echo ""
echo "📤 提交代码..."
git add .
git commit -m "Deploy to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')"
git branch -M main
git push -u origin main

echo ""
echo "======================================"
echo "✅ 推送完成！"
echo "======================================"
echo ""
echo "🌐 在 GitHub 中开启 Pages："
echo "   Settings → Pages → Source → main 分支"
echo ""
echo "📱 访问地址格式："
echo "   https://你的用户名.github.io/仓库名/"
echo ""
echo "⚠️ 确保已配置 config.js 中的 Supabase 信息！"