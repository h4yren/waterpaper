# 平台选择矩阵

根据任务特征选择最合适的平台和访问方式。

---

## 核心平台

| 需求 | 首选平台 | 访问方式 | 备注 |
|------|---------|---------|------|
| **中文文献**（期刊/学位论文/会议） | **CNKI（知网）** | **CDP（必须）** | 无公开API；机构登录后全文可得 |
| CS/Math/Physics 论文搜索 | **arXiv** | REST API | 完全开放，PDF直链 |
| 引用数、引用/被引关系 | **Semantic Scholar** | REST API | 免费Key可提升速率 |
| 跨学科 DOI / 元数据核对 | **Crossref** | REST API | DOI、期刊、出版商、ISSN |
| 跨学科作者/机构/概念/引用 | **OpenAlex** | REST API | 跨学科补充 |
| 开放获取状态 / OA PDF | **Unpaywall** | REST API | 判断gold/green/hybrid/closed OA |
| 生物医学、生命科学 | **PubMed** | NCBI E-utilities | 完全开放 |

---

## 访问方式说明

### API平台（优先使用）

- **arXiv**：完全开放，无需鉴权
- **Semantic Scholar**：免费Key可提升速率，注册地址 https://www.semanticscholar.org/product/api#api-key-form
- **Crossref**：无需鉴权，建议带mailto参数
- **OpenAlex**：无需鉴权，建议带mailto参数
- **Unpaywall**：无需鉴权，必须带email参数
- **PubMed**：无需鉴权，有Key可提升速率

### CDP平台（仅知网需要）

- **CNKI**：无公开API，必须通过CDP直连用户Chrome
- 需要用户Chrome开启远程调试
- 如需全文下载，需用户在Chrome中完成机构认证

---

## 搜索策略

### 单平台搜索

适用于目标明确、只需一个平台的场景：

```
用户：搜索arXiv上关于attention mechanism的论文
→ 直接调用arXiv API
```

### 多平台搜索

适用于需要全面覆盖的场景：

```
用户：搜索关于"破产企业数据处置"的文献
→ 知网CDP搜索中文文献
→ Semantic Scholar搜索英文文献
→ 合并去重，输出统一格式
```

### 平台组合建议

| 场景 | 推荐组合 |
|------|---------|
| 中文文献为主 | CNKI 主搜 |
| 英文文献为主 | arXiv + Semantic Scholar |
| 中英文综述 | CNKI + arXiv/S2 并行 |
| 跨学科研究 | OpenAlex + Crossref |
| 查找开放获取PDF | Unpaywall + arXiv |

---

## 速率限制

| 平台 | 无Key限制 | 有Key限制 | 建议间隔 |
|------|----------|----------|---------|
| arXiv | 3秒/请求 | - | 3秒 |
| Semantic Scholar | 100req/5min | 1req/s | 6秒（无Key） |
| Crossref | 无限制 | - | 1秒 |
| OpenAlex | 无限制 | - | 1秒 |
| Unpaywall | 无限制 | - | 1秒 |
| PubMed | 3req/s | 10req/s | 1秒 |
| CNKI | 反爬机制 | - | 3-5秒 |

---

## 错误处理

| 错误信号 | 含义 | 处理方式 |
|---------|------|---------|
| API 429 / Rate exceeded | 超出速率限制 | 等待15秒或切换平台 |
| S2 返回空结果 | query措辞问题或平台无收录 | 换关键词或换平台 |
| CNKI CAPTCHA | 触发反爬机制 | 停止操作，告知用户 |
| CNKI 页面空白 | JS渲染未完成 | 增加sleep时间 |
| 403 / Cloudflare | 访问被拦截 | 跳过该平台，告知用户 |
