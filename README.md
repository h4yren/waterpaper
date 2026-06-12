# waterpaper Skill

法学论文写作工作流：文献搜索(含知网CDP) + 语言润色 + 文档生成

---

## 功能特性

- 📚 **多平台文献搜索**
  - 知网CDP搜索（中文文献）
  - arXiv、Semantic Scholar等API搜索（英文文献）
  - 自动更新参考文献索引

- ✍️ **AI腔诊断与语言润色**
  - AI腔诊断清单
  - 学者词汇替换词库
  - 句式改造手册
  - 学者例句库

- 📄 **自动生成Docx**
  - 使用docx-js（JavaScript）
  - 支持《中国法学》格式
  - 自动脚注、页眉页脚

---

## 快速开始

### 1. 安装依赖

```bash
# 安装 docx 包
npm install -g docx

# 检查环境
bash ~/.config/opencode/skills/waterpaper/scripts/check-deps.sh
```

### 2. 初始化项目

在项目根目录创建 `.waterpaper.json` 配置文件：

```json
{
  "project_name": "我的论文",
  "references": {
    "dir": "参考文献",
    "index": "参考文献/INDEX.md"
  },
  "chapters": {
    "dir": "chapters"
  },
  "output": {
    "dir": "output"
  },
  "generator": {
    "engine": "docx-js",
    "format": "中国法学"
  }
}
```

### 3. 开始使用

```
# 搜索文献（知网CDP）
搜索关于"破产企业数据处置"的文献

# 润色文本
帮我润色这段文字

# 生成docx
把第一章转成docx
```

---

## 目录结构

```
~/.config/opencode/skills/waterpaper/
│
├── SKILL.md                          ← 主文件
├── README.md                         ← 本文件
│
├── references/
│   ├── search/
│   │   ├── api-cookbook.md           ← API调用模板
│   │   ├── metadata-schema.md        ← 元数据schema
│   │   ├── platform-matrix.md        ← 平台选择矩阵
│   │   └── cnki-patterns.md          ← 知网CDP操作经验
│   │
│   ├── writing/
│   │   ├── ai-diagnostic.md          ← AI腔诊断清单
│   │   ├── replacement-words.md      ← 替换词库
│   │   ├── sentence-patterns.md      ← 句式改造手册
│   │   ├── scholar-vocabulary.md     ← 学者词汇速查表
│   │   └── language-examples.md      ← 学者例句库
│   │
│   └── docx/
│       ├── docx-js-guide.md          ← docx-js使用指南
│       └── legal-format-template.js  ← 法学论文格式模板
│
├── scripts/
│   ├── md-to-docx.mjs                ← Markdown转docx脚本
│   └── check-deps.sh                 ← 依赖检查脚本
│
└── templates/
    └── .waterpaper.json.example      ← 配置文件模板
```

---

## 使用示例

### 文献搜索

```
用户：搜索关于"破产企业数据处置"的文献

waterpaper：
1. 检查配置文件
2. 启动CDP，打开知网
3. 搜索关键词
4. 提取结果列表
5. 更新到 参考文献/INDEX.md
```

### 语言润色

```
用户：帮我润色这段

"关于数据的财产属性，学术界存在不同进路的论证。有学者从劳动赋权理论出发..."

waterpaper：
1. AI腔诊断
2. 应用替换词库
3. 改造句式
4. 输出润色后的版本
```

### 生成Docx

```
用户：把第一章转成docx

waterpaper：
1. 读取 chapters/ch01.md
2. 解析标题、正文、脚注
3. 调用 md-to-docx.mjs
4. 输出 output/第一章_标题.docx
```

---

## 配置说明

| 配置项 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `project_name` | 否 | 当前目录名 | 页眉显示文本 |
| `references.dir` | 否 | `参考文献` | 文献PDF目录 |
| `references.index` | 否 | `参考文献/INDEX.md` | 文献索引文件 |
| `chapters.dir` | 否 | `chapters` | 章节目录 |
| `output.dir` | 否 | `output` | docx输出目录 |
| `generator.format` | 否 | `中国法学` | 排版格式 |

---

## 依赖要求

| 依赖 | 用途 | 必需 |
|------|------|------|
| Node.js 18+ | 运行脚本 | 是 |
| docx (npm) | 生成docx | 是 |
| curl | API调用 | 是 |
| Chrome远程调试 | 知网CDP | 仅知网搜索时 |

---

## 许可证

MIT
