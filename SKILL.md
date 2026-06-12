---
name: waterpaper
description: |
  法学论文写作工作流：文献搜索(含知网CDP) + 语言润色 + 文档生成。
  Use when the user wants to search academic papers, polish legal writing, or generate docx documents.
  支持多项目配置，通过 .waterpaper.json 配置文件适配不同项目结构。
metadata:
  version: "1.0.0"
---

# waterpaper Skill

## 工作流总览

```
┌─────────────────────────────────────────────────────────────┐
│                    waterpaper 工作流                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  阶段1: 文献搜索                    阶段2: 写作润色          │
│  ┌─────────────┐                   ┌─────────────┐          │
│  │ API平台搜索  │                   │ AI腔诊断    │          │
│  │ 知网CDP搜索  │                   │ 替换词库    │          │
│  └──────┬──────┘                   └──────┬──────┘          │
│         │                                 │                 │
│         ▼                                 ▼                 │
│  更新参考文献/INDEX.md            润色chapters/*.md          │
│                                                             │
│  阶段3: 文档生成                                            │
│  ┌─────────────┐                                           │
│  │  docx-js    │  ← JavaScript生成，格式可控                │
│  │  Markdown→  │                                           │
│  │  Docx       │                                           │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  输出output/*.docx                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 前置检查

在开始前，检查环境就绪状态：

```bash
# Node.js 版本（需要18+）
node --version

# npm 依赖（docx包）
npm list -g docx

# Chrome 远程调试（仅知网CDP需要）
# 在Chrome地址栏打开 chrome://inspect/#remote-debugging，勾选Allow remote debugging
```

## 阶段1: 文献搜索

### 1.1 加载项目配置

启动时从当前工作目录查找 `.waterpaper.json` 配置文件：

```
查找顺序：
1. 当前目录
2. 向上递归查找（最多5层）
3. 未找到时使用默认配置
```

默认配置（无配置文件时）：
- 参考文献目录：`./参考文献`
- 文献索引文件：`./参考文献/INDEX.md`
- 章节目录：`./chapters`

### 1.2 API平台搜索

适用于英文文献搜索，使用curl直接调用API。

**平台选择矩阵：**

| 需求 | 首选平台 | 访问方式 |
|------|---------|---------|
| CS/Math/Physics 论文 | arXiv | REST API |
| 引用数、引用关系 | Semantic Scholar | REST API |
| 跨学科DOI核对 | Crossref | REST API |
| 开放获取状态 | Unpaywall | REST API |
| 生物医学文献 | PubMed | NCBI E-utilities |

详细API调用模板见 `references/search/api-cookbook.md`

**搜索流程：**

1. 明确检索目标（关键词、作者、年份范围）
2. 选择平台（按需求矩阵）
3. 构造查询（扩展同义词、学科词表）
4. 第一遍轻量扫描（20-30条，输出摘要表）
5. 用户确认核心论文后，第二遍深入提取

**输出格式：**

```markdown
| 标题 | 作者 | 年份 | Venue | 引用 | PDF |
|------|------|------|-------|------|-----|
| Attention Is All You Need | Vaswani et al. | 2017 | NeurIPS | 90k | [PDF](url) |
```

### 1.3 知网搜索（CDP方式）

适用于中文文献搜索，通过Chrome远程调试操作知网页面。

**前置条件：**
- 用户Chrome已开启远程调试
- 如需全文下载，需在Chrome中完成机构认证

**搜索流程：**

```bash
# 1. 检查CDP环境
bash ~/.config/opencode/skills/waterpaper/scripts/check-deps.sh

# 2. 打开知网检索页
TARGET=$(curl -s "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/new?url=https://kns.cnki.net/kns8/defaultresult/index" \
  | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).targetId")

# 3. 等待JS渲染
sleep 3

# 4. 填入关键词
curl -s -X POST "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/eval?target=$TARGET" \
  -d 'document.querySelector("#txt_SearchText").value = "破产企业数据处置"'

# 5. 点击检索
curl -s -X POST "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/click?target=$TARGET" \
  -d '#btnSearch'

# 6. 等待结果渲染
sleep 3

# 7. 提取结果列表
curl -s -X POST "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/eval?target=$TARGET" -d '
JSON.stringify(
  Array.from(document.querySelectorAll(".result-table-list tbody tr")).slice(0, 20).map(tr => ({
    title:    tr.querySelector("td.name a")?.textContent?.trim(),
    url:      tr.querySelector("td.name a")?.href,
    authors:  tr.querySelector("td.author")?.textContent?.trim(),
    source:   tr.querySelector("td.source a")?.textContent?.trim(),
    date:     tr.querySelector("td.date")?.textContent?.trim(),
    cite:     tr.querySelector("td.quote a")?.textContent?.trim(),
    download: tr.querySelector("td.download a")?.textContent?.trim()
  }))
)
'

# 8. 关闭tab
curl -s "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/close?target=$TARGET"
```

**知网DOM选择器（KNS8）：**

| 元素 | CSS选择器 |
|------|-----------|
| 搜索框 | `#txt_SearchText` |
| 检索按钮 | `#btnSearch` |
| 结果行 | `.result-table-list tbody tr` |
| 标题 | `td.name a` |
| 作者 | `td.author` |
| 来源 | `td.source a` |
| 日期 | `td.date` |
| 被引数 | `td.quote a` |
| 下载数 | `td.download a` |

**详情页元数据提取：**

```bash
curl -s -X POST "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/eval?target=$TARGET" -d '
(() => {
  const get = sel => document.querySelector(sel)?.textContent?.trim() ?? null;
  const getAll = sel => Array.from(document.querySelectorAll(sel)).map(el => el.textContent.trim());
  return JSON.stringify({
    title:     get("h1.title") ?? get(".doc-top h1"),
    authors:   getAll(".author a"),
    source:    get(".source a"),
    date:      get(".date"),
    abstract:  get("#ChDivSummary") ?? get(".abstract-text"),
    keywords:  getAll(".keyword a"),
    doi:       get(".doi a"),
    cnki_url:  location.href
  });
})()
'
```

详细操作经验见 `references/search/cnki-patterns.md`

### 1.4 结果处理

搜索完成后，将结果更新到参考文献索引：

1. 转换为标准元数据schema（见 `references/search/metadata-schema.md`）
2. 追加到 `参考文献/INDEX.md`
3. 按主题分类，标注相关性（★★★核心 / ★★☆重要 / ★☆☆背景）

## 阶段2: 写作润色

### 2.1 润色触发方式

**写完后统一润色：**
```
用户：润色第N章
→ 读取 chapters/ch0N.md
→ 按诊断清单扫描
→ 逐条修改
→ 输出润色后的版本
```

**边写边润色：**
```
用户：帮我润色这段
→ 对提供的文本片段进行诊断
→ 给出修改建议
```

### 2.2 AI腔诊断流程

修改前，先用诊断清单扫描全文（见 `references/writing/ai-diagnostic.md`）：

**主体缺失检查：**
- [ ] 大量"可以认为"、"值得关注的是"——没有人在说话
- [ ] 看不出作者立场，只有观点罗列
- [ ] 引用后只说"有学者认为"，不交代是谁

**词汇层AI腔检查：**
- [ ] 用"重要意义"、"深远影响"代替具体描述
- [ ] 用"值得商榷"代替"我不赞成"
- [ ] 用"较为"、"相对"做无意义模糊

**句式层AI腔检查：**
- [ ] 大量"一是……二是……三是……"机械分列
- [ ] 开头是"随着……的不断发展"
- [ ] 段落结尾是"因此，我们应当……"

**论证层AI腔检查：**
- [ ] 先给结论再给论据（学者通常相反）
- [ ] 举例后不推进论证
- [ ] 对反驳意见没有回应

### 2.3 替换词库使用

按 `references/writing/replacement-words.md` 逐条修改：

| AI腔写法 | 学者真实写法 | 出处 |
|---------|------------|-----|
| 值得商榷 | 我们不赞成；大有疑问；实不足取 | 陈光中、黄明涛 |
| 可以认为 | 我们认为；笔者以为；本文认为 | 陈光中、高铭暄 |
| 需要指出的是 | 恰恰；但问题恰在于；殊不知 | 黄明涛、苏力 |
| 综上所述 | 可见；由此；质言之 | 多人 |

### 2.4 句式改造应用

按 `references/writing/sentence-patterns.md` 逐条改造：

**段落首句：命题型而非导入型**
- AI腔：在讨论XXX的问题时，我们首先需要了解其基本概念
- 学者写法：XXX权与YYY权是分离的，绝不能把XXX看成是YYY的自然组成部分

