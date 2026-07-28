#!/bin/bash

# Python-100-Days 互动学习平台启动脚本

echo "=== Python-100-Days 互动学习平台 ==="
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到npm，请先安装npm"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"
echo "✓ npm 版本: $(npm --version)"
echo ""

# 安装依赖
echo "安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

echo "✓ 依赖安装完成"
echo ""

# 生成内容数据
echo "生成课程内容数据..."
if command -v python &> /dev/null; then
    python scripts/generate_content.py
    if [ $? -eq 0 ]; then
        echo "✓ 内容数据生成完成"
    else
        echo "警告: 内容数据生成失败，将使用默认数据"
    fi
else
    echo "警告: 未找到Python，跳过内容生成"
fi
echo ""

# 启动开发服务器
echo "启动开发服务器..."
echo "应用将在 http://localhost:5173 启动"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev