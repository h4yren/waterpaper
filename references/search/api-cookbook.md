# 学术平台 API 调用速查

各学术平台 API 调用模板。所有示例均可直接复制执行。

---

## arXiv

**根 URL**：`https://export.arxiv.org/api/query`  
**鉴权**：无需  
**格式**：Atom XML  
**速率**：建议 3 秒/请求（非官方限制）

### 搜索

```bash
# 按标题关键词搜索（最近 10 条）
curl -s "https://export.arxiv.org/api/query?search_query=ti:attention+mechanism&max_results=10&sortBy=submittedDate&sortOrder=descending"

# 按作者搜索
curl -s "https://export.arxiv.org/api/query?search_query=au:Vaswani_A&max_results=20"

# 复合查询：标题 AND 分类
curl -s "https://export.arxiv.org/api/query?search_query=ti:transformer+AND+cat:cs.LG&max_results=10"

# 分页（第 11-20 条）
curl -s "https://export.arxiv.org/api/query?search_query=ti:diffusion+model&start=10&max_results=10"
```

**search_query 字段前缀**：

| 前缀 | 说明 |
|------|------|
| `ti:` | 标题 |
| `au:` | 作者（格式：`LastName_FirstInitial`） |
| `abs:` | 摘要 |
| `cat:` | 分类（如 `cs.AI`、`cs.LG`、`stat.ML`） |
| `all:` | 全字段搜索 |

**响应字段映射**（Atom XML `<entry>` 节点）：

| XML 路径 | 标准字段 |
|---------|---------|
| `<title>` | title |
| `<author><name>` | authors[] |
| `<summary>` | abstract |
| `<published>` | year（取前 4 位） |
| `<arxiv:doi>` | doi |
| `<id>`（末段） | arxiv_id |
| `<link rel="related" type="application/pdf" href>` | pdf_url |

**PDF 直链规律**：`https://arxiv.org/pdf/{arxiv_id}`

**BibTeX 导出**：`https://arxiv.org/bibtex/{arxiv_id}`

---

## Semantic Scholar

**根 URL**：`https://api.semanticscholar.org/graph/v1`  
**鉴权**：Header `x-api-key: YOUR_KEY`（免费注册，高频必需）  
**格式**：JSON  
**速率**：无 Key 约 100 req/5min；有 Key 1 req/s

### 搜索论文

```bash
# 关键词搜索（返回指定字段）
curl -s "https://api.semanticscholar.org/graph/v1/paper/search?query=attention+is+all+you+need&fields=title,authors,year,abstract,citationCount,externalIds,openAccessPdf&limit=10" \
  -H "x-api-key: YOUR_KEY"

# 按 DOI 查询单篇
curl -s "https://api.semanticscholar.org/graph/v1/paper/DOI:10.18653/v1/P16-1162?fields=title,authors,abstract,citationCount,openAccessPdf" \
  -H "x-api-key: YOUR_KEY"

# 按 arXiv ID 查询
curl -s "https://api.semanticscholar.org/graph/v1/paper/ARXIV:1706.03762?fields=title,authors,year,citationCount,openAccessPdf" \
  -H "x-api-key: YOUR_KEY"

# 批量查询（POST，最多 500 篇）
curl -s -X POST "https://api.semanticscholar.org/graph/v1/paper/batch?fields=title,year,citationCount" \
  -H "Content-Type: application/json" \
  -d '{"ids":["DOI:10.xxx/xxx","ARXIV:2301.00001"]}' \
  -H "x-api-key: YOUR_KEY"
```

### 作者查询

```bash
# 按作者名搜索
curl -s "https://api.semanticscholar.org/graph/v1/author/search?query=Yann+LeCun&fields=name,affiliations,paperCount,citationCount" \
  -H "x-api-key: YOUR_KEY"

# 获取作者全部论文
curl -s "https://api.semanticscholar.org/graph/v1/author/{author_id}/papers?fields=title,year,citationCount&limit=100" \
  -H "x-api-key: YOUR_KEY"
```

### 引用/被引

```bash
# 获取引用该论文的文章
curl -s "https://api.semanticscholar.org/graph/v1/paper/{paper_id}/citations?fields=title,year,authors&limit=50" \
  -H "x-api-key: YOUR_KEY"

# 获取该论文引用的文章
curl -s "https://api.semanticscholar.org/graph/v1/paper/{paper_id}/references?fields=title,year,authors&limit=50" \
  -H "x-api-key: YOUR_KEY"
```

**响应字段映射**：

| JSON 字段 | 标准字段 |
|-----------|---------|
| `title` | title |
| `authors[].name` | authors[] |
| `year` | year |
| `abstract` | abstract |
| `citationCount` | citation_count |
| `externalIds.DOI` | doi |
| `externalIds.ArXiv` | arxiv_id |
| `openAccessPdf.url` | pdf_url |

**注意**：`fields` 参数必须显式指定，否则默认只返回 `paperId` 和 `title`。

---

## Crossref

**根 URL**：`https://api.crossref.org`  
**鉴权**：无需；建议带 `mailto` 参数  
**格式**：JSON  
**适用**：跨学科 DOI、期刊、出版商、ISSN 核对

```bash
# 按 DOI 查询单篇
curl -s "https://api.crossref.org/works/10.1038/nature12373?mailto=your@email.com"

# 关键词搜索
curl -s "https://api.crossref.org/works?query.title=graph+neural+network&rows=10&mailto=your@email.com"

# 期刊 ISSN 查询
curl -s "https://api.crossref.org/journals/2041-1723/works?rows=10&mailto=your@email.com"
```

**响应字段映射**：

| JSON 字段 | 标准字段 |
|-----------|---------|
| `message.title[0]` | title |
| `message.author[].given/family` | authors[] |
| `message.published-print.date-parts` | year |
| `message.container-title[0]` | venue |
| `message.DOI` | doi |
| `message.type` | publication_type |
| `message.ISSN[]` | issn |

**注意**：Crossref 不保证摘要和 PDF，适合作为 DOI/出版信息的权威补全。

---

## OpenAlex

**根 URL**：`https://api.openalex.org`  
**鉴权**：无需；建议带 `mailto` 参数  
**格式**：JSON  
**适用**：跨学科作者、机构、概念、引用关系和开放获取状态

```bash
# 关键词搜索
curl -s "https://api.openalex.org/works?search=large+language+models&per-page=10&mailto=your@email.com"

# 按 DOI 查询
curl -s "https://api.openalex.org/works/https://doi.org/10.1038/nature12373?mailto=your@email.com"

# 作者搜索
curl -s "https://api.openalex.org/authors?search=Yann+LeCun&per-page=10&mailto=your@email.com"
```

**响应字段映射**：

| JSON 字段 | 标准字段 |
|-----------|---------|
| `title` | title |
| `authorships[].author.display_name` | authors[] |
| `publication_year` | year |
| `primary_location.source.display_name` | venue |
| `doi` | doi |
| `cited_by_count` | citation_count |
| `open_access.oa_status` | open_access_status |
| `primary_location.pdf_url` | pdf_url |

---

## Unpaywall

**根 URL**：`https://api.unpaywall.org/v2`  
**鉴权**：无需；必须带 email 参数  
**格式**：JSON  
**适用**：开放获取状态、合法 OA PDF 链接

```bash
# 按 DOI 查询开放获取状态
curl -s "https://api.unpaywall.org/v2/10.1038/nature12373?email=your@email.com"
```

**响应字段映射**：

| JSON 字段 | 标准字段 |
|-----------|---------|
| `doi` | doi |
| `title` | title |
| `year` | year |
| `journal_name` | venue |
| `is_oa` + `oa_status` | open_access_status |
| `best_oa_location.url_for_pdf` | pdf_url |
| `best_oa_location.license` | license |

**full_text_status 判定**：

| 条件 | 状态 |
|------|------|
| `best_oa_location.url_for_pdf` 存在且响应为 PDF | `open_pdf` |
| `is_oa=false` | `no_open_pdf` |
| 出版商页面存在但 PDF 需要登录 | `needs_institution` |
| PDF URL 返回 HTML | `html_not_pdf` |
| 403、Cloudflare、验证码 | `anti_bot_blocked` |

---

## PubMed（NCBI E-utilities）

**根 URL**：`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`  
**鉴权**：无需（有 API Key 可提升速率）  
**格式**：XML / JSON  
**速率**：无 Key 3 req/s；有 Key 10 req/s

### 三步流程

```bash
# Step 1：esearch — 搜索，获取 PMID 列表
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=CRISPR+gene+editing&retmax=20&retmode=json&email=your@email.com"

# Step 2：efetch — 按 PMID 批量获取详情（XML 格式，含摘要）
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=12345678,23456789&rettype=abstract&retmode=xml&email=your@email.com"

# Step 3（可选）：elink — 获取相关文献
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&db=pubmed&id=12345678&linkname=pubmed_pubmed&retmode=json&email=your@email.com"
```

**元数据获取**（`esummary` 返回 JSON）：

```bash
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=12345678&retmode=json&email=your@email.com"
```

**响应字段映射**：

| JSON 字段 | 标准字段 |
|-----------|---------|
| `result[pmid].title` | title |
| `result[pmid].authors[].name` | authors[] |
| `result[pmid].pubdate`（前 4 位） | year |
| `result[pmid].source` | venue |
| `result[pmid].articleids[type=doi].value` | doi |
| `result[pmid].uid` | pubmed_id |

---

## CNKI（中国知网）

**官方 API**：无公开 API  
**唯一可靠方式**：CDP 浏览器自动化（直连用户 Chrome）  
**不要尝试**：curl 直接爬取（反爬严重，结果为 JS 渲染页）

### 登录态说明

| 访问级别 | 能获得什么 | 如何实现 |
|---------|-----------|---------|
| 未登录 | 标题、作者、来源、年份、摘要（部分截断） | CDP 直接打开 cnki.net |
| 机构 IP / 机构账号登录 | 全文 CAJ / PDF 下载链接 | 用户在 Chrome 中完成机构认证后再用 CDP |
| 个人 CNKI 账号 | 引用/下载统计、收藏记录 | 同上 |

### CDP 操作流程

```bash
# 1. 确保 CDP Proxy 就绪
bash ~/.config/opencode/skills/waterpaper/scripts/check-deps.sh

# 2. 打开知网检索页（KNS8 新版界面）
TARGET=$(curl -s "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/new?url=https://kns.cnki.net/kns8/defaultresult/index" \
  | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).targetId")

# 3. 等待页面加载（JS 渲染较慢）
sleep 3

# 4. 填入搜索词
curl -s -X POST "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/eval?target=$TARGET" \
  -d 'document.querySelector("#txt_SearchText").value = "破产企业数据处置"'

# 5. 点击检索按钮
curl -s -X POST "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/click?target=$TARGET" \
  -d '#btnSearch'

# 6. 等待结果列表渲染
sleep 3

# 7. 提取结果（最多 20 条）
curl -s -X POST "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/eval?target=$TARGET" -d '
JSON.stringify(
  Array.from(document.querySelectorAll(".result-table-list tbody tr")).slice(0, 20).map(tr => ({
    title:     tr.querySelector("td.name a")?.textContent?.trim(),
    url:       tr.querySelector("td.name a")?.href,
    authors:   tr.querySelector("td.author")?.textContent?.trim(),
    source:    tr.querySelector("td.source a")?.textContent?.trim(),
    date:      tr.querySelector("td.date")?.textContent?.trim(),
    database:  tr.querySelector("td.db")?.textContent?.trim(),
    cite:      tr.querySelector("td.quote a")?.textContent?.trim(),
    download:  tr.querySelector("td.download a")?.textContent?.trim()
  }))
)
'

# 8. 关闭 tab
curl -s "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/close?target=$TARGET"
```

### 通过直接 URL 跳转（带预设关键词）

```bash
# 构造搜索 URL：crossids 限定期刊+学位论文+会议论文
QUERY=$(python3 -c "import urllib.parse; print(urllib.parse.quote('破产 数据'))")
TARGET=$(curl -s "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/new?url=https://kns.cnki.net/kns8/defaultresult/index?crossids=YSTT4HG0%2CLSTPFHG2%2CIPFD9Y60&korder=SU&kw=${QUERY}" \
  | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).targetId")
sleep 4
# 然后执行步骤 7 提取结果
```

### 获取单篇详情（摘要、关键词、基金）

```bash
# 在详情页提取结构化元数据
curl -s -X POST "http://127.0.0.1:${CDP_PROXY_PORT:-3456}/eval?target=$TARGET" -d '
(() => {
  const get = sel => document.querySelector(sel)?.textContent?.trim() ?? null;
  const getAll = sel => Array.from(document.querySelectorAll(sel)).map(el => el.textContent.trim());
  return JSON.stringify({
    title:     get("h1.title") ?? get(".doc-top h1"),
    authors:   getAll(".author a"),
    source:    get(".source a"),
    date:      get(".date") ?? get(".info-item .date"),
    abstract:  get("#ChDivSummary") ?? get(".abstract-text"),
    keywords:  getAll(".keyword a"),
    fund:      get(".fund a"),
    doi:       get(".doi a"),
    cnki_url:  location.href
  });
})()
'
```

### crossids 数据库代码

| 代码 | 数据库 | 说明 |
|------|--------|------|
| `YSTT4HG0` | 中国学术期刊网络出版总库（CNKI） | 主力期刊库，最常用 |
| `LSTPFHG2` | 中国博硕士学位论文全文数据库 | 硕博论文 |
| `IPFD9Y60` | 中国重要会议论文全文数据库 | 会议论文 |
| `WSLHLHGH` | 中国重要报纸全文数据库 | 学术性低，一般不选 |
| `NYHFWBF4` | 中国年鉴网络出版总库 | 年鉴统计，专项使用 |

**建议默认组合**（学术搜索）：`YSTT4HG0,LSTPFHG2,IPFD9Y60`

### 响应字段映射

| DOM 元素 / 字段 | 标准 Schema 字段 |
|----------------|----------------|
| `td.name a` / `h1.title` | `title` |
| `td.author` / `.author a` | `authors[]` |
| `td.source a` / `.source a` | `venue` |
| `td.date` / `.date` | `year`（取前 4 位） |
| `td.quote a` | `citation_count` |
| `td.download a` | `download_count`（CNKI 特有） |
| `#ChDivSummary` | `abstract` |
| `.keyword a` | `keywords[]` |
| `.doi a` | `doi` |
| `location.href` | `cnki_url`（CNKI 特有） |