**立场句：我在论辩，不是在综述**
- AI腔：有学者认为……另一种观点则认为……
- 学者写法：我们则认为，这些"误区论"者的本身误区正在于……

**让步句：先真正承认，再真正反驳**
- AI腔：诚然，XXX存在一定困难，但这并不影响其重要价值
- 学者写法：反对XXX的这两点担忧不无道理。那么在"AAA"与"BBB"这两难之间……

### 2.5 主体感检验

修改完成后，问自己三个问题（见 `references/writing/ai-diagnostic.md`）：

1. **谁在说话？** 能感觉到有真实的学者在论辩吗？
2. **他们赞成什么，反对什么？** 核心立场是否清晰到可以被反驳？
3. **他们在和谁对话？** 能感觉到在与具体文献对话吗？

## 阶段3: 文档生成

### 3.1 使用docx-js生成

使用JavaScript的docx包生成Word文档：

```bash
# 安装依赖（首次）
npm install -g docx

# 生成docx
node ~/.config/opencode/skills/waterpaper/scripts/md-to-docx.mjs \
  --input chapters/ch01.md \
  --output output/ch01.docx \
  --format 中国法学
```

### 3.2 Markdown语法支持

```markdown
# 章标题（黑体18pt，居中）
## 节标题（黑体14pt）
### 小节标题（黑体12pt）

正文内容（宋体10.5pt，首行缩进2字符）

[^1]: 脚注内容（宋体9pt）
```

### 3.3 格式规范（《中国法学》）

| 项目 | 规范 |
|------|------|
| 正文字体 | 宋体 10.5pt |
| 章标题 | 黑体 18pt，居中 |
| 节标题 | 黑体 14pt |
| 小节标题 | 黑体 12pt |
| 行距 | 固定值 20pt |
| 缩进 | 首行缩进 2 字符 |
| 页边距 | 上3.7 / 下3.5 / 左2.8 / 右2.6 cm |
| 脚注 | 宋体 9pt，自动编号 |

## 使用示例

### 示例1：搜索文献

```
用户：搜索关于"破产企业数据处置"的文献

waterpaper：
1. 检查配置文件 .waterpaper.json
2. 启动CDP，打开知网
3. 搜索"破产企业数据处置"
4. 提取结果列表
5. 输出摘要表，更新到 参考文献/INDEX.md
```

### 示例2：润色文本

```
用户：帮我润色这段

"关于数据的财产属性，学术界存在不同进路的论证。有学者从劳动赋权理论出发，认为企业对数据的收集、清洗、加工和分析投入了实质性劳动，应当据此享有相应的财产权益。"

waterpaper（应用替换词库）：
"关于数据的财产属性，学术界存在不同进路的论证。诚如某某所言，企业对数据的收集、清洗、加工和分析投入了实质性劳动，应当据此享有相应的财产权益。[^脚注]"
```

### 示例3：生成docx

```
用户：把第一章转成docx

waterpaper：
1. 读取 chapters/ch01.md
2. 解析标题、正文、脚注
3. 调用 md-to-docx.mjs
4. 输出 output/第一章_破产企业数据处置的现状审视与问题揭示.docx
```

## References索引

| 文件 | 何时加载 |
|------|---------|
| `references/search/api-cookbook.md` | 需要API调用示例时 |
| `references/search/metadata-schema.md` | 整理搜索结果时 |
| `references/search/platform-matrix.md` | 选择搜索平台时 |
| `references/search/cnki-patterns.md` | 知网CDP操作时 |
| `references/writing/ai-diagnostic.md` | 润色前诊断时 |
| `references/writing/replacement-words.md` | 替换AI腔词汇时 |
| `references/writing/sentence-patterns.md` | 改造句式时 |
| `references/writing/scholar-vocabulary.md` | 查找学者用词时 |
| `references/writing/language-examples.md` | 需要例句参照时 |
| `references/docx/docx-js-guide.md` | 使用docx-js时 |
| `references/docx/legal-format-template.js` | 自定义格式时 |

## 配置文件

项目根目录创建 `.waterpaper.json` 配置文件：

```json
{
  "project_name": "项目名称",
  "references": {
    "dir": "参考文献",
    "index": "参考文献/INDEX.md"
  },
  "chapters": {
    "dir": "chapters",
    "pattern": "ch{N:02d}.md"
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

详见 `templates/.waterpaper.json.example`
