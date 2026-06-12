# waterpaper
法学论文写作工作流：文献搜索 + 语言润色 + 文档生成
# waterpaper

法学论文写作工作流：文献搜索 + 语言润色 + 文档生成

## 特性

- 📚 多平台文献搜索（知网CDP、Semantic Scholar、arXiv等）
- ✍️ AI腔诊断与语言润色
- 📄 自动生成符合《中国法学》格式的docx
- ⚙️ 配置化设计，支持多项目

## 快速安装

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/yourname/waterpaper/main/install.sh | bash
\`\`\`

## 使用方法

### 1. 初始化项目
\`\`\`bash
cd your-project
waterpaper init
\`\`\`

### 2. 搜索文献
\`\`\`bash
waterpaper search "破产企业数据"
\`\`\`

### 3. 写作润色
\`\`\`bash
waterpaper polish chapters/ch01.md
\`\`\`

### 4. 生成docx
\`\`\`bash
waterpaper generate --chapter 1
\`\`\`

## 配置说明

详见 [configuration.md](docs/configuration.md)

## 许可证

MIT
