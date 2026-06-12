#!/bin/bash
# waterpaper 依赖检查脚本

echo "=== waterpaper 依赖检查 ==="
echo ""

# 检查 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js: $NODE_VERSION"
else
    echo "✗ Node.js: 未安装"
    echo "  请安装 Node.js 18+: https://nodejs.org/"
fi

# 检查 npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm: $NPM_VERSION"
else
    echo "✗ npm: 未安装"
fi

# 检查 docx 包
if npm list -g docx &> /dev/null; then
    DOCX_VERSION=$(npm list -g docx | grep docx | sed 's/.*@//' | sed 's/ .*//')
    echo "✓ docx: $DOCX_VERSION"
else
    echo "✗ docx: 未安装"
    echo "  运行: npm install -g docx"
fi

# 检查 curl
if command -v curl &> /dev/null; then
    echo "✓ curl: 已安装"
else
    echo "✗ curl: 未安装"
fi

# 检查 Python
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1)
    echo "✓ Python: $PYTHON_VERSION"
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo "✓ Python: $PYTHON_VERSION"
else
    echo "✗ Python: 未安装"
fi

echo ""

# 检查 CDP（Chrome 远程调试）
echo "=== CDP 环境检查（知网搜索需要）==="
echo ""

# 检查 CDP Proxy 端口
CDP_PORT=${CDP_PROXY_PORT:-3456}
if curl -s "http://127.0.0.1:$CDP_PORT" &> /dev/null; then
    echo "✓ CDP Proxy: 运行中 (端口 $CDP_PORT)"
else
    echo "✗ CDP Proxy: 未运行"
    echo "  请确保 Chrome 已开启远程调试："
    echo "  1. 在 Chrome 地址栏打开: chrome://inspect/#remote-debugging"
    echo "  2. 勾选 'Allow remote debugging for this browser instance'"
fi

echo ""

# 总结
echo "=== 总结 ==="
echo ""
echo "文献搜索功能："
echo "  - API平台（arXiv、Semantic Scholar等）: 仅需 curl"
echo "  - 知网CDP搜索: 需要 Node.js + CDP Proxy"
echo ""
echo "文档生成功能："
echo "  - 需要 Node.js + docx 包"
echo ""
echo "语言润色功能："
echo "  - 无需额外依赖"
