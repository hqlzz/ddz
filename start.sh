#!/bin/bash

# 欢乐斗地主 - 快速启动脚本

echo "================================"
echo "   欢乐斗地主 - 启动中...     "
echo "================================"
echo ""

# 检测Python版本
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ 错误: 未找到Python"
    echo "请安装Python 3.x后再试"
    exit 1
fi

echo "✅ Python已找到: $PYTHON_CMD"
echo ""

# 获取本机IP地址
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
else
    # Windows (Git Bash)
    IP=$(ipconfig | grep "IPv4" | awk '{print $NF}' | head -1)
fi

echo "📡 服务器信息:"
echo "   本地访问: http://localhost:8000"
echo "   局域网访问: http://$IP:8000"
echo ""
echo "🎮 游戏已启动！"
echo "   在浏览器中打开上述地址即可开始游戏"
echo ""
echo "💡 提示:"
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 手机扫描二维码可在同一WiFi下访问"
echo ""
echo "================================"
echo ""

# 启动HTTP服务器
$PYTHON_CMD -m http.server 8000
