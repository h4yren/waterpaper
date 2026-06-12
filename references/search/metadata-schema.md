# 学术论文元数据规范

跨平台统一的论文元数据结构，用于合并多平台结果、去重、导出 BibTeX。

---

## 标准 Schema（JSON）

```json
{
  "title": "论文标题",
  "authors": ["作者1", "作者2"],
  "year": 2024,
  "publication_date": "2024-01-15",
  "publication_type": "journal-article",
  "venue": "期刊名称",
  "doi": "10.xxx/xxx",
  "arxiv_id": null,
  "pubmed_id": null,
  "cnki_url": null,
  "abstract": "摘要内容...",
  "keywords": ["关键词1", "关键词2"],
  "citation_count": 100,
  "download_count": null,
  "open_access_status": "closed",
  "pdf_url": null,
  "bibtex": null,
  "source_platforms": ["cnki"],
  "fetched_at": "2024-01-15"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 论文标题，保留原始大小写 |
| `authors` | string[] | 是 | 作者列表 |
| `year` | integer | 是 | 发表年份（4 位整数） |
| `publication_date` | string | 否 | 发表日期，ISO 8601 格式 |
| `publication_type` | string | 否 | 文献类型：`journal-article`、`conference`、`preprint`、`book-chapter` |
| `venue` | string | 否 | 会议/期刊名称 |
| `doi` | string | 否 | 全局唯一标识，格式 `10.xxx/xxx` |
| `arxiv_id` | string | 否 | arXiv ID，仅数字+点格式（如 `1706.03762`） |
| `pubmed_id` | string | 否 | PubMed PMID |
| `cnki_url` | string | 否 | CNKI 论文详情页 URL |
| `abstract` | string | 否 | 摘要原文 |
| `keywords` | string[] | 否 | 关键词列表 |
| `citation_count` | integer | 否 | 引用数 |
| `download_count` | integer | 否 | 下载次数（CNKI 特有） |
| `open_access_status` | string | 否 | 开放获取状态：`gold`、`green`、`hybrid`、`closed`、`unknown` |
| `pdf_url` | string | 否 | 可公开访问的 PDF 直链 |
| `bibtex` | string | 否 | BibTeX 格式引用 |
| `source_platforms` | string[] | 是 | 数据来源平台列表 |
| `fetched_at` | string | 是 | 抓取日期，ISO 8601 格式 |

---

## Markdown 表格模板

单篇论文输出：

```markdown
| 字段 | 内容 |
|------|------|
| 标题 | Attention Is All You Need |
| 作者 | Vaswani et al. (2017) |
| Venue | NeurIPS 2017 |
| DOI | 10.5555/3295222.3295349 |
| 引用数 | ~90,000 |
| PDF | [链接](url) |
| 摘要 | The dominant sequence transduction... |
```

多篇论文列表输出：

```markdown
| 标题 | 作者 | 年份 | Venue | 引用 | PDF |
|------|------|------|-------|------|-----|
| Attention Is All You Need | Vaswani et al. | 2017 | NeurIPS | 90k | [PDF](url) |
| BERT | Devlin et al. | 2019 | NAACL | 60k | [PDF](url) |
```

---

## 多平台去重规则

多个平台查询同一目标时，结果需按以下优先级合并去重：

### 主键优先级

1. **DOI**（全局唯一，最可靠）：DOI 相同 → 同一篇论文
2. **arXiv ID**：arXiv ID 相同 → 同一篇论文
3. **PubMed ID**：PMID 相同 → 同一篇论文
4. **标题 + 年份 + 作者首字母**：以上都没有时的模糊匹配

### 字段合并策略

同一篇论文来自多个平台时，字段按以下优先级填充：

| 字段 | 优先来源 |
|------|---------|
| `citation_count` | Semantic Scholar > CNKI > 其他 |
| `open_access_status` | Unpaywall > OpenAlex > 其他 |
| `pdf_url` | arXiv > Semantic Scholar > Unpaywall > CNKI |
| `abstract` | Semantic Scholar > arXiv > CNKI |
| `venue` | CNKI > Semantic Scholar > arXiv |
| `doi` | CNKI > Semantic Scholar > arXiv |
| `keywords` | CNKI > 其他平台 |

### 合并示例

```
arXiv 结果：  { title: "BERT...", arxiv_id: "1810.04805", pdf_url: "https://arxiv.org/pdf/1810.04805" }
S2 结果：     { title: "BERT...", arxiv_id: "1810.04805", citation_count: 65000, doi: "10.18653/..." }
→ 合并后：   { title: "BERT...", arxiv_id: "1810.04805", doi: "10.18653/...",
               pdf_url: "https://arxiv.org/pdf/1810.04805", citation_count: 65000 }
```

---

## BibTeX 拼装模板

当平台无法直接导出 BibTeX 时，根据 schema 字段拼装：

### 期刊论文（@article）

```bibtex
@article{[citation_key],
  title   = {[title]},
  author  = {[authors, joined by " and "]},
  journal = {[venue]},
  year    = {[year]},
  doi     = {[doi]},
  url     = {[pdf_url]}
}
```

### 会议论文（@inproceedings）

```bibtex
@inproceedings{[citation_key],
  title     = {[title]},
  author    = {[authors, joined by " and "]},
  booktitle = {[venue]},
  year      = {[year]},
  doi       = {[doi]},
  url       = {[pdf_url]}
}
```

### 预印本（@misc）

```bibtex
@misc{[citation_key],
  title         = {[title]},
  author        = {[authors, joined by " and "]},
  year          = {[year]},
  eprint        = {[arxiv_id]},
  archivePrefix = {arXiv},
  url           = {https://arxiv.org/abs/[arxiv_id]}
}
```

**citation_key 生成规则**：`{作者姓氏小写}{年份}{标题第一个实词小写}`  
示例：`vaswani2017attention`、`devlin2019bert`

---

## 参考文献INDEX.md格式

搜索结果更新到 `参考文献/INDEX.md` 时，按以下格式：

```markdown
## 主题分类名称（N篇）

### 01. 论文标题
- **作者**：作者1、作者2 | **年份**：2024 | **期刊**：期刊名
- **相关性**：★★★
- **摘要**：摘要内容...
- **全文**：✅ `文件名.pdf`
```

相关性标注规则：
- ★★★ 核心文献（与研究主题直接相关）
- ★★☆ 重要文献（提供理论基础或方法参考）
- ★☆☆ 背景文献（了解领域概况）
